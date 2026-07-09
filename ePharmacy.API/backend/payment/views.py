from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import Role
from core.permissions import IsAdminOrStaff
from orders.models import Order
from .models import Payment
from .serializers import (
    PaymentSerializer,
    PaymentInitiateSerializer,
    PaymentVerifySerializer,
    RefundSerializer,
)
from . import esewa


class PaymentInitiateView(APIView):
    """
    POST /api/payments/initiate/

    Step 1 of eSewa flow. Customer triggers this after reviewing their order.

    Body: { "order_id": "<uuid>" }

    Returns eSewa form fields. Frontend renders a hidden form and auto-submits
    it to eSewa's payment_url to start the payment process.

    Response:
    {
        "payment_id": "...",
        "esewa_payload": {
            "amount": "500.00",
            "transaction_uuid": "...",
            "signature": "...",
            "payment_url": "https://rc-epay.esewa.com.np/...",
            ...
        }
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentInitiateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.context["order"]

        # Reuse existing PENDING payment if one exists (idempotent)
        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "gateway": Payment.Gateway.ESEWA,
                "status": Payment.Status.PENDING,
                "amount": order.total_amount,
                "gateway_ref": str(order.id),
            },
        )

        payload = esewa.build_payment_payload(order, payment)

        return Response(
            {
                "payment_id": str(payment.id),
                "esewa_payload": payload,
            },
            status=status.HTTP_200_OK,
        )


class PaymentVerifyView(APIView):
    """
    POST /api/payments/verify/

    Step 3 of eSewa flow. Called by frontend after eSewa redirects to success URL.
    eSewa appends transaction data to the success URL as query params.
    Frontend extracts them and POSTs here.

    Body:
    {
        "transaction_uuid": "<payment.id>",
        "total_amount": "500.00",
        "product_code": "EPAYTEST"
    }

    On success:
        - Payment → COMPLETED
        - Order   → CONFIRMED (stock deducted)

    On failure:
        - Payment → FAILED
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        transaction_uuid = serializer.validated_data["transaction_uuid"]
        total_amount = serializer.validated_data["total_amount"]
        product_code = serializer.validated_data.get("product_code")

        # transaction_uuid is the payment.id we sent to eSewa
        try:
            payment = Payment.objects.select_related("order").get(
                id=transaction_uuid,
                order__user=request.user,
            )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment record not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status == Payment.Status.COMPLETED:
            return Response(
                {"detail": "Payment already verified."},
                status=status.HTTP_200_OK,
            )

        # Call eSewa verification API
        success, response_data = esewa.verify_payment(
            transaction_uuid=transaction_uuid,
            total_amount=total_amount,
            product_code=product_code,
        )

        if success:
            payment.status = Payment.Status.COMPLETED
            payment.transaction_id = response_data.get("transaction_code", "")
            payment.gateway_response = response_data
            payment.paid_at = timezone.now()
            payment.save(
                update_fields=[
                    "status",
                    "transaction_id",
                    "gateway_response",
                    "paid_at",
                    "updated_at",
                ]
            )

            # Auto-confirm the order and deduct stock
            order = payment.order
            if order.status == Order.Status.PENDING:
                order.confirm(confirmed_by=None)  # system-confirmed via payment

            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_200_OK,
            )

        else:
            payment.status = Payment.Status.FAILED
            payment.gateway_response = response_data
            payment.save(update_fields=["status", "gateway_response", "updated_at"])

            return Response(
                {"detail": "Payment verification failed.", "gateway": response_data},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PaymentDetailView(APIView):
    """
    GET /api/payments/<order_id>/
    Returns the payment record for a given order.
    Customer: own orders only. Staff: any.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            payment = Payment.objects.select_related("order").get(order_id=order_id)
        except Payment.DoesNotExist:
            return Response(
                {"detail": "No payment found for this order."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if user.role not in (Role.ADMIN, Role.STAFF) and payment.order.user != user:
            return Response(
                {"detail": "No payment found for this order."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(PaymentSerializer(payment).data)


class PaymentRefundView(APIView):
    """
    POST /api/payments/<order_id>/refund/   — admin/staff only

    Marks the payment as REFUNDED.
    Note: eSewa does not have a programmatic refund API —
    refunds are processed manually through eSewa merchant dashboard.
    This endpoint just records that the refund was done.

    Body: { "reason": "Customer returned the medicine." }
    """

    permission_classes = [IsAdminOrStaff]

    def post(self, request, order_id):
        try:
            payment = Payment.objects.select_related("order").get(order_id=order_id)
        except Payment.DoesNotExist:
            return Response(
                {"detail": "No payment found for this order."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status != Payment.Status.COMPLETED:
            return Response(
                {"detail": "Only completed payments can be refunded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment.status = Payment.Status.REFUNDED
        payment.refunded_at = timezone.now()
        payment.save(update_fields=["status", "refunded_at", "updated_at"])

        return Response(PaymentSerializer(payment).data)
