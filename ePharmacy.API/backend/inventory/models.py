from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings

from core.models import TimeStampedModel
from catalog.models import Medicine


class Batch(TimeStampedModel):
    """
    Represents a physical purchase batch of a medicine from a supplier.
    One medicine can have many batches with different expiry dates and prices.
    OrderItem links to Batch (not Medicine) so we always know which batch was sold.
    """
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name='batches',
    )
    batch_number = models.CharField(max_length=100, unique=True)
    expiry_date = models.DateField()
    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Set to False when batch is expired or fully depleted.',
    )

    class Meta:
        db_table = 'inventory_batch'
        ordering = ['expiry_date']  # FIFO — earliest expiry first
        verbose_name_plural = 'batches'

    def __str__(self):
        return f'{self.medicine.name} — Batch {self.batch_number} (exp: {self.expiry_date})'

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()


class Inventory(TimeStampedModel):
    """
    Tracks current available quantity for each batch.
    One-to-one with Batch — created automatically when a Batch is created.
    quantity_available is the source of truth for stock checks.
    Never update this directly — always go through StockMovement.
    """
    batch = models.OneToOneField(
        Batch,
        on_delete=models.PROTECT,
        related_name='inventory',
    )
    quantity_available = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'inventory_inventory'
        verbose_name_plural = 'inventories'

    def __str__(self):
        return f'{self.batch} — qty: {self.quantity_available}'


class StockMovement(TimeStampedModel):
    """
    Immutable ledger of every stock change.
    Every addition or deduction must create a StockMovement record.
    quantity is always positive — direction is determined by movement_type.

    IN types  (PURCHASE_IN, RETURN_IN)  → increase inventory
    OUT types (SALE_OUT, EXPIRED_OUT, ADJUSTMENT with negative notes) → decrease inventory
    ADJUSTMENT can go either way — use notes to explain reason.
    """

    class MovementType(models.TextChoices):
        PURCHASE_IN = 'purchase_in', 'Purchase In'
        SALE_OUT = 'sale_out', 'Sale Out'
        RETURN_IN = 'return_in', 'Return In'
        ADJUSTMENT = 'adjustment', 'Adjustment'
        EXPIRED_OUT = 'expired_out', 'Expired Out'

    # IN types add stock, OUT types deduct stock
    IN_TYPES = {MovementType.PURCHASE_IN, MovementType.RETURN_IN}
    OUT_TYPES = {MovementType.SALE_OUT, MovementType.EXPIRED_OUT, MovementType.ADJUSTMENT}

    batch = models.ForeignKey(
        Batch,
        on_delete=models.PROTECT,
        related_name='stock_movements',
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)

    # Always stored as a positive integer.
    # For ADJUSTMENT decreases, the sign is implied by movement_type + notes.
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    # Snapshot of quantity before this movement — useful for auditing
    quantity_before = models.PositiveIntegerField()
    quantity_after = models.PositiveIntegerField()

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='stock_movements',
        help_text='Staff/admin who performed the movement. Null for system-generated.',
    )

    # Reference to related order or return — stored as free text to avoid
    # circular imports between inventory and orders apps.
    reference = models.CharField(
        max_length=255,
        blank=True,
        help_text='e.g. Order #uuid, Return #uuid, Manual adjustment reason',
    )

    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'inventory_stock_movement'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['batch', 'created_at']),
            models.Index(fields=['movement_type', 'created_at']),
        ]

    def __str__(self):
        return (
            f'{self.get_movement_type_display()} | '
            f'{self.batch.medicine.name} | qty: {self.quantity}'
        )

    @classmethod
    def record(cls, batch, movement_type, quantity, performed_by=None, reference='', notes=''):
        """
        The only correct way to change stock.
        Updates Inventory.quantity_available atomically and records the movement.

        Usage:
            StockMovement.record(
                batch=batch,
                movement_type=StockMovement.MovementType.PURCHASE_IN,
                quantity=100,
                performed_by=request.user,
                reference='Invoice #1234',
            )

        Raises:
            ValueError — if OUT movement would make stock go negative.
        """
        from django.db import transaction

        with transaction.atomic():
            # Lock the inventory row to prevent race conditions
            inventory = Inventory.objects.select_for_update().get(batch=batch)
            quantity_before = inventory.quantity_available

            if movement_type in cls.IN_TYPES:
                quantity_after = quantity_before + quantity
            else:
                if quantity > quantity_before:
                    raise ValueError(
                        f'Cannot deduct {quantity} from batch "{batch.batch_number}". '
                        f'Only {quantity_before} available.'
                    )
                quantity_after = quantity_before - quantity

            inventory.quantity_available = quantity_after
            inventory.save(update_fields=['quantity_available', 'updated_at'])

            return cls.objects.create(
                batch=batch,
                movement_type=movement_type,
                quantity=quantity,
                quantity_before=quantity_before,
                quantity_after=quantity_after,
                performed_by=performed_by,
                reference=reference,
                notes=notes,
            )