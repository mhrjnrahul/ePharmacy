from django.urls import path
from .views import (
    PaymentInitiateView,
    PaymentVerifyView,
    PaymentTestCompleteView,
    PaymentDetailView,
    PaymentRefundView,
)

urlpatterns = [
    # Step 1 — customer initiates payment, gets eSewa form fields
    path("initiate/", PaymentInitiateView.as_view(), name="payment-initiate"),
    # Step 2 — eSewa redirects to frontend success URL
    # Frontend extracts params and calls this to verify with eSewa API
    path("verify/", PaymentVerifyView.as_view(), name="payment-verify"),
    # DEV/TEST ONLY (404s unless DEBUG=True) — bypasses eSewa entirely
    path("test-complete/", PaymentTestCompleteView.as_view(), name="payment-test-complete"),
    # Get payment status for an order
    path("<uuid:order_id>/", PaymentDetailView.as_view(), name="payment-detail"),
    # Admin/staff marks a payment as refunded
    path("<uuid:order_id>/refund/", PaymentRefundView.as_view(), name="payment-refund"),
]
