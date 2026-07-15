from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from core.models import TimeStampedModel
from catalog.models import Medicine
from inventory.models import Batch


class Cart(TimeStampedModel):
    """
    One active cart per customer at a time.
    Cart is cleared after a successful order is placed.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
    )

    class Meta:
        db_table = 'orders_cart'

    def __str__(self):
        return f'Cart — {self.user.email}'

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.select_related('medicine').all())


class CartItem(TimeStampedModel):
    """
    Each item in the cart references a Medicine (not a Batch).
    Batch is resolved at checkout time using FIFO (earliest expiry first).
    This way customers don't have to think about batches.
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='cart_items',
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )

    class Meta:
        db_table = 'orders_cart_item'
        unique_together = [('cart', 'medicine')]

    def __str__(self):
        return f'{self.medicine.name} x{self.quantity}'

    @property
    def subtotal(self):
        """
        Best-effort price preview using the earliest active batch.
        Actual price is locked at order confirmation time.
        """
        batch = (
            Batch.objects.filter(
                medicine=self.medicine,
                is_active=True,
            )
            .order_by('expiry_date')
            .first()
        )
        if batch:
            return batch.selling_price * self.quantity
        return 0


class Order(TimeStampedModel):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        PROCESSING = 'processing', 'Processing'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    # Statuses that allow customer cancellation
    CUSTOMER_CANCELLABLE_STATUSES = {Status.PENDING}

    # Statuses after which stock has already been deducted
    STOCK_DEDUCTED_STATUSES = {
        Status.CONFIRMED, Status.PROCESSING,
        Status.SHIPPED, Status.DELIVERED,
    }

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    # Snapshot of delivery address at order time
    delivery_address = models.TextField()

    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='cancelled_orders',
    )
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'orders_order'
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id} — {self.user.email} ({self.status})'

    def cancel(self, cancelled_by, reason=''):
        """
        Cancels the order and restores stock if it was already deducted.
        Only callable when status is PENDING (customer) or any status (staff).
        """
        from django.utils import timezone
        from inventory.models import StockMovement

        stock_was_deducted = self.status in self.STOCK_DEDUCTED_STATUSES

        self.status = self.Status.CANCELLED
        self.cancelled_by = cancelled_by
        self.cancellation_reason = reason
        self.cancelled_at = timezone.now()
        self.save(update_fields=[
            'status', 'cancelled_by', 'cancellation_reason',
            'cancelled_at', 'updated_at',
        ])

        # Restore stock if it had already been deducted at CONFIRMED stage
        if stock_was_deducted:
            for item in self.items.select_related('batch').all():
                StockMovement.record(
                    batch=item.batch,
                    movement_type=StockMovement.MovementType.RETURN_IN,
                    quantity=item.quantity,
                    performed_by=cancelled_by,
                    reference=f'Order #{self.id} cancelled',
                )

        # Release any prescriptions this order had consumed so they can
        # authorise a future order instead of being permanently used up.
        self.consumed_prescription_items.update(consumed_by_order=None, consumed_at=None)

    def confirm(self, confirmed_by):
        """
        Confirms the order and deducts stock from inventory.
        Called after payment is verified.
        """
        from inventory.models import StockMovement

        self.status = self.Status.CONFIRMED
        self.save(update_fields=['status', 'updated_at'])

        for item in self.items.select_related('batch').all():
            StockMovement.record(
                batch=item.batch,
                movement_type=StockMovement.MovementType.SALE_OUT,
                quantity=item.quantity,
                performed_by=confirmed_by,
                reference=f'Order #{self.id} confirmed',
            )

        # Cart is only cleared once payment is actually confirmed — see
        # checkout() in services.py for why it's not cleared at PENDING time.
        CartItem.objects.filter(cart__user=self.user).delete()


class OrderItem(TimeStampedModel):
    """
    Snapshot of what was ordered.
    Links to Batch (not Medicine) — we need to know exactly which
    batch was sold for inventory accuracy and expiry traceability.
    Price is snapshotted at order time so historical orders
    are not affected by future price changes.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name='items',
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.PROTECT,
        related_name='order_items',
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    # Price locked at order time — never updated after creation
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'orders_order_item'

    def __str__(self):
        return f'{self.batch.medicine.name} x{self.quantity} @ Rs.{self.unit_price}'

    @property
    def subtotal(self):
        return self.unit_price * self.quantity