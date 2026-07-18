"""
payments/esewa.py

eSewa v2 payment integration (production + sandbox).

Flow:
  1. Customer clicks "Pay with eSewa"
     → POST /api/payments/initiate/
     → We create a PENDING Payment record
     → We return the eSewa payment form fields to the frontend

  2. Frontend submits the form to eSewa's endpoint
     → eSewa processes payment
     → eSewa redirects customer to our success/failure URL

  3. On success redirect, frontend calls
     → POST /api/payments/verify/
     → We call eSewa's status check API with the token
     → If verified: mark Payment COMPLETED, auto-confirm Order
     → If failed:   mark Payment FAILED

eSewa docs: https://developer.esewa.com.np/
"""

import base64
import hashlib
import hmac
import json

import requests
from django.conf import settings


ESEWA_PAYMENT_URL = getattr(
    settings,
    "ESEWA_PAYMENT_URL",
    "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
)
ESEWA_VERIFY_URL = getattr(
    settings,
    "ESEWA_VERIFY_URL",
    "https://rc-epay.esewa.com.np/api/epay/transaction/status/",
)
ESEWA_PRODUCT_CODE = getattr(settings, "ESEWA_PRODUCT_CODE", "EPAYTEST")
ESEWA_SECRET_KEY = getattr(settings, "ESEWA_SECRET_KEY", "8gBm/:&EnhH.1/q")


def generate_signature(total_amount, transaction_uuid, product_code):
    """
    HMAC-SHA256 signature required by eSewa v2.
    Message format: total_amount=X,transaction_uuid=Y,product_code=Z
    """
    message = (
        f"total_amount={total_amount},"
        f"transaction_uuid={transaction_uuid},"
        f"product_code={product_code}"
    )
    key = ESEWA_SECRET_KEY.encode("utf-8")
    msg = message.encode("utf-8")
    digest = hmac.new(key, msg, hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


def build_payment_payload(order, payment):
    """
    Returns the form fields to send to eSewa payment page.
    The frontend renders these as hidden inputs and auto-submits the form.
    """
    transaction_uuid = str(payment.transaction_uuid)
    total_amount = str(order.total_amount)
    signature = generate_signature(total_amount, transaction_uuid, ESEWA_PRODUCT_CODE)

    return {
        "amount": total_amount,
        "tax_amount": "0",
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": ESEWA_PRODUCT_CODE,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "success_url": settings.ESEWA_SUCCESS_URL,
        "failure_url": settings.ESEWA_FAILURE_URL,
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": signature,
        "payment_url": ESEWA_PAYMENT_URL,
    }


def verify_payment(transaction_uuid, total_amount, product_code=None):
    """
    Calls eSewa's status check API to confirm a payment.

    Returns (success: bool, response_data: dict)

    eSewa returns status 'COMPLETE' on success, e.g.:
        {"product_code": "EPAYTEST", "transaction_uuid": "...",
         "total_amount": 1000.0, "status": "COMPLETE", "ref_id": "..."}

    No signature is verified here — unlike the browser-redirect `data`
    payload (which passes through the untrusted client and must be
    signature-checked), this call goes server-to-server over HTTPS directly
    to eSewa, which is itself the trust boundary. eSewa's status-check
    response also doesn't include a signature/signed_field_names field to
    check even if we wanted to.
    """
    product_code = product_code or ESEWA_PRODUCT_CODE

    try:
        response = requests.get(
            ESEWA_VERIFY_URL,
            params={
                "product_code": product_code,
                "total_amount": total_amount,
                "transaction_uuid": transaction_uuid,
            },
            timeout=10,
        )
        data = response.json()
    except (requests.RequestException, json.JSONDecodeError) as e:
        return False, {"error": str(e)}

    success = data.get("status") == "COMPLETE"
    return success, data
