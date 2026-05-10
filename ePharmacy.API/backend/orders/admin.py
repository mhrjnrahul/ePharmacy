from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ["subtotal"]
    autocomplete_fields = ["medicine"]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["user", "updated_at"]
    search_fields = ["user__email"]
    inlines = [CartItemInline]
    readonly_fields = ["created_at", "updated_at"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["batch", "quantity", "unit_price", "subtotal"]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "total_amount", "created_at"]
    list_filter = ["status"]
    search_fields = ["user__email", "id"]
    readonly_fields = [
        "user",
        "total_amount",
        "delivery_address",
        "cancelled_by",
        "cancellation_reason",
        "cancelled_at",
        "created_at",
        "updated_at",
    ]
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ["order", "batch", "quantity", "unit_price", "subtotal"]
    search_fields = ["order__id", "batch__medicine__name"]
    readonly_fields = ["order", "batch", "quantity", "unit_price"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
