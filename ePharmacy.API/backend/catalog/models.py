from django.db import models
from core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "catalog_category"
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Manufacturer(TimeStampedModel):
    name = models.CharField(max_length=200, unique=True)
    contact_info = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "catalog_manufacturer"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Medicine(TimeStampedModel):
    class DosageForm(models.TextChoices):
        TABLET = "tablet", "Tablet"
        CAPSULE = "capsule", "Capsule"
        SYRUP = "syrup", "Syrup"
        INJECTION = "injection", "Injection"
        CREAM = "cream", "Cream"
        DROPS = "drops", "Drops"
        INHALER = "inhaler", "Inhaler"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,  # prevent deleting a category that has medicines
        related_name="medicines",
    )
    manufacturer = models.ForeignKey(
        Manufacturer,
        on_delete=models.PROTECT,
        related_name="medicines",
    )
    requires_prescription = models.BooleanField(default=False)
    dosage_form = models.CharField(max_length=20, choices=DosageForm.choices)
    strength = models.CharField(
        max_length=50,
        help_text="e.g. 500mg, 10mg/5ml",
    )
    image = models.ImageField(
        upload_to="medicines/",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "catalog_medicine"
        ordering = ["name"]
        # same medicine name can exist with different strengths or dosage forms
        unique_together = [("name", "strength", "dosage_form")]

    def __str__(self):
        return f"{self.name} {self.strength} ({self.get_dosage_form_display()})"


class MedicineRelation(TimeStampedModel):
    """
    Stores relationships between medicines used by the recommendation engine.

    SIDE_EFFECT_COMPANION:
        Medicine B is commonly prescribed alongside medicine A to manage
        A's side effects. e.g. omeprazole (B) with ibuprofen (A).
        This relation is directional — from is the primary medicine.

    FREQUENTLY_BOUGHT_TOGETHER:
        Populated from co-purchase data in OrderItem.
        Can be seeded manually by staff and updated by the algorithm.
        This relation is non-directional — we store both directions
        (A→B and B→A) for simpler querying.
    """

    class RelationType(models.TextChoices):
        SIDE_EFFECT_COMPANION = "side_effect_companion", "Side effect companion"
        FREQUENTLY_BOUGHT_TOGETHER = (
            "frequently_bought_together",
            "Frequently bought together",
        )

    from_medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="relations_from",
    )
    to_medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="relations_to",
    )
    relation_type = models.CharField(max_length=30, choices=RelationType.choices)

    # Weight used by cosine similarity — higher means stronger relation.
    # Staff set this manually for SIDE_EFFECT_COMPANION.
    # Algorithm updates this for FREQUENTLY_BOUGHT_TOGETHER based on co-purchase count.
    weight = models.FloatField(
        default=1.0,
        help_text="Relation strength used by recommendation engine (0.0 - 1.0)",
    )

    class Meta:
        db_table = "catalog_medicine_relation"
        unique_together = [("from_medicine", "to_medicine", "relation_type")]

    def __str__(self):
        return (
            f"{self.from_medicine.name} → {self.to_medicine.name} "
            f"({self.get_relation_type_display()})"
        )
