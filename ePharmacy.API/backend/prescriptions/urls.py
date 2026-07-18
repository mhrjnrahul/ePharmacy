from django.urls import path
from .views import (
    PrescriptionListCreateView,
    PrescriptionDetailView,
    PrescriptionApproveView,
    PrescriptionRejectView,
    PrescriptionItemListView,
)

app_name = "prescriptions"

urlpatterns = [
    # Customer: upload prescription / list own prescriptions
    # Staff: list all prescriptions, filter by status
    path("", PrescriptionListCreateView.as_view(), name="prescription-list"),
    # Retrieve single prescription (customer: own only, staff: any)
    path("<uuid:pk>/", PrescriptionDetailView.as_view(), name="prescription-detail"),
    # Staff actions
    path(
        "<uuid:pk>/approve/",
        PrescriptionApproveView.as_view(),
        name="prescription-approve",
    ),
    path(
        "<uuid:pk>/reject/",
        PrescriptionRejectView.as_view(),
        name="prescription-reject",
    ),
    # Medicines covered by this prescription
    path(
        "<uuid:pk>/items/",
        PrescriptionItemListView.as_view(),
        name="prescription-items",
    ),
]
