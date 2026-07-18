from rest_framework import serializers
from .models import Prescription, PrescriptionItem


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    is_used = serializers.BooleanField(read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = ["id", "medicine", "medicine_name", "approved_quantity", "is_used"]
        read_only_fields = ["id", "is_used"]


class PrescriptionListSerializer(serializers.ModelSerializer):
    """Lightweight — for list views."""

    customer_email = serializers.EmailField(source="customer.email", read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "id",
            "customer",
            "customer_email",
            "status",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = fields


class PrescriptionDetailSerializer(serializers.ModelSerializer):
    """Full detail — used by customer (upload) and staff (review)."""

    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    reviewed_by_email = serializers.EmailField(
        source="reviewed_by.email", read_only=True, default=None
    )
    items = PrescriptionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "id",
            "customer",
            "customer_email",
            "image",
            "status",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "rejection_reason",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "customer",
            "status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        # Customer is always set from request.user, never from request body
        validated_data["customer"] = self.context["request"].user
        return super().create(validated_data)


class PrescriptionApproveSerializer(serializers.Serializer):
    """
    Used by staff to approve a prescription and optionally
    record which medicines it covers.
    """

    notes = serializers.CharField(required=False, allow_blank=True)
    items = PrescriptionItemSerializer(many=True, required=False)

    def validate_items(self, items):
        # Ensure no duplicate medicines in one approval
        medicine_ids = [item["medicine"].id for item in items]
        if len(medicine_ids) != len(set(medicine_ids)):
            raise serializers.ValidationError(
                "Duplicate medicines in prescription items."
            )
        return items

    def save(self, prescription, reviewed_by):
        items_data = self.validated_data.get("items", [])
        notes = self.validated_data.get("notes", "")

        if notes:
            prescription.notes = notes

        prescription.approve(reviewed_by=reviewed_by)

        # Create PrescriptionItems for each approved medicine
        for item in items_data:
            PrescriptionItem.objects.update_or_create(
                prescription=prescription,
                medicine=item["medicine"],
                defaults={"approved_quantity": item["approved_quantity"]},
            )

        return prescription


class PrescriptionRejectSerializer(serializers.Serializer):
    """Used by staff to reject a prescription. Reason is mandatory."""

    reason = serializers.CharField(min_length=5)
    notes = serializers.CharField(required=False, allow_blank=True)

    def save(self, prescription, reviewed_by):
        notes = self.validated_data.get("notes", "")
        if notes:
            prescription.notes = notes
        prescription.reject(
            reviewed_by=reviewed_by,
            reason=self.validated_data["reason"],
        )
        return prescription
