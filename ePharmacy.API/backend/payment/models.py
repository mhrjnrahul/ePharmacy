from django.db import models
from django.core.validators import MinValueValidator
from core.models import TimeStampedModel
from orders.models import Order


class Payment(TimeStampedModel):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    class Gateway(models.TextChoices):
        ESEWA = 'esewa', 'eSewa'

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name='payment',
    )
    gateway = models.CharField(
        max_length=20,
        choices=Gateway.choices,
        default=Gateway.ESEWA,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    # eSewa transaction reference returned after successful payment
    transaction_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='eSewa transaction UUID returned on successful verification.',
    )
    # The token/ref_id we sent to eSewa on initiation
    gateway_ref = models.CharField(
        max_length=255,
        blank=True,
        help_text='Our reference sent to eSewa (usually order id).',
    )
    # Raw response from eSewa stored for debugging and reconciliation
    gateway_response = models.JSONField(
        null=True,
        blank=True,
        help_text='Raw response payload from eSewa verification endpoint.',
    )

    paid_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments_payment'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment #{self.id} — Order #{self.order_id} ({self.status})'