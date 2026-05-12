from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrStaff, IsOwnerOrAdminOrStaff
from .models import Shipment
from .serializers import (
    ShipmentSerializer,
    ShipmentCreateSerializer,
    ShipmentStatusUpdateSerializer,
)


class ShipmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/shipping/                — admin/staff: all | customer: own only
    POST /api/shipping/                — admin/staff only
         Creates a shipment for a PROCESSING order.
         delivery_address defaults to order.delivery_address if not provided.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            if self.request.user.role not in ("admin", "staff"):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied()
            return ShipmentCreateSerializer
        return ShipmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Shipment.objects.select_related("order__user")
        if user.role in ("admin", "staff"):
            return qs.all()
        return qs.filter(order__user=user)


class ShipmentDetailView(generics.RetrieveAPIView):
    """
    GET /api/shipping/<id>/
        Customer: own shipments only. Staff: any.
    """

    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrStaff]
    owner_field = "order__user"  # not direct — handled in get_queryset

    def get_queryset(self):
        user = self.request.user
        qs = Shipment.objects.select_related("order__user")
        if user.role in ("admin", "staff"):
            return qs.all()
        return qs.filter(order__user=user)


class ShipmentStatusUpdateView(APIView):
    """
    POST /api/shipping/<id>/status/    — admin/staff only

    Moves shipment through status stages and syncs order status.

    PREPARING     → DISPATCHED        : sets dispatched_at, syncs order → SHIPPED
    DISPATCHED    → OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY → DELIVERED      : sets delivered_at, syncs order → DELIVERED
    DISPATCHED / OUT_FOR_DELIVERY → FAILED

    Body: { "status": "dispatched", "tracking_number": "TRK123", "notes": "..." }
    """

    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            shipment = Shipment.objects.select_related("order").get(pk=pk)
        except Shipment.DoesNotExist:
            return Response(
                {"detail": "Shipment not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ShipmentStatusUpdateSerializer(
            data=request.data,
            context={"shipment": shipment},
        )
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        tracking_number = serializer.validated_data.get("tracking_number", "")
        notes = serializer.validated_data.get("notes", "")

        if tracking_number:
            shipment.tracking_number = tracking_number
        if notes:
            shipment.notes = notes

        if new_status == Shipment.Status.DISPATCHED:
            shipment.dispatch(
                tracking_number=tracking_number,
                notes=notes,
            )
            # Sync order to SHIPPED
            order = shipment.order
            if order.status == "processing":
                order.status = "shipped"
                order.save(update_fields=["status", "updated_at"])

        elif new_status == Shipment.Status.DELIVERED:
            shipment.mark_delivered()  # also syncs order to DELIVERED

        else:
            shipment.status = new_status
            shipment.save(
                update_fields=["status", "notes", "tracking_number", "updated_at"]
            )

        return Response(ShipmentSerializer(shipment).data)


class OrderShipmentView(generics.RetrieveAPIView):
    """
    GET /api/shipping/order/<order_id>/
    Convenience endpoint — get shipment by order ID instead of shipment ID.
    Customer: own orders only. Staff: any.
    """

    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        qs = Shipment.objects.select_related("order__user")

        if user.role not in ("admin", "staff"):
            qs = qs.filter(order__user=user)

        try:
            return qs.get(order_id=self.kwargs["order_id"])
        except Shipment.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound("No shipment found for this order.")
