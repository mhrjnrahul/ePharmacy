from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Batch, Inventory


@receiver(post_save, sender=Batch)
def create_inventory_for_batch(sender, instance, created, **kwargs):
    """
    Auto-create an Inventory record whenever a new Batch is created.
    This ensures every batch always has a corresponding inventory row.

    Note: BatchDetailSerializer.create() also calls Inventory.objects.create()
    with initial_quantity=0 before calling StockMovement.record().
    This signal acts as a safety net for batches created outside the serializer
    (e.g. via Django shell, fixtures, or admin panel).
    """
    if created:
        Inventory.objects.get_or_create(batch=instance)
