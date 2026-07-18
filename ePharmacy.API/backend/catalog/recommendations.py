"""
catalog/recommendations.py

Recommendation engine — built from scratch, no third-party ML libraries.

THREE recommendation strategies work together:

1. CURATED / CO-PURCHASE RELATIONS (MedicineRelation):
   Uses manually curated + algorithm-updated MedicineRelation records.
   Covers SIDE_EFFECT_COMPANION and FREQUENTLY_BOUGHT_TOGETHER relations.

2. COLLABORATIVE FILTERING (Cosine Similarity):
   Builds a co-purchase matrix from OrderItem history.
   "Customers who bought medicine A also bought medicine B."
   Uses cosine similarity to score how related two medicines are.

3. CONTENT-BASED (Jaccard similarity on composition):
   Parses each medicine's `composition` field into a set of active
   ingredients and scores pairs by Jaccard similarity — independent
   of purchase history, so it works even for medicines nobody has
   bought yet ("cold start"). Also powers substitute lookup for
   out-of-stock medicines (see substitute_recommendations()).

All strategies produce a scored list of medicine UUIDs.
The final result merges them, deduplicates, and ranks by combined score.
"""

import math
from collections import defaultdict

# Shared hybrid-formula weights — how much each signal contributes to the
# combined recommendation score. Composition (0.7) sits between curated
# clinical relations (1.0, pharmacist judgement) and frequently-bought-
# together (0.8, real purchase pattern but noisier), and above raw
# co-purchase CF (0.6), since a shared active ingredient is a structural,
# deterministic signal rather than a popularity-biased one.
RELATION_TYPE_WEIGHTS = {
    "side_effect_companion": 1.0,
    "frequently_bought_together": 0.8,
}
COMPOSITION_WEIGHT = 0.7
COLLABORATIVE_WEIGHT = 0.6


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


# Strategy 3: Content-based (composition / active ingredients)


def parse_composition(composition: str) -> set:
    """Splits a comma-separated composition string into a normalised ingredient set."""
    if not composition:
        return set()
    return {part.strip().lower() for part in composition.split(",") if part.strip()}


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """
    Jaccard similarity between two sets: |A ∩ B| / |A ∪ B|.
    Returns 0.0 to 1.0 — 1.0 means identical ingredient sets.
    """
    if not set_a or not set_b:
        return 0.0
    union = len(set_a | set_b)
    return len(set_a & set_b) / union if union else 0.0


def composition_recommendations(medicine_id: str, top_n: int = 10):
    """
    Finds medicines with overlapping active ingredients using Jaccard
    similarity — a content-based signal that works independently of
    purchase history (helps with cold-start medicines).

    Returns list of (medicine_id, score) sorted by score descending.
    """
    from .models import Medicine

    target = (
        Medicine.objects.filter(pk=medicine_id)
        .values_list("composition", flat=True)
        .first()
    )
    target_set = parse_composition(target or "")
    if not target_set:
        return []

    scores = []
    for m in Medicine.objects.filter(is_active=True).exclude(pk=medicine_id).values(
        "id", "composition"
    ):
        sim = jaccard_similarity(target_set, parse_composition(m["composition"]))
        if sim > 0:
            scores.append((str(m["id"]), sim))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_n]


# Combined recommender
def get_recommendations(medicine_id: str, top_n: int = 8):
    """
    Main entry point. Combines all three strategies with weighted merging.

    Score weights (see RELATION_TYPE_WEIGHTS / COMPOSITION_WEIGHT / COLLABORATIVE_WEIGHT):
        SIDE_EFFECT_COMPANION relation:       weight * 1.0  (clinical — highest priority)
        FREQUENTLY_BOUGHT_TOGETHER relation:  weight * 0.8
        Composition (Jaccard) similarity:     sim * 0.7
        Collaborative filtering score:        cosine * 0.6

    Medicines appearing in multiple strategies get their scores summed,
    so strong signals from multiple sources naturally rank highest.
    """
    medicine_id = str(medicine_id)
    combined_scores = defaultdict(float)

    for med_id, weight, relation_type in relation_based_recommendations(
        medicine_id, top_n=top_n * 2
    ):
        multiplier = RELATION_TYPE_WEIGHTS.get(relation_type, 0.5)
        combined_scores[med_id] += weight * multiplier

    for med_id, sim in composition_recommendations(medicine_id, top_n=top_n * 2):
        combined_scores[med_id] += sim * COMPOSITION_WEIGHT

    medicine_vectors = build_co_purchase_matrix()
    for med_id, score in collaborative_recommendations(
        medicine_id, medicine_vectors, top_n=top_n * 2
    ):
        combined_scores[med_id] += score * COLLABORATIVE_WEIGHT

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

    for medicine_id in cart_set:
        for med_id, weight, relation_type in relation_based_recommendations(
            medicine_id, top_n=10
        ):
            if med_id not in cart_set:
                multiplier = RELATION_TYPE_WEIGHTS.get(relation_type, 0.5)
                combined_scores[med_id] += weight * multiplier

        for med_id, sim in composition_recommendations(medicine_id, top_n=10):
            if med_id not in cart_set:
                combined_scores[med_id] += sim * COMPOSITION_WEIGHT

        for med_id, score in collaborative_recommendations(
            medicine_id, medicine_vectors, top_n=10
        ):
            if med_id not in cart_set:
                combined_scores[med_id] += score * COLLABORATIVE_WEIGHT

    ranked = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
    return [mid for mid, _ in ranked[:top_n]]


# Substitute lookup (out-of-stock → in-stock alternatives)
def substitute_recommendations(medicine_id: str, top_n: int = 6):
    """
    Finds substitute medicines for a given (often out-of-stock) medicine.

    Score = composition Jaccard similarity (primary signal) + a small
    category/dosage-form match bonus (fallback signal so the feature still
    surfaces something useful for medicines that don't have composition
    data filled in yet — a simple cold-start mitigation).

    Stock filtering is NOT done here — the caller (MedicineSubstituteView)
    filters to in-stock medicines after ranking, since stock is computed
    from batch data, not stored on Medicine.

    Returns list of medicine_id strings, ranked highest-score first.
    """
    from django.db.models import Q
    from .models import Medicine

    medicine = Medicine.objects.filter(pk=medicine_id).first()
    if not medicine:
        return []

    scores = defaultdict(float)
    for med_id, sim in composition_recommendations(medicine_id, top_n=50):
        scores[med_id] += sim

    candidates = (
        Medicine.objects.filter(is_active=True)
        .exclude(pk=medicine_id)
        .filter(Q(category_id=medicine.category_id) | Q(dosage_form=medicine.dosage_form))
        .values("id", "category_id", "dosage_form")
    )
    for m in candidates:
        mid = str(m["id"])
        bonus = 0.0
        if m["category_id"] == medicine.category_id:
            bonus += 0.2
        if m["dosage_form"] == medicine.dosage_form:
            bonus += 0.1
        scores[mid] += bonus

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [mid for mid, score in ranked if score > 0][:top_n]


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
