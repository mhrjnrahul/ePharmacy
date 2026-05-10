from rest_framework import serializers
from catalog.models import Medicine
from .models import Cart, CartItem, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    requires_prescription = serializers.BooleanField(
        source='medicine.requires_prescription', read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    medicine = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.filter(is_active=True)
    )

    class Meta:
        model = CartItem
        fields = [
            'id', 'medicine', 'medicine_name',
            'requires_prescription', 'quantity', 'subtotal',
        ]
        read_only_fields = ['id']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'updated_at']
        read_only_fields = fields


class AddToCartSerializer(serializers.Serializer):
    medicine = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.filter(is_active=True)
    )
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(min_length=10)


class OrderItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(
        source='batch.medicine.name', read_only=True
    )
    batch_number = serializers.CharField(
        source='batch.batch_number', read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id', 'batch', 'batch_number',
            'medicine_name', 'quantity', 'unit_price', 'subtotal',
        ]
        read_only_fields = fields


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight — for list views."""
    class Meta:
        model = Order
        fields = [
            'id', 'status', 'total_amount',
            'delivery_address', 'created_at',
        ]
        read_only_fields = fields


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full detail — includes all order items."""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'customer_email', 'status', 'status_display',
            'total_amount', 'delivery_address', 'items',
            'cancelled_by', 'cancellation_reason', 'cancelled_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Staff-only: move order through status stages."""

    ALLOWED_TRANSITIONS = {
        Order.Status.PENDING: [Order.Status.CONFIRMED, Order.Status.CANCELLED],
        Order.Status.CONFIRMED: [Order.Status.PROCESSING, Order.Status.CANCELLED],
        Order.Status.PROCESSING: [Order.Status.SHIPPED, Order.Status.CANCELLED],
        Order.Status.SHIPPED: [Order.Status.DELIVERED, Order.Status.CANCELLED],
    }

    status = serializers.ChoiceField(choices=Order.Status.choices)
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        order = self.context['order']
        new_status = attrs['status']
        allowed = self.ALLOWED_TRANSITIONS.get(order.status, [])

        if new_status not in allowed:
            raise serializers.ValidationError(
                f'Cannot move order from "{order.status}" to "{new_status}". '
                f'Allowed: {[s for s in allowed]}'
            )
        return attrs