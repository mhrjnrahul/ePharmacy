from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
from orders.models import Order


class Shipment(TimeStampedModel):

    class Status(models.TextChoices):
        PREPARING = 'preparing', 'Preparing'
        DISPATCHED = 'dispatched', 'Dispatched'
        OUT_FOR_DELIVERY = 'out_for_delivery', 'Out for Delivery'
        DELIVERED = 'delivered', 'Delivered'
        FAILED = 'failed', 'Failed Delivery'

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name='shipment',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PREPARING,
    )
    tracking_number = models.CharField(max_length=100, unique=True, blank=True)
    carrier = models.CharField(
        max_length=100,
        blank=True,
        help_text='Delivery service name e.g. Sajilo Delivery, in-house.',
    )

    # Snapshot of address at shipment time (order.delivery_address may change)
    delivery_address = models.TextField()

    dispatched_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='shipments_created',
    )

    class Meta:
        db_table = 'shipping_shipment'
        ordering = ['-created_at']

    def __str__(self):
        return f'Shipment #{self.tracking_number or self.id} — Order #{self.order_id} ({self.status})'

    def dispatch(self, tracking_number='', carrier='', notes=''):
        from django.utils import timezone
        self.status = self.Status.DISPATCHED
        self.tracking_number = tracking_number or self.tracking_number
        self.carrier = carrier or self.carrier
        self.dispatched_at = timezone.now()
        if notes:
            self.notes = notes
        self.save(update_fields=[
            'status', 'tracking_number', 'carrier',
            'dispatched_at', 'notes', 'updated_at',
        ])

    def mark_delivered(self):
        from django.utils import timezone
        self.status = self.Status.DELIVERED
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at', 'updated_at'])

        # Sync order status to DELIVERED
        order = self.order
        if order.status == 'shipped':
            order.status = 'delivered'
            order.save(update_fields=['status', 'updated_at'])