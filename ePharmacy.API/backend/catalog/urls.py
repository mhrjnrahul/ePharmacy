from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ManufacturerListCreateView,
    ManufacturerDetailView,
    MedicineListCreateView,
    MedicineDetailView,
    MedicineRelationListCreateView,
    MedicineRelationDetailView,
    MedicineRecommendationView,
    CartRecommendationView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<uuid:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path(
        "manufacturers/", ManufacturerListCreateView.as_view(), name="manufacturer-list"
    ),
    path(
        "manufacturers/<uuid:pk>/",
        ManufacturerDetailView.as_view(),
        name="manufacturer-detail",
    ),
    path("medicines/", MedicineListCreateView.as_view(), name="medicine-list"),
    path("medicines/<uuid:pk>/", MedicineDetailView.as_view(), name="medicine-detail"),
    path(
        "medicines/<uuid:medicine_id>/relations/",
        MedicineRelationListCreateView.as_view(),
        name="medicine-relation-list",
    ),
    path(
        "relations/<uuid:pk>/",
        MedicineRelationDetailView.as_view(),
        name="medicine-relation-detail",
    ),
    path(
        "medicines/<uuid:pk>/recommendations/",
        MedicineRecommendationView.as_view(),
        name="medicine-recommendations",
    ),
    path(
        "recommendations/cart/",
        CartRecommendationView.as_view(),
        name="cart-recommendations",
    ),
]
