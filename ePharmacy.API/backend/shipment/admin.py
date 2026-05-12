from django.contrib import admin
from .models import Shipment


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        "tracking_number",
        "order",
        "status",
        "carrier",
        "dispatched_at",
        "delivered_at",
        "created_at",
    ]
    list_filter = ["status", "carrier"]
    search_fields = ["tracking_number", "order__id", "order__user__email"]
    readonly_fields = [
        "dispatched_at",
        "delivered_at",
        "created_by",
        "created_at",
        "updated_at",
    ]
