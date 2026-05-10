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


class InventorySummaryView(APIView):
    """
    GET /api/inventory/summary/            — admin/staff only

    Returns:
        - Low stock batches (quantity < 10)
        - Expired or expiring within 30 days
        - Total active batches count
    """

    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        expiry_warning_date = today + timedelta(days=30)

        low_stock = (
            Inventory.objects.filter(
                quantity_available__lt=10,
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
                "low_stock_count": low_stock.count(),
                "low_stock_batches": BatchListSerializer(
                    low_stock.values_list("batch", flat=True), many=True
                ).data
                if False
                else [
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
