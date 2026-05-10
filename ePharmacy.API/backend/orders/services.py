from django.db import transaction
from inventory.models import Batch, Inventory
from prescriptions.models import PrescriptionItem
from .models import Cart, CartItem, Order, OrderItem


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def add_to_cart(user, medicine, quantity):
    """
    Adds a medicine to the cart or updates quantity if already present.
    Validates:
      1. Medicine is active
      2. Sufficient stock exists across active batches
      3. If medicine requires prescription, customer has an approved one covering it
    """
    if not medicine.is_active:
        raise ValueError(f'"{medicine.name}" is not available.')

    # Check total available stock across all active non-expired batches
    total_stock = (
        Inventory.objects.filter(
            batch__medicine=medicine,
            batch__is_active=True,
        )
        .select_related("batch")
        .exclude(batch__expiry_date__lt=_today())
        .aggregate(
            total=__import__("django.db.models", fromlist=["Sum"]).Sum(
                "quantity_available"
            )
        )
    )["total"] or 0

    if quantity > total_stock:
        raise ValueError(
            f'Only {total_stock} units of "{medicine.name}" are available.'
        )

    # Prescription check
    if medicine.requires_prescription:
        _validate_prescription(user, medicine, quantity)

    cart = get_or_create_cart(user)
    item, created = CartItem.objects.get_or_create(
        cart=cart,
        medicine=medicine,
        defaults={"quantity": quantity},
    )
    if not created:
        item.quantity = quantity
        item.save(update_fields=["quantity", "updated_at"])

    return item


def remove_from_cart(user, medicine):
    cart = get_or_create_cart(user)
    CartItem.objects.filter(cart=cart, medicine=medicine).delete()


def checkout(user, delivery_address):
    """
    Converts the cart into a PENDING order.
    - Resolves each CartItem → best Batch using FIFO (earliest expiry first)
    - Locks the unit_price from the batch at this moment
    - Stock is NOT deducted yet — deduction happens at CONFIRMED stage
    - Cart is cleared after successful order creation

    Raises ValueError for any validation failure.
    Returns the created Order.
    """
    cart = get_or_create_cart(user)
    items = list(cart.items.select_related("medicine").all())

    if not items:
        raise ValueError("Your cart is empty.")

    with transaction.atomic():
        total_amount = 0
        resolved_items = []  # list of (CartItem, Batch, unit_price)

        for cart_item in items:
            medicine = cart_item.medicine

            # Re-validate prescription at checkout
            if medicine.requires_prescription:
                _validate_prescription(user, medicine, cart_item.quantity)

            # FIFO batch resolution — pick earliest expiry with enough stock
            batch = _resolve_batch(medicine, cart_item.quantity)
            unit_price = batch.selling_price
            total_amount += unit_price * cart_item.quantity
            resolved_items.append((cart_item, batch, unit_price))

        order = Order.objects.create(
            user=user,
            status=Order.Status.PENDING,
            total_amount=total_amount,
            delivery_address=delivery_address,
        )

        for cart_item, batch, unit_price in resolved_items:
            OrderItem.objects.create(
                order=order,
                batch=batch,
                quantity=cart_item.quantity,
                unit_price=unit_price,
            )

        # Clear cart after successful order
        cart.items.all().delete()

    return order

def _today():
    from django.utils import timezone

    return timezone.now().date()


def _validate_prescription(user, medicine, quantity):
    """
    Checks the customer has an APPROVED prescription covering this medicine
    with sufficient approved_quantity.
    Raises ValueError if not.
    """
    item = (
        PrescriptionItem.objects.filter(
            prescription__customer=user,
            prescription__status="approved",
            medicine=medicine,
        )
        .order_by("-created_at")
        .first()
    )

    if not item:
        raise ValueError(
            f'"{medicine.name}" requires a valid prescription. '
            f"Please upload your prescription and wait for approval before ordering."
        )

    if quantity > item.approved_quantity:
        raise ValueError(
            f'Your prescription for "{medicine.name}" only allows '
            f"{item.approved_quantity} unit(s). You requested {quantity}."
        )


def _resolve_batch(medicine, quantity):
    """
    FIFO batch selection — picks the active batch with the earliest
    expiry date that has enough stock to fulfil the requested quantity.
    Raises ValueError if no single batch can cover the quantity.

    Note: We intentionally pick ONE batch per order item for simplicity
    and clear traceability. Splitting across batches can be added later.
    """
    today = _today()
    batch = (
        Batch.objects.filter(
            medicine=medicine,
            is_active=True,
            expiry_date__gt=today,
            inventory__quantity_available__gte=quantity,
        )
        .order_by("expiry_date")
        .first()
    )

    if not batch:
        raise ValueError(
            f'Insufficient stock for "{medicine.name}". '
            f"No single batch has {quantity} units available."
        )

    return batch
