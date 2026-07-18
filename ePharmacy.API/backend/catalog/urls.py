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
    MedicineSubstituteView,
    CartRecommendationView,
    RecommendationRebuildView,
    PopularMedicineView,
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
    path(
        "medicines/popular/",
        PopularMedicineView.as_view(),
        name="medicine-popular",
    ),
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
        "medicines/<uuid:pk>/substitutes/",
        MedicineSubstituteView.as_view(),
        name="medicine-substitutes",
    ),
    path(
        "recommendations/cart/",
        CartRecommendationView.as_view(),
        name="cart-recommendations",
    ),
    path(
        "recommendations/rebuild/",
        RecommendationRebuildView.as_view(),
        name="recommendations-rebuild",
    ),
]
