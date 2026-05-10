from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrStaff, IsAdminOrStaffOrReadOnly
from .models import Category, Manufacturer, Medicine, MedicineRelation
from .serializers import (
    CategorySerializer,
    ManufacturerSerializer,
    MedicineListSerializer,
    MedicineDetailSerializer,
    MedicineRelationSerializer,
)


class CategoryListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/catalog/categories/  — public
    POST /api/catalog/categories/  — admin/staff only
    """

    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        qs = Category.objects.all()
        if not (
            self.request.user.is_authenticated
            and self.request.user.role in ("admin", "staff")
        ):
            qs = qs.filter(is_active=True)
        return qs


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/catalog/categories/<id>/  — public
    PUT    /api/catalog/categories/<id>/  — admin/staff only
    DELETE /api/catalog/categories/<id>/  — admin/staff only
    """

    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    queryset = Category.objects.all()


class ManufacturerListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/catalog/manufacturers/  — public
    POST /api/catalog/manufacturers/  — admin/staff only
    """

    serializer_class = ManufacturerSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        qs = Manufacturer.objects.all()
        if not (
            self.request.user.is_authenticated
            and self.request.user.role in ("admin", "staff")
        ):
            qs = qs.filter(is_active=True)
        return qs


class ManufacturerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ManufacturerSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    queryset = Manufacturer.objects.all()


class MedicineListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/catalog/medicines/  — public (no login needed)
    POST /api/catalog/medicines/  — admin/staff only

    Filters:
        ?category=<uuid>
        ?manufacturer=<uuid>
        ?requires_prescription=true
        ?dosage_form=tablet
        ?search=paracetamol
        ?ordering=name
    """

    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        "category",
        "manufacturer",
        "requires_prescription",
        "dosage_form",
    ]
    search_fields = ["name", "description", "strength"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MedicineDetailSerializer
        return MedicineListSerializer

    def get_queryset(self):
        qs = Medicine.objects.select_related("category", "manufacturer")
        # Public users and customers only see active medicines
        if not (
            self.request.user.is_authenticated
            and self.request.user.role in ("admin", "staff")
        ):
            qs = qs.filter(is_active=True)
        return qs


class MedicineDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/catalog/medicines/<id>/  — public
    PUT    /api/catalog/medicines/<id>/  — admin/staff only
    DELETE /api/catalog/medicines/<id>/  — admin/staff only (sets is_active=False)
    """

    serializer_class = MedicineDetailSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]

    def get_queryset(self):
        qs = Medicine.objects.select_related("category", "manufacturer")
        if not (
            self.request.user.is_authenticated
            and self.request.user.role in ("admin", "staff")
        ):
            qs = qs.filter(is_active=True)
        return qs

    def perform_destroy(self, instance):
        # Soft delete — just deactivate, don't remove from DB
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class MedicineRelationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/catalog/medicines/<medicine_id>/relations/  — public
    POST /api/catalog/medicines/<medicine_id>/relations/  — admin/staff only

    Returns all relations where this medicine is the 'from' side.
    Used by the recommendation engine to fetch companion/related medicines.
    """

    serializer_class = MedicineRelationSerializer
    permission_classes = [IsAdminOrStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["relation_type"]

    def get_queryset(self):
        return MedicineRelation.objects.filter(
            from_medicine_id=self.kwargs["medicine_id"]
        ).select_related("from_medicine", "to_medicine")

    def perform_create(self, serializer):
        serializer.save(from_medicine_id=self.kwargs["medicine_id"])


class MedicineRelationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/catalog/relations/<id>/  — admin/staff only
    PUT    /api/catalog/relations/<id>/  — admin/staff only (update weight)
    DELETE /api/catalog/relations/<id>/  — admin/staff only
    """

    serializer_class = MedicineRelationSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = MedicineRelation.objects.select_related("from_medicine", "to_medicine")
