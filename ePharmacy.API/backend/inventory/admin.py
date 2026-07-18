from django.contrib import admin, messages
from .models import Batch, Inventory, StockMovement


class InventoryInline(admin.TabularInline):
    model = Inventory
    readonly_fields = ["quantity_available", "updated_at", "id"]
    extra = 0
    can_delete = False


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = [
        "batch_number",
        "medicine",
        "expiry_date",
        "selling_price",
        "is_active",
        "is_expired",
    ]
    list_filter = ["is_active", "medicine__category"]
    search_fields = ["batch_number", "medicine__name"]
    autocomplete_fields = ["medicine"]
    inlines = [InventoryInline]
    readonly_fields = ["created_at", "updated_at", "id"]

    @admin.display(boolean=True)
    def is_expired(self, obj):
        return obj.is_expired


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    readonly_fields = ["id"]
    list_display = ["batch", "quantity_available", "updated_at"]
    readonly_fields = ["batch", "quantity_available", "updated_at", "id"]
    search_fields = ["batch__batch_number", "batch__medicine__name"]

    actions = ["delete_selected_inventories"]

    def has_add_permission(self, request):
        return False  # Always auto-created via signal

    def has_delete_permission(self, request, obj=None):
        # Allow deletion from admin UI; individual deletions are checked in delete_model
        return True

    def delete_model(self, request, obj):
        """
        Prevent deletion when there is available quantity or when the batch has stock movement history.
        Provide user-facing messages explaining why deletion was blocked.
        """
        # Block if quantity still available
        if obj.quantity_available and obj.quantity_available > 0:
            messages.error(
                request,
                "Cannot delete Inventory: quantity_available is greater than 0. Set quantity to 0 before deleting.",
            )
            return

        # Block if any stock movements exist for the batch (ledger integrity)
        if StockMovement.objects.filter(batch=obj.batch).exists():
            messages.error(
                request,
                "Cannot delete Inventory: stock movement history exists for this batch.",
            )
            return

        # Safe to delete
        super().delete_model(request, obj)
        messages.success(request, f"Deleted inventory for batch {obj.batch.batch_number}.")

    def delete_selected_inventories(self, request, queryset):
        """Admin action to delete multiple selected inventories with the same safety checks."""
        deleted = 0
        blocked_qty = 0
        blocked_history = 0
        for inv in queryset:
            if inv.quantity_available and inv.quantity_available > 0:
                blocked_qty += 1
                continue
            if StockMovement.objects.filter(batch=inv.batch).exists():
                blocked_history += 1
                continue
            inv.delete()
            deleted += 1

        if deleted:
            messages.success(request, f"Deleted {deleted} inventory record(s).")
        if blocked_qty:
            messages.error(request, f"{blocked_qty} inventory record(s) blocked: quantity_available > 0.")
        if blocked_history:
            messages.error(request, f"{blocked_history} inventory record(s) blocked: stock movement history exists.")

    delete_selected_inventories.short_description = "Delete selected inventories (safe)"


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    readonly_fields = ["id"]
    list_display = [
        "movement_type",
        "batch",
        "quantity",
        "quantity_before",
        "quantity_after",
        "performed_by",
        "created_at",
    ]
    list_filter = ["movement_type"]
    search_fields = ["batch__batch_number", "batch__medicine__name", "reference"]
    readonly_fields = [
        "batch",
        "movement_type",
        "quantity",
        "quantity_before",
        "quantity_after",
        "performed_by",
        "reference",
        "notes",
        "created_at",
        "id"
    ]

    actions = ["delete_selected_stock_movements"]

    def has_add_permission(self, request):
        return False  # Always created via StockMovement.record()

    def has_delete_permission(self, request, obj=None):
        # Allow deletion from admin UI; perform safety checks in delete_model
        return True

    def delete_model(self, request, obj):
        """
        Safe single-delete for a StockMovement.

        Only allow deleting a movement when the batch's current inventory
        still matches the movement's `quantity_after` (i.e. no later movements
        have changed inventory). When allowed, revert the Inventory to
        `quantity_before` before removing the movement.
        """
        try:
            inv = Inventory.objects.get(batch=obj.batch)
        except Inventory.DoesNotExist:
            messages.error(request, "Cannot delete movement: inventory row missing.")
            return

        if inv.quantity_available != obj.quantity_after:
            messages.error(
                request,
                "Cannot delete movement: later stock movements exist or inventory mismatch."
            )
            return

        # Revert inventory and delete movement
        inv.quantity_available = obj.quantity_before
        inv.save(update_fields=["quantity_available", "updated_at"])
        super().delete_model(request, obj)
        messages.success(request, "Stock movement deleted and inventory reverted.")

    def delete_selected_stock_movements(self, request, queryset):
        """Bulk delete action with the same safety checks applied per movement.

        Processes movements newest-first to avoid blocking deletions where
        multiple movements for the same batch are selected.
        """
        deleted = 0
        blocked = 0
        # Ensure we process newer movements first
        for mv in queryset.order_by("-created_at"):
            try:
                inv = Inventory.objects.get(batch=mv.batch)
            except Inventory.DoesNotExist:
                blocked += 1
                continue

            if inv.quantity_available != mv.quantity_after:
                blocked += 1
                continue

            inv.quantity_available = mv.quantity_before
            inv.save(update_fields=["quantity_available", "updated_at"])
            mv.delete()
            deleted += 1

        if deleted:
            messages.success(request, f"Deleted {deleted} stock movement(s) and reverted inventory where applicable.")
        if blocked:
            messages.error(request, f"{blocked} stock movement(s) blocked: later movements exist or inventory mismatch.")

    delete_selected_stock_movements.short_description = "Delete selected stock movements (safe)"
