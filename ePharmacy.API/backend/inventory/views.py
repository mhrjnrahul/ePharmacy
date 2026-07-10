from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrStaff
from .models import Batch, Inventory, StockMovement
from .serializers import (
    BatchListSerializer,
    BatchDetailSerializer,
    StockMovementSerializer,
    StockAdjustmentSerializer,
)


class BatchListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/inventory/batches/           — admin/staff only
    POST /api/inventory/batches/           — admin/staff only

    POST body also accepts `initial_quantity` to seed stock on creation.

    Filters:
        ?medicine=<uuid>
        ?is_active=true
        ?ordering=expiry_date  (default FIFO)
    """

    permission_classes = [IsAdminOrStaff]
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    filterset_fields = ["medicine", "is_active"]
    search_fields = ["batch_number", "medicine__name"]
    ordering_fields = ["expiry_date", "created_at", "selling_price"]
    ordering = ["expiry_date"]  # FIFO by default

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BatchDetailSerializer
        return BatchListSerializer

    def get_queryset(self):
        return Batch.objects.select_related("medicine", "inventory").all()


class BatchDetailView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/inventory/batches/<id>/     — admin/staff only
    PUT  /api/inventory/batches/<id>/     — admin/staff only
         (e.g. update selling_price or mark is_active=False for expired batches)

    No DELETE — batches are permanent records for order history integrity.
    """

    serializer_class = BatchDetailSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        return Batch.objects.select_related("medicine", "inventory")


class StockMovementListView(generics.ListAPIView):
    """
    GET /api/inventory/movements/          — admin/staff only

    Full stock movement ledger. Read-only — movements are never edited.

    Filters:
        ?batch=<uuid>
        ?movement_type=purchase_in
        ?ordering=-created_at
    """

    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["batch", "movement_type", "performed_by"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return StockMovement.objects.select_related(
            "batch__medicine", "performed_by"
        ).all()


class BatchStockMovementListView(generics.ListAPIView):
    """
    GET /api/inventory/batches/<batch_id>/movements/  — admin/staff only

    All stock movements for a specific batch.
    Useful for tracing exactly what happened to a batch over time.
    """

    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        return (
            StockMovement.objects.filter(batch_id=self.kwargs["batch_id"])
            .select_related("batch__medicine", "performed_by")
            .order_by("-created_at")
        )


class StockAdjustmentView(APIView):
    """
    POST /api/inventory/adjust/            — admin/staff only

    Manual stock adjustment — requires a reason note.
    Use for: damaged goods, recount corrections, write-offs.

    Body:
        {
            "batch": "<uuid>",
            "quantity": 10,
            "direction": "in" | "out",
            "notes": "Damaged during delivery"
        }
    """

    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        serializer = StockAdjustmentSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        movement = serializer.save()
        return Response(
            StockMovementSerializer(movement).data,
            status=status.HTTP_201_CREATED,
        )


class BatchWriteOffView(APIView):
    """
    POST /api/inventory/batches/<id>/write-off/   — admin/staff only

    Writes off an expired batch:
      - Records an EXPIRED_OUT movement for the remaining quantity
      - Deactivates the batch so it disappears from stock and alerts

    Only allowed on batches whose expiry_date has passed.

    Body (optional):
        { "notes": "Disposed per pharmacy policy" }
    """

    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            batch = Batch.objects.select_related("medicine", "inventory").get(pk=pk)
        except Batch.DoesNotExist:
            return Response(
                {"detail": "Batch not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if not batch.is_expired:
            return Response(
                {
                    "detail": (
                        f"Batch {batch.batch_number} has not expired yet "
                        f"(expiry: {batch.expiry_date}). Use /adjust/ for "
                        f"damaged or lost stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not batch.is_active and batch.inventory.quantity_available == 0:
            return Response(
                {"detail": "Batch is already written off."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quantity_written_off = batch.inventory.quantity_available
        movement = None
        if quantity_written_off > 0:
            movement = StockMovement.record(
                batch=batch,
                movement_type=StockMovement.MovementType.EXPIRED_OUT,
                quantity=quantity_written_off,
                performed_by=request.user,
                reference=f"Expired write-off — batch {batch.batch_number}",
                notes=request.data.get("notes", ""),
            )

        if batch.is_active:
            batch.is_active = False
            batch.save(update_fields=["is_active", "updated_at"])

        return Response(
            {
                "detail": f"Batch {batch.batch_number} written off.",
                "quantity_written_off": quantity_written_off,
                "movement": (
                    StockMovementSerializer(movement).data if movement else None
                ),
            }
        )


class InventorySummaryView(APIView):
    """
    GET /api/inventory/summary/            — admin/staff only

    Returns:
        - Low stock batches (quantity below threshold)
        - Expired or expiring within the warning window
        - Total active batches count

    Query params:
        ?low_stock_threshold=10   (default 10)
        ?expiry_days=30           (default 30)
    """

    permission_classes = [IsAdminOrStaff]

    @staticmethod
    def _int_param(request, name, default):
        try:
            value = int(request.query_params.get(name, default))
        except ValueError:
            return default
        return value if value > 0 else default

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        low_stock_threshold = self._int_param(request, "low_stock_threshold", 10)
        expiry_days = self._int_param(request, "expiry_days", 30)

        today = timezone.now().date()
        expiry_warning_date = today + timedelta(days=expiry_days)

        low_stock = (
            Inventory.objects.filter(
                quantity_available__lt=low_stock_threshold,
                batch__is_active=True,
            )
            .select_related("batch__medicine")
            .order_by("quantity_available")
        )

        expiring_soon = Batch.objects.filter(
            is_active=True,
            expiry_date__lte=expiry_warning_date,
            expiry_date__gte=today,
        ).select_related("medicine", "inventory")

        expired = Batch.objects.filter(
            is_active=True,
            expiry_date__lt=today,
        ).select_related("medicine")

        return Response(
            {
                "total_active_batches": Batch.objects.filter(is_active=True).count(),
                "low_stock_threshold": low_stock_threshold,
                "expiry_days": expiry_days,
                "low_stock_count": low_stock.count(),
                "low_stock_batches": [
                    {
                        "batch_id": str(inv.batch.id),
                        "medicine": inv.batch.medicine.name,
                        "batch_number": inv.batch.batch_number,
                        "quantity_available": inv.quantity_available,
                    }
                    for inv in low_stock
                ],
                "expiring_soon_count": expiring_soon.count(),
                "expiring_soon_batches": [
                    {
                        "batch_id": str(b.id),
                        "medicine": b.medicine.name,
                        "batch_number": b.batch_number,
                        "expiry_date": b.expiry_date,
                        "quantity_available": b.inventory.quantity_available,
                    }
                    for b in expiring_soon
                ],
                "expired_active_count": expired.count(),
                "expired_batches": [
                    {
                        "batch_id": str(b.id),
                        "medicine": b.medicine.name,
                        "batch_number": b.batch_number,
                        "expiry_date": b.expiry_date,
                    }
                    for b in expired
                ],
            }
        )
