from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdminOrStaff, IsOwnerOrAdminOrStaff
from .models import Prescription, PrescriptionItem
from .serializers import (
    PrescriptionListSerializer,
    PrescriptionDetailSerializer,
    PrescriptionApproveSerializer,
    PrescriptionRejectSerializer,
    PrescriptionItemSerializer,
)


class PrescriptionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/prescriptions/
        - Customer: sees only their own prescriptions
        - Admin/staff: sees all prescriptions, filterable by status

    POST /api/prescriptions/
        - Customer uploads a new prescription (image or PDF)
        - customer field is auto-set from request.user
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PrescriptionDetailSerializer
        return PrescriptionListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "staff"):
            return Prescription.objects.select_related("customer", "reviewed_by").all()
        # Customers only see their own
        return Prescription.objects.filter(customer=user).select_related("reviewed_by")


class PrescriptionDetailView(generics.RetrieveAPIView):
    """
    GET /api/prescriptions/<id>/
        - Customer: can only retrieve their own
        - Admin/staff: can retrieve any
    """

    serializer_class = PrescriptionDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrStaff]
    owner_field = "customer"

    def get_queryset(self):
        return Prescription.objects.select_related(
            "customer", "reviewed_by"
        ).prefetch_related("items__medicine")


class PrescriptionApproveView(APIView):
    """
    POST /api/prescriptions/<id>/approve/
        - Admin/staff only
        - Optionally records which medicines the prescription covers (items[])
        - Sets status = APPROVED, records reviewed_by + reviewed_at

    Body (all optional):
        {
            "notes": "Internal note",
            "items": [
                { "medicine": "<uuid>", "approved_quantity": 2 }
            ]
        }
    """

    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        prescription = self._get_pending_prescription(pk)
        if isinstance(prescription, Response):
            return prescription

        serializer = PrescriptionApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(prescription=prescription, reviewed_by=request.user)

        return Response(
            PrescriptionDetailSerializer(
                prescription, context={"request": request}
            ).data,
            status=status.HTTP_200_OK,
        )

    def _get_pending_prescription(self, pk):
        try:
            prescription = Prescription.objects.get(pk=pk)
        except Prescription.DoesNotExist:
            return Response(
                {"detail": "Prescription not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if prescription.status != Prescription.Status.PENDING:
            return Response(
                {
                    "detail": f'Cannot approve a prescription with status "{prescription.status}".'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return prescription


class PrescriptionRejectView(APIView):
    """
    POST /api/prescriptions/<id>/reject/
        - Admin/staff only
        - Rejection reason is required
        - Sets status = REJECTED, records reviewed_by + reviewed_at + rejection_reason

    Body:
        {
            "reason": "Prescription is expired or illegible.",
            "notes": "Optional internal note"
        }
    """

    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            prescription = Prescription.objects.get(pk=pk)
        except Prescription.DoesNotExist:
            return Response(
                {"detail": "Prescription not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if prescription.status != Prescription.Status.PENDING:
            return Response(
                {
                    "detail": f'Cannot reject a prescription with status "{prescription.status}".'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PrescriptionRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(prescription=prescription, reviewed_by=request.user)

        return Response(
            PrescriptionDetailSerializer(
                prescription, context={"request": request}
            ).data,
            status=status.HTTP_200_OK,
        )


class PrescriptionItemListView(generics.ListAPIView):
    """
    GET /api/prescriptions/<id>/items/
        - Returns medicines linked to an approved prescription
        - Customer can only view their own prescription's items
        - Used by orders app to validate prescription coverage
    """

    serializer_class = PrescriptionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PrescriptionItem.objects.filter(
            prescription_id=self.kwargs["pk"]
        ).select_related("medicine")

        if user.role not in ("admin", "staff"):
            qs = qs.filter(prescription__customer=user)

        return qs
