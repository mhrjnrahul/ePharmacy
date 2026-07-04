from rest_framework import serializers
from django.utils import timezone

from inventory.models import Batch
from .models import Category, Manufacturer, Medicine, MedicineRelation


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = ["id", "name", "contact_info", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class MedicinePriceMixin:
    customer_price = serializers.SerializerMethodField()

    def _get_fifo_priced_batch(self, obj):
        # Use prefetched data from queryset optimization when present.
        prefetched = getattr(obj, "priced_batches", None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None

        today = timezone.now().date()
        return (
            Batch.objects.filter(
                medicine=obj,
                is_active=True,
                expiry_date__gt=today,
                inventory__quantity_available__gt=0,
            )
            .select_related("inventory")
            .order_by("expiry_date")
            .first()
        )

    def get_customer_price(self, obj):
        batch = self._get_fifo_priced_batch(obj)
        if not batch:
            return None
        return batch.selling_price


class MedicineListSerializer(MedicinePriceMixin, serializers.ModelSerializer):
    """Lightweight serializer for list endpoints — no nested objects."""

    customer_price = serializers.SerializerMethodField()
    category_name = serializers.CharField(
        source="category.name", read_only=True
    )
    manufacturer_name = serializers.CharField(
        source="manufacturer.name", read_only=True
    )
    dosage_form_display = serializers.CharField(
        source="get_dosage_form_display", read_only=True
    )

    class Meta:
        model = Medicine
        fields = [
            "id",
            "name",
            "strength",
            "dosage_form",
            "dosage_form_display",
            "category_name",
            "manufacturer_name",
            "customer_price",
            "requires_prescription",
            "image",
            "is_active",
        ]


class MedicineDetailSerializer(
    MedicinePriceMixin,
    serializers.ModelSerializer,
):
    """Full serializer for retrieve, create, update."""

    customer_price = serializers.SerializerMethodField()
    category_name = serializers.CharField(
        source="category.name", read_only=True
    )
    manufacturer_name = serializers.CharField(
        source="manufacturer.name", read_only=True
    )
    dosage_form_display = serializers.CharField(
        source="get_dosage_form_display", read_only=True
    )

    class Meta:
        model = Medicine
        fields = [
            "id",
            "name",
            "description",
            "category",
            "category_name",
            "manufacturer",
            "manufacturer_name",
            "customer_price",
            "requires_prescription",
            "dosage_form",
            "dosage_form_display",
            "strength",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MedicineRelationSerializer(serializers.ModelSerializer):
    from_medicine_name = serializers.CharField(
        source="from_medicine.name", read_only=True
    )
    to_medicine_name = serializers.CharField(
        source="to_medicine.name", read_only=True
    )

    class Meta:
        model = MedicineRelation
        fields = [
            "id",
            "from_medicine",
            "from_medicine_name",
            "to_medicine",
            "to_medicine_name",
            "relation_type",
            "weight",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["from_medicine"] == attrs["to_medicine"]:
            raise serializers.ValidationError(
                "A medicine cannot have a relation with itself."
            )
        return attrs
