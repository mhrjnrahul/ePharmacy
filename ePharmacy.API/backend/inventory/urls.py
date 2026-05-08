from django.urls import path
from .views import (
    BatchListCreateView,
    BatchDetailView,
    StockMovementListView,
    BatchStockMovementListView,
    StockAdjustmentView,
    InventorySummaryView,
)

app_name = "inventory"

urlpatterns = [
    # Dashboard summary
    path("summary/", InventorySummaryView.as_view(), name="inventory-summary"),
    # Batches
    path("batches/", BatchListCreateView.as_view(), name="batch-list"),
    path("batches/<uuid:pk>/", BatchDetailView.as_view(), name="batch-detail"),
    path(
        "batches/<uuid:batch_id>/movements/",
        BatchStockMovementListView.as_view(),
        name="batch-movement-list",
    ),
    # Stock movements ledger
    path("movements/", StockMovementListView.as_view(), name="movement-list"),
    # Manual adjustment
    path("adjust/", StockAdjustmentView.as_view(), name="stock-adjust"),
]
