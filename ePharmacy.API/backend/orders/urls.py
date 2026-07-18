from django.urls import path
from .views import (
    CartView,
    CartItemRemoveView,
    CheckoutView,
    OrderListView,
    OrderDetailView,
    OrderCancelView,
    OrderStatusUpdateView,
)

app_name = 'orders'

urlpatterns = [
    # Cart
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/<uuid:medicine_id>/', CartItemRemoveView.as_view(), name='cart-item-remove'),

    # Checkout
    path('checkout/', CheckoutView.as_view(), name='checkout'),

    # Orders
    path('', OrderListView.as_view(), name='order-list'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:pk>/cancel/', OrderCancelView.as_view(), name='order-cancel'),
    path('<uuid:pk>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
]