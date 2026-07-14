from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.models import Role
from core.permissions import IsAdminOrStaff, IsOwnerOrAdminOrStaff
from .models import Order
from .serializers import (
    CartSerializer,
    AddToCartSerializer,
    CheckoutSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCancelSerializer,
    OrderStatusUpdateSerializer,
)
from . import services


class CartView(APIView):
    """
    GET  /api/orders/cart/   — returns the customer's current cart
    POST /api/orders/cart/   — add or update a medicine in the cart
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = services.get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            item = services.add_to_cart(
                user=request.user,
                medicine=serializer.validated_data['medicine'],
                quantity=serializer.validated_data['quantity'],
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        cart = services.get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemRemoveView(APIView):
    """
    DELETE /api/orders/cart/<medicine_id>/  — remove a medicine from the cart
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, medicine_id):
        from catalog.models import Medicine
        try:
            medicine = Medicine.objects.get(pk=medicine_id)
        except Medicine.DoesNotExist:
            return Response({'detail': 'Medicine not found.'}, status=status.HTTP_404_NOT_FOUND)

        services.remove_from_cart(request.user, medicine)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/
    Converts the cart into a PENDING order.

    Body: { "delivery_address": "..." }

    - Validates prescription coverage for each medicine that requires it
    - Resolves FIFO batch for each cart item
    - Locks unit_price from batch at this moment
    - Clears the cart on success
    - Stock is NOT deducted here — deduction happens when staff confirms
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = services.checkout(
                user=request.user,
                delivery_address=serializer.validated_data['delivery_address'],
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderListView(generics.ListAPIView):
    """
    GET /api/orders/
        - Customer: their own orders only
        - Staff/admin: all orders, filterable by status
    """
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in (Role.ADMIN, Role.STAFF):
            return Order.objects.select_related('user').all()
        return Order.objects.filter(user=user)


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/<id>/
        - Customer: own orders only
        - Staff/admin: any order
    """
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrStaff]
    owner_field = 'user'

    def get_queryset(self):
        return Order.objects.select_related(
            'user', 'cancelled_by'
        ).prefetch_related('items__batch__medicine')


class OrderCancelView(APIView):
    """
    POST /api/orders/<id>/cancel/
        - Customer: only if status is PENDING
        - Staff/admin: any status except DELIVERED

    Body: { "reason": "..." }  (optional)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = self._get_order(request.user, pk)
        if isinstance(order, Response):
            return order

        user = request.user
        is_staff = user.role in (Role.ADMIN, Role.STAFF)

        # Customers can only cancel PENDING orders
        if not is_staff and order.status not in Order.CUSTOMER_CANCELLABLE_STATUSES:
            return Response(
                {'detail': 'You can only cancel orders that are still pending.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == Order.Status.DELIVERED:
            return Response(
                {'detail': 'Delivered orders cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order.cancel(
            cancelled_by=user,
            reason=serializer.validated_data.get('reason', ''),
        )

        return Response(OrderDetailSerializer(order).data)

    def _get_order(self, user, pk):
        try:
            order = Order.objects.prefetch_related(
                'items__batch'
            ).get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Customers can only access their own orders
        if user.role not in (Role.ADMIN, Role.STAFF) and order.user != user:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        return order


class OrderStatusUpdateView(APIView):
    """
    POST /api/orders/<id>/status/   — staff/admin only
    Moves the order through status stages.

    PENDING → CONFIRMED  : triggers stock deduction (SALE_OUT per item)
    CONFIRMED → PROCESSING
    PROCESSING → SHIPPED
    SHIPPED → DELIVERED
    Any → CANCELLED      : restores stock if already deducted

    Body: { "status": "confirmed", "reason": "..." }
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related(
                'items__batch'
            ).get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(
            data=request.data,
            context={'order': order},
        )
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        reason = serializer.validated_data.get('reason', '')

        if new_status == Order.Status.CANCELLED:
            order.cancel(cancelled_by=request.user, reason=reason)
        elif new_status == Order.Status.CONFIRMED:
            # This triggers SALE_OUT stock deduction
            order.confirm(confirmed_by=request.user)
        elif new_status == Order.Status.SHIPPED:
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
            self._sync_shipment_dispatched(order, request.user)
        elif new_status == Order.Status.DELIVERED:
            from shipment.models import Shipment

            shipment = Shipment.objects.filter(order=order).first()
            if shipment and shipment.status != Shipment.Status.DELIVERED:
                shipment.mark_delivered()  # also syncs order.status -> DELIVERED
            else:
                order.status = new_status
                order.save(update_fields=['status', 'updated_at'])
        else:
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])

        return Response(OrderDetailSerializer(order).data)

    @staticmethod
    def _sync_shipment_dispatched(order, user):
        """Keep the Shipment record in step when an order is marked SHIPPED
        directly from the Orders page instead of via the Shipments workflow."""
        from shipment.models import Shipment

        shipment, _created = Shipment.objects.get_or_create(
            order=order,
            defaults={
                'delivery_address': order.delivery_address,
                'created_by': user,
            },
        )
        if shipment.status == Shipment.Status.PREPARING:
            shipment.dispatch()