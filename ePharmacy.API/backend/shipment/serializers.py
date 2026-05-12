from rest_framework import serializers
from orders.models import Order
from .models import Shipment


class ShipmentSerializer(serializers.ModelSerializer):
    order_status = serializers.CharField(source="order.status", read_only=True)
    customer_email = serializers.EmailField(source="order.user.email", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order",
            "order_status",
            "customer_email",
            "status",
            "status_display",
            "tracking_number",
            "carrier",
            "delivery_address",
            "dispatched_at",
            "delivered_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_status",
            "customer_email",
            "status_display",
            "dispatched_at",
            "delivered_at",
            "created_at",
            "updated_at",
        ]


class ShipmentCreateSerializer(serializers.ModelSerializer):
    """Staff creates a shipment for a PROCESSING order."""

    order = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.filter(status="processing")
    )

    class Meta:
        model = Shipment
        fields = ["order", "tracking_number", "carrier", "delivery_address", "notes"]

    def validate_order(self, order):
        if hasattr(order, "shipment"):
            raise serializers.ValidationError(
                "A shipment already exists for this order."
            )
        return order

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        validated_data["delivery_address"] = (
            validated_data.get("delivery_address")
            or validated_data["order"].delivery_address
        )
        return super().create(validated_data)


class ShipmentDispatchSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    carrier = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class ShipmentStatusUpdateSerializer(serializers.Serializer):
    ALLOWED_TRANSITIONS = {
        Shipment.Status.PREPARING: [Shipment.Status.DISPATCHED],
        Shipment.Status.DISPATCHED: [
            Shipment.Status.OUT_FOR_DELIVERY,
            Shipment.Status.FAILED,
        ],
        Shipment.Status.OUT_FOR_DELIVERY: [
            Shipment.Status.DELIVERED,
            Shipment.Status.FAILED,
        ],
    }

    status = serializers.ChoiceField(choices=Shipment.Status.choices)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        shipment = self.context["shipment"]
        new_status = attrs["status"]
        allowed = self.ALLOWED_TRANSITIONS.get(shipment.status, [])

        if new_status not in allowed:
            raise serializers.ValidationError(
                f'Cannot move shipment from "{shipment.status}" to "{new_status}". '
                f"Allowed: {list(allowed)}"
            )
        return attrs
