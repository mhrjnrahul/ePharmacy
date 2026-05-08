from rest_framework import serializers
from django.utils import timezone
from .models import Batch, Inventory, StockMovement


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ["id", "quantity_available", "updated_at"]
        read_only_fields = fields


class BatchListSerializer(serializers.ModelSerializer):
    """Lightweight — for list views."""

    medicine_name = serializers.CharField(source="batch.medicine.name", read_only=True)
    quantity_available = serializers.IntegerField(
        source="inventory.quantity_available", read_only=True
    )
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Batch
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "batch_number",
            "expiry_date",
            "selling_price",
            "quantity_available",
            "is_expired",
            "is_active",
        ]


class BatchDetailSerializer(serializers.ModelSerializer):
    """Full detail — for create/retrieve."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    inventory = InventorySerializer(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    # initial_quantity is write-only — used only on POST to seed inventory
    initial_quantity = serializers.IntegerField(write_only=True, min_value=1)

    class Meta:
        model = Batch
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "batch_number",
            "expiry_date",
            "purchase_price",
            "selling_price",
            "is_active",
            "is_expired",
            "inventory",
            "initial_quantity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_expiry_date(self, value):
        if value <= timezone.now().date():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value

    def create(self, validated_data):
        from .models import Inventory, StockMovement

        initial_quantity = validated_data.pop("initial_quantity")
        batch = Batch.objects.create(**validated_data)

        # Create inventory record (use get_or_create to avoid duplicate insert when
        # the post_save signal also creates the Inventory).
        Inventory.objects.get_or_create(batch=batch, defaults={"quantity_available": 0})

        # Record the initial stock as a PURCHASE_IN movement
        StockMovement.record(
            batch=batch,
            movement_type=StockMovement.MovementType.PURCHASE_IN,
            quantity=initial_quantity,
            performed_by=self.context["request"].user,
            reference="Initial stock on batch creation",
        )
        return batch


class StockMovementSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.EmailField(
        source="performed_by.email", read_only=True, default=None
    )
    medicine_name = serializers.CharField(source="batch.medicine.name", read_only=True)
    movement_type_display = serializers.CharField(
        source="get_movement_type_display", read_only=True
    )

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "batch",
            "medicine_name",
            "movement_type",
            "movement_type_display",
            "quantity",
            "quantity_before",
            "quantity_after",
            "performed_by",
            "performed_by_email",
            "reference",
            "notes",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "quantity_before",
            "quantity_after",
            "performed_by",
            "created_at",
        ]

    def create(self, validated_data):
        return StockMovement.record(
            batch=validated_data["batch"],
            movement_type=validated_data["movement_type"],
            quantity=validated_data["quantity"],
            performed_by=self.context["request"].user,
            reference=validated_data.get("reference", ""),
            notes=validated_data.get("notes", ""),
        )


class StockAdjustmentSerializer(serializers.Serializer):
    """
    Dedicated serializer for manual staff adjustments.
    Requires a reason note.
    """

    batch = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    direction = serializers.ChoiceField(choices=["in", "out"])
    notes = serializers.CharField(
        min_length=5, help_text="Reason for adjustment is required."
    )

    def create(self, validated_data):
        movement_type = StockMovement.MovementType.ADJUSTMENT
        return StockMovement.record(
            batch=validated_data["batch"],
            movement_type=movement_type,
            quantity=validated_data["quantity"],
            performed_by=self.context["request"].user,
            reference=f"Manual {validated_data['direction'].upper()} adjustment",
            notes=validated_data["notes"],
        )
