from django.urls import path
from .views import (
    ShipmentListCreateView,
    ShipmentDetailView,
    ShipmentStatusUpdateView,
    OrderShipmentView,
)

app_name = "shipping"

urlpatterns = [
    # List all shipments (filtered by role) / create shipment for an order
    path("", ShipmentListCreateView.as_view(), name="shipment-list"),
    # Shipment detail by shipment ID
    path("<uuid:pk>/", ShipmentDetailView.as_view(), name="shipment-detail"),
    # Move shipment through status stages
    path(
        "<uuid:pk>/status/", ShipmentStatusUpdateView.as_view(), name="shipment-status"
    ),
    # Convenience: get shipment by order ID
    path("order/<uuid:order_id>/", OrderShipmentView.as_view(), name="order-shipment"),
]
