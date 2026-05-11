from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_status = serializers.CharField(source="order.status", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "order_status",
            "gateway",
            "status",
            "amount",
            "transaction_id",
            "gateway_ref",
            "paid_at",
            "refunded_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PaymentInitiateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()

    def validate_order_id(self, value):
        from orders.models import Order

        try:
            order = Order.objects.select_related("payment").get(
                pk=value,
                user=self.context["request"].user,
            )
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found.")

        if order.status != "pending":
            raise serializers.ValidationError(
                f'Cannot initiate payment for an order with status "{order.status}".'
            )

        if (
            hasattr(order, "payment")
            and order.payment.status == Payment.Status.COMPLETED
        ):
            raise serializers.ValidationError("This order has already been paid.")

        self.context["order"] = order
        return value


class PaymentVerifySerializer(serializers.Serializer):
    """
    Fields returned by eSewa on the success redirect URL.
    Frontend extracts these from the redirect query params and sends them here.
    """

    transaction_uuid = serializers.CharField()
    total_amount = serializers.CharField()
    product_code = serializers.CharField(required=False)


class RefundSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)
