"""
catalog/recommendations.py

Recommendation engine — built from scratch, no third-party ML libraries.

TWO recommendation strategies work together:

1. CONTENT-BASED (MedicineRelation):
   Uses manually curated + algorithm-updated MedicineRelation records.
   Covers SIDE_EFFECT_COMPANION and FREQUENTLY_BOUGHT_TOGETHER relations.

2. COLLABORATIVE FILTERING (Cosine Similarity):
   Builds a co-purchase matrix from OrderItem history.
   "Customers who bought medicine A also bought medicine B."
   Uses cosine similarity to score how related two medicines are.

Both strategies produce a scored list of medicine UUIDs.
The final result merges both, deduplicates, and ranks by combined score.
"""

import math
from collections import defaultdict


def dot_product(vec_a: dict, vec_b: dict) -> float:
    """
    Dot product of two sparse vectors represented as dicts.
    Only iterates over the smaller vector for efficiency.
    """
    if len(vec_a) > len(vec_b):
        vec_a, vec_b = vec_b, vec_a
    return sum(vec_a[k] * vec_b[k] for k in vec_a if k in vec_b)


def magnitude(vec: dict) -> float:
    """Euclidean magnitude of a sparse vector."""
    return math.sqrt(sum(v * v for v in vec.values()))


def cosine_similarity(vec_a: dict, vec_b: dict) -> float:
    """
    Cosine similarity between two sparse vectors.
    Returns value between 0.0 (no overlap) and 1.0 (identical).

    Formula: cos(theta) = (A . B) / (|A| x |B|)

    Using sparse dict representation because most medicines are not
    bought together — a full matrix would be mostly zeros.
    """
    if not vec_a or not vec_b:
        return 0.0
    mag_a = magnitude(vec_a)
    mag_b = magnitude(vec_b)
    if mag_a == 0.0 or mag_b == 0.0:
        return 0.0
    return dot_product(vec_a, vec_b) / (mag_a * mag_b)


# Co-purchase matrix builder
def build_co_purchase_matrix():
    """
    Reads all completed OrderItems and builds a co-purchase frequency matrix.

    Returns:
        medicine_vectors: dict[medicine_id -> dict[other_medicine_id -> count]]

    Example:
        If orders contain:
            Order 1: [Paracetamol, Omeprazole]
            Order 2: [Paracetamol, Ibuprofen]
            Order 3: [Paracetamol, Omeprazole, Ibuprofen]

        Then medicine_vectors['paracetamol_id'] = {
            'omeprazole_id': 2,
            'ibuprofen_id':  2,
        }

    Only uses CONFIRMED/DELIVERED orders to avoid noise from cancelled ones.
    """
    from orders.models import OrderItem

    order_items = (
        OrderItem.objects.filter(
            order__status__in=["confirmed", "processing", "shipped", "delivered"]
        )
        .values("order_id", "batch__medicine_id")
        .order_by("order_id")
    )

    orders_to_medicines = defaultdict(list)
    for item in order_items:
        order_id = str(item["order_id"])
        medicine_id = str(item["batch__medicine_id"])
        orders_to_medicines[order_id].append(medicine_id)

    medicine_vectors = defaultdict(lambda: defaultdict(float))

    for medicine_ids in orders_to_medicines.values():
        for med_a in medicine_ids:
            for med_b in medicine_ids:
                if med_a != med_b:
                    medicine_vectors[med_a][med_b] += 1.0

    return medicine_vectors


# Strategy 1: Collaborative filtering


def collaborative_recommendations(
    medicine_id: str, medicine_vectors: dict, top_n: int = 10
):
    """
    Finds the most similar medicines using cosine similarity on co-purchase vectors.

    Each medicine is represented as a vector:
        medicine_vectors[A] = {B: 3, C: 1, D: 5, ...}
        meaning A was bought with B 3 times, C once, D 5 times.

    Cosine similarity between A and X measures how similar their
    buying patterns are — not just raw counts but the angle between
    their purchase behaviour vectors.

    Returns list of (medicine_id, score) sorted by score descending.
    """
    target_vec = medicine_vectors.get(medicine_id, {})
    if not target_vec:
        return []

    scores = []
    for other_id, other_vec in medicine_vectors.items():
        if other_id == medicine_id:
            continue
        sim = cosine_similarity(target_vec, dict(other_vec))
        if sim > 0:
            scores.append((other_id, sim))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_n]


# Strategy 2: Content-based (MedicineRelation)


def relation_based_recommendations(medicine_id: str, top_n: int = 10):
    """
    Fetches MedicineRelation records and returns related medicines
    scored by their weight field.

    SIDE_EFFECT_COMPANION: weight set manually by staff (clinical knowledge).
    FREQUENTLY_BOUGHT_TOGETHER: weight updated by update_relation_weights().

    Returns list of (medicine_id, score, relation_type).
    """
    from .models import MedicineRelation

    relations = (
        MedicineRelation.objects.filter(from_medicine_id=medicine_id)
        .select_related("to_medicine")
        .order_by("-weight")[:top_n]
    )

    return [
        (str(r.to_medicine_id), r.weight, r.relation_type)
        for r in relations
        if r.to_medicine.is_active
    ]


# Combined recommender
def get_recommendations(medicine_id: str, top_n: int = 8):
    """
    Main entry point. Combines both strategies with weighted merging.

    Score weights:
        SIDE_EFFECT_COMPANION relation:       weight * 1.0  (clinical — highest priority)
        FREQUENTLY_BOUGHT_TOGETHER relation:  weight * 0.8
        Collaborative filtering score:        cosine * 0.6

    Medicines appearing in both strategies get their scores summed,
    so strong signals from multiple sources naturally rank highest.
    """
    medicine_id = str(medicine_id)
    combined_scores = defaultdict(float)

    relation_type_weights = {
        "side_effect_companion": 1.0,
        "frequently_bought_together": 0.8,
    }

    for med_id, weight, relation_type in relation_based_recommendations(
        medicine_id, top_n=top_n * 2
    ):
        multiplier = relation_type_weights.get(relation_type, 0.5)
        combined_scores[med_id] += weight * multiplier

    medicine_vectors = build_co_purchase_matrix()
    for med_id, score in collaborative_recommendations(
        medicine_id, medicine_vectors, top_n=top_n * 2
    ):
        combined_scores[med_id] += score * 0.6

    ranked = sorted(
        [(mid, score) for mid, score in combined_scores.items() if mid != medicine_id],
        key=lambda x: x[1],
        reverse=True,
    )
    return [mid for mid, _ in ranked[:top_n]]


def get_cart_recommendations(medicine_ids: list, top_n: int = 6):
    """
    Recommendations for a customer's entire cart.
    Runs the full recommendation logic for each medicine in the cart,
    merges all scores, and excludes medicines already in the cart.

    Used on the cart page: "You might also need..."
    """
    cart_set = {str(mid) for mid in medicine_ids}
    combined_scores = defaultdict(float)
    medicine_vectors = build_co_purchase_matrix()

    relation_type_weights = {
        "side_effect_companion": 1.0,
        "frequently_bought_together": 0.8,
    }

    for medicine_id in cart_set:
        for med_id, weight, relation_type in relation_based_recommendations(
            medicine_id, top_n=10
        ):
            if med_id not in cart_set:
                multiplier = relation_type_weights.get(relation_type, 0.5)
                combined_scores[med_id] += weight * multiplier

        for med_id, score in collaborative_recommendations(
            medicine_id, medicine_vectors, top_n=10
        ):
            if med_id not in cart_set:
                combined_scores[med_id] += score * 0.6

    ranked = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
    return [mid for mid, _ in ranked[:top_n]]


# Weight updater (run periodically)
def update_relation_weights():
    """
    Recalculates weights on all FREQUENTLY_BOUGHT_TOGETHER MedicineRelation
    records based on current co-purchase data. Run this daily via cron or Celery.

    Normalisation:
        raw_score = co-purchase count for pair (A, B)
        max_score = highest count across all pairs
        weight    = raw_score / max_score   -> range: 0.0 to 1.0

    The most co-purchased pair always gets weight=1.0.
    All others scale relative to it.
    """
    from .models import MedicineRelation

    medicine_vectors = build_co_purchase_matrix()
    if not medicine_vectors:
        return {"updated": 0, "created": 0}

    max_count = max(
        count for vec in medicine_vectors.values() for count in vec.values()
    )
    if max_count == 0:
        return {"updated": 0, "created": 0}

    updated = 0
    created = 0

    for med_a_id, co_counts in medicine_vectors.items():
        for med_b_id, count in co_counts.items():
            normalised_weight = round(count / max_count, 4)
            _, was_created = MedicineRelation.objects.update_or_create(
                from_medicine_id=med_a_id,
                to_medicine_id=med_b_id,
                relation_type=MedicineRelation.RelationType.FREQUENTLY_BOUGHT_TOGETHER,
                defaults={"weight": normalised_weight},
            )
            if was_created:
                created += 1
            else:
                updated += 1

    return {"updated": updated, "created": created}
