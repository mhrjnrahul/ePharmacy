from django.contrib import admin
from .models import Prescription, PrescriptionItem


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 0
    autocomplete_fields = ["medicine"]
    readonly_fields = ["created_at"]


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer",
        "status",
        "reviewed_by",
        "reviewed_at",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["customer__email"]
    readonly_fields = ["reviewed_at", "created_at", "updated_at"]
    inlines = [PrescriptionItemInline]

    def get_readonly_fields(self, request, obj=None):
        # Once approved or rejected, lock the core fields
        if obj and obj.status != Prescription.Status.PENDING:
            return self.readonly_fields + ["customer", "image", "status"]
        return self.readonly_fields


@admin.register(PrescriptionItem)
class PrescriptionItemAdmin(admin.ModelAdmin):
    list_display = ["prescription", "medicine", "approved_quantity"]
    search_fields = ["prescription__customer__email", "medicine__name"]
    autocomplete_fields = ["medicine"]
