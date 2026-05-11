from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "order",
        "gateway",
        "status",
        "amount",
        "transaction_id",
        "paid_at",
        "created_at",
    ]
    list_filter = ["gateway", "status"]
    search_fields = ["order__id", "transaction_id", "order__user__email"]
    readonly_fields = [
        "order",
        "gateway",
        "amount",
        "transaction_id",
        "gateway_ref",
        "gateway_response",
        "paid_at",
        "refunded_at",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False  # Always created via API flow

    def has_delete_permission(self, request, obj=None):
        return False  # Financial records are permanent
