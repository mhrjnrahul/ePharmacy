"""
Django management command to seed the database with realistic test data.

Usage:
    python manage.py seed_db --clear       # Clear all data and reseed
    python manage.py seed_db               # Append new data (preserve existing)
    python manage.py seed_db --users-only  # Seed only users
    python manage.py seed_db --help        # Show help

The data models a Nepali pharmacy (NPR pricing, eSewa gateway) and is
deliberately spread across the last ~90 days so the admin dashboard, reports
sales-trend chart, top-selling list, and per-order payment panel all look
populated rather than collapsing onto "today".
"""

import random
import sys
import uuid
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from users.models import User
from core.models import Role
from catalog.models import Category, Manufacturer, Medicine, MedicineRelation
from catalog.recommendations import update_relation_weights
from inventory.models import Batch, Inventory, StockMovement
from orders.models import Cart, Order, OrderItem
from payment.models import Payment
from shipment.models import Shipment
from prescriptions.models import Prescription, PrescriptionItem


# ── curated Nepali data (romanized for reliable, script-free demo output) ──────
NEPALI_FIRST_NAMES = [
    "Aarav", "Bibek", "Prakash", "Sabin", "Niraj", "Kiran", "Deepak", "Suman",
    "Anish", "Rojan", "Hari", "Ram", "Shyam", "Gopal", "Bishal", "Nabin",
    "Ramesh", "Sanjay", "Ashok", "Dipesh", "Sita", "Gita", "Anjali", "Puja",
    "Sunita", "Bina", "Kritika", "Manisha", "Sarita", "Rita",
]
NEPALI_LAST_NAMES = [
    "Sharma", "Shrestha", "Gurung", "Thapa", "Karki", "Rai", "Magar",
    "Adhikari", "Poudel", "Bhattarai", "Tamang", "Lama", "Koirala", "Dahal",
    "Basnet", "Khatri", "Maharjan", "Pandey", "Joshi", "Acharya",
]
NEPALI_AREAS = [
    "Baneshwor", "Koteshwor", "Lazimpat", "Patan Dhoka", "Thamel", "Kalanki",
    "Boudha", "Jawalakhel", "Maharajgunj", "Chabahil", "Pulchowk", "Kupondole",
    "Sinamangal", "Balaju", "Kirtipur",
]
NEPALI_CITIES = [
    "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar",
    "Butwal", "Dharan", "Bharatpur",
]

# ── realistic catalog: (name, strength, dosage_form, category, composition, npr) ─
# Prescription requirement is derived from the category (see RX_CATEGORIES).
# Prices are believable per-unit NPR retail values. Crocin/Calpol/Brufen share
# composition with a generic above so the out-of-stock substitute feature has
# real pairs to surface.
RX_CATEGORIES = {"Antibiotics", "Diabetes Management", "Cardiovascular"}

MEDICINE_CATALOG = [
    # Pain Relief (OTC)
    ("Paracetamol", "500mg", "tablet", "Pain Relief", "Paracetamol", 3),
    ("Ibuprofen", "400mg", "tablet", "Pain Relief", "Ibuprofen", 5),
    ("Aspirin", "75mg", "tablet", "Pain Relief", "Aspirin", 2),
    ("Diclofenac", "50mg", "tablet", "Pain Relief", "Diclofenac", 6),
    ("Naproxen", "250mg", "tablet", "Pain Relief", "Naproxen", 8),
    ("Crocin", "500mg", "tablet", "Pain Relief", "Paracetamol", 4),
    ("Calpol", "500mg", "tablet", "Pain Relief", "Paracetamol", 4),
    ("Brufen", "400mg", "tablet", "Pain Relief", "Ibuprofen", 6),
    # Antibiotics (Rx)
    ("Amoxicillin", "500mg", "capsule", "Antibiotics", "Amoxicillin", 12),
    ("Azithromycin", "500mg", "tablet", "Antibiotics", "Azithromycin", 35),
    ("Ciprofloxacin", "500mg", "tablet", "Antibiotics", "Ciprofloxacin", 15),
    ("Ceftriaxone", "1g", "injection", "Antibiotics", "Ceftriaxone", 120),
    ("Metronidazole", "400mg", "tablet", "Antibiotics", "Metronidazole", 5),
    ("Doxycycline", "100mg", "capsule", "Antibiotics", "Doxycycline", 10),
    ("Cephalexin", "500mg", "capsule", "Antibiotics", "Cephalexin", 14),
    # Vitamins & Supplements (OTC)
    ("Vitamin C", "1000mg", "tablet", "Vitamins & Supplements", "Ascorbic Acid", 8),
    ("Vitamin D3", "60000IU", "capsule", "Vitamins & Supplements", "Cholecalciferol", 25),
    ("Multivitamin", "Daily", "tablet", "Vitamins & Supplements", "Multivitamin Complex", 10),
    ("Calcium + D3", "500mg", "tablet", "Vitamins & Supplements", "Calcium Carbonate, Cholecalciferol", 9),
    ("Iron Folic", "100mg", "tablet", "Vitamins & Supplements", "Ferrous Sulfate, Folic Acid", 6),
    ("Zinc", "50mg", "tablet", "Vitamins & Supplements", "Zinc Sulfate", 5),
    # Cold & Flu (OTC)
    ("Cetirizine", "10mg", "tablet", "Cold & Flu", "Cetirizine", 3),
    ("Cough Syrup", "100ml", "syrup", "Cold & Flu", "Dextromethorphan", 95),
    ("Phenylephrine", "10mg", "tablet", "Cold & Flu", "Phenylephrine", 4),
    ("Diphenhydramine", "25mg", "tablet", "Cold & Flu", "Diphenhydramine", 5),
    ("Levocetirizine", "5mg", "tablet", "Cold & Flu", "Levocetirizine", 4),
    # Digestive Health (OTC)
    ("Omeprazole", "20mg", "capsule", "Digestive Health", "Omeprazole", 6),
    ("Pantoprazole", "40mg", "tablet", "Digestive Health", "Pantoprazole", 8),
    ("Ranitidine", "150mg", "tablet", "Digestive Health", "Ranitidine", 4),
    ("ORS", "Sachet", "syrup", "Digestive Health", "Oral Rehydration Salts", 15),
    ("Domperidone", "10mg", "tablet", "Digestive Health", "Domperidone", 5),
    # Skin Care (OTC)
    ("Antibiotic Cream", "2%", "cream", "Skin Care", "Neomycin", 45),
    ("Hydrocortisone", "1%", "cream", "Skin Care", "Hydrocortisone", 55),
    ("Clotrimazole", "1%", "cream", "Skin Care", "Clotrimazole", 40),
    ("Eye Drops", "0.5%", "drops", "Skin Care", "Chloramphenicol", 60),
    # Diabetes Management (Rx)
    ("Metformin", "500mg", "tablet", "Diabetes Management", "Metformin", 4),
    ("Glimepiride", "2mg", "tablet", "Diabetes Management", "Glimepiride", 6),
    ("Insulin", "40IU", "injection", "Diabetes Management", "Human Insulin", 350),
    # Cardiovascular (Rx)
    ("Atorvastatin", "10mg", "tablet", "Cardiovascular", "Atorvastatin", 8),
    ("Amlodipine", "5mg", "tablet", "Cardiovascular", "Amlodipine", 4),
    ("Lisinopril", "10mg", "tablet", "Cardiovascular", "Lisinopril", 7),
    ("Losartan", "50mg", "tablet", "Cardiovascular", "Losartan", 6),
    ("Metoprolol", "50mg", "tablet", "Cardiovascular", "Metoprolol", 5),
]

# Curated clinical companions (NSAIDs paired with a stomach-protecting PPI).
# Weights use the same clinical scale as the relations-modal dropdown:
# 1.0 = Usually needed, 0.7 = Often recommended, 0.4 = Sometimes helpful.
CURATED_COMPANIONS = [
    ("Ibuprofen", "Omeprazole", 1.0),
    ("Diclofenac", "Pantoprazole", 1.0),
    ("Naproxen", "Omeprazole", 0.7),
    ("Aspirin", "Pantoprazole", 0.7),
    ("Ciprofloxacin", "ORS", 0.4),
]

# Order-status mix (weighted): mostly revenue-counting, some pending, few cancelled.
ORDER_STATUS_WEIGHTS = [
    (Order.Status.DELIVERED, 45),
    (Order.Status.CONFIRMED, 15),
    (Order.Status.SHIPPED, 12),
    (Order.Status.PENDING, 12),
    (Order.Status.PROCESSING, 8),
    (Order.Status.CANCELLED, 8),
]

NUM_CUSTOMERS = 25
NUM_ORDERS = 120
ORDER_WINDOW_DAYS = 90


def money(value):
    """Quantize any numeric to a 2-decimal Decimal for currency fields."""
    return Decimal(str(round(float(value), 2)))


class Command(BaseCommand):
    help = "Seed the database with realistic pharmaceutical test data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all data before seeding (WARNING: destructive)",
        )
        parser.add_argument(
            "--users-only",
            action="store_true",
            help="Seed only user data, skip medicines and orders",
        )

    def handle(self, *args, **options):
        random.seed(42)

        # The summary uses emoji; Windows consoles default to cp1252 and would
        # crash on write. Reconfiguring the underlying stream to UTF-8 keeps the
        # command portable regardless of the console's code page.
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

        self.price_map = {}

        clear_data = options.get("clear", False)
        users_only = options.get("users_only", False)

        if clear_data:
            self.stdout.write(self.style.WARNING("🗑️  Clearing all data..."))
            self.clear_all_data()
            self.stdout.write(self.style.SUCCESS("✓ Data cleared."))

        self.stdout.write(self.style.HTTP_INFO("📝 Starting database seeding...\n"))

        # Seed users
        self.stdout.write("👥 Seeding users...")
        admin, staff, customers = self.seed_users()
        self.stdout.write(self.style.SUCCESS(f"✓ Created: 1 admin, 1 staff, {len(customers)} customers\n"))

        if users_only:
            self.stdout.write(
                self.style.SUCCESS("\n✅ User seeding complete! Skipping catalog data.\n")
            )
            return

        # Seed catalog
        self.stdout.write("🏭 Seeding manufacturers...")
        manufacturers = self.seed_manufacturers()
        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(manufacturers)} manufacturers\n"))

        self.stdout.write("📂 Seeding categories...")
        categories = self.seed_categories()
        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(categories)} categories\n"))

        self.stdout.write("💊 Seeding medicines...")
        medicines = self.seed_medicines(categories, manufacturers)
        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(medicines)} medicines\n"))

        # Seed inventory (incl. deliberate low-stock / expiring / expired batches)
        self.stdout.write("📦 Seeding batches and inventory...")
        self.seed_batches_and_inventory(medicines, staff)
        self.stdout.write(self.style.SUCCESS("✓ Created batches and inventory\n"))

        # Seed orders, payments, shipments (spread across the last 90 days)
        self.stdout.write("🛒 Seeding orders, payments, and shipments...")
        self.seed_orders_and_payments(customers, medicines, staff)
        self.stdout.write(self.style.SUCCESS("✓ Created orders, payments, and shipments\n"))

        # Seed medicine relations — curated companions + FBT generated from orders
        self.stdout.write("🔗 Seeding medicine relations...")
        fbt = self.seed_medicine_relations(medicines)
        self.stdout.write(self.style.SUCCESS(
            f"✓ Curated companions + {fbt} auto frequently-bought-together relations\n"
        ))

        # Seed prescriptions
        self.stdout.write("📋 Seeding prescriptions...")
        self.seed_prescriptions(customers, medicines, staff)
        self.stdout.write(self.style.SUCCESS("✓ Created prescriptions\n"))

        self.stdout.write(
            self.style.SUCCESS("\n✅ Database seeding complete! 🎉\n")
        )
        self.print_summary(admin, staff, customers, manufacturers, categories, medicines)

    # ── helpers ────────────────────────────────────────────────────────────────

    def _backdate(self, model, pk, when):
        """
        Set a historical created_at/updated_at.

        created_at is auto_now_add and updated_at is auto_now, so both ignore any
        value passed to create()/save(). A raw QuerySet.update() is the only way
        to write a chosen timestamp — it bypasses the auto machinery entirely.
        """
        model.objects.filter(pk=pk).update(created_at=when, updated_at=when)

    def _past_datetime(self, max_days, mode=None):
        """A tz-aware datetime in the last `max_days` days. `mode` skews recency."""
        if mode is None:
            days_ago = random.uniform(0, max_days)
        else:
            days_ago = random.triangular(0, max_days, mode)
        return timezone.now() - timedelta(days=days_ago)

    def _clamp_now(self, dt):
        now = timezone.now()
        return dt if dt <= now else now

    def _nepali_address(self, name):
        area = random.choice(NEPALI_AREAS)
        city = random.choice(NEPALI_CITIES)
        ward = random.randint(1, 32)
        phone = "98" + str(random.randint(10000000, 99999999))
        return f"{name}\nWard {ward}, {area}, {city}, Nepal\nPhone: {phone}"

    # ── seeders ──────────────────────────────────────────────────────────────

    def clear_all_data(self):
        """Clear all app data in reverse dependency order."""
        models_to_clear = [
            PrescriptionItem,
            Prescription,
            Shipment,
            Payment,
            OrderItem,
            Order,
            Cart,
            StockMovement,
            Inventory,
            Batch,
            MedicineRelation,
            Medicine,
            Manufacturer,
            Category,
            User,
        ]
        for model in models_to_clear:
            model.objects.all().delete()

    def seed_users(self):
        """Create admin, staff, and ~25 Nepali customers spread over time."""
        admin = User.objects.create_user(
            email="admin@ausadi.com",
            first_name="Admin",
            last_name="User",
            password="admin123",
            role=Role.ADMIN,
        )

        staff = User.objects.create_user(
            email="staff@ausadi.com",
            first_name="Staff",
            last_name="User",
            password="staff123",
            role=Role.STAFF,
        )

        customers = []
        used_emails = set()
        for i in range(NUM_CUSTOMERS):
            first = random.choice(NEPALI_FIRST_NAMES)
            last = random.choice(NEPALI_LAST_NAMES)
            email = f"{first.lower()}.{last.lower()}{i + 1}@example.com"
            while email in used_emails:
                email = f"{first.lower()}.{last.lower()}{random.randint(100, 999)}@example.com"
            used_emails.add(email)

            customer = User.objects.create_user(
                email=email,
                first_name=first,
                last_name=last,
                password="customer123",
                role=Role.CUSTOMER,
            )

            # ~5 customers joined this month (feeds customers.new_this_month);
            # the rest are spread over the last ~6 months.
            if i < 5:
                joined = self._past_datetime(min(timezone.now().day - 1, 18) or 1)
            else:
                joined = self._past_datetime(180, mode=120)
            self._backdate(User, customer.pk, joined)

            customers.append(customer)

        return admin, staff, customers

    def seed_manufacturers(self):
        """Create pharmaceutical manufacturers."""
        manufacturers_data = [
            ("Himalayan Pharma", "Contact: +977-1-4234567"),
            ("Biochem Pharmaceutical", "Contact: info@biochem.com.np"),
            ("Ipca Laboratories", "Contact: +977-1-5678910"),
            ("Ranbaxy Nepal", "Contact: sales@ranbaxy.np"),
            ("Lupin Limited", "Contact: lupin@lupin.com.np"),
            ("Sun Pharma", "Contact: +977-1-9876543"),
            ("GlaxoSmithKline", "Contact: gsk@gsk.com.np"),
            ("Novo Nordisk", "Contact: novo@novo.com.np"),
        ]

        manufacturers = []
        for name, contact in manufacturers_data:
            manufacturer, _ = Manufacturer.objects.get_or_create(
                name=name,
                defaults={"contact_info": contact, "is_active": True},
            )
            manufacturers.append(manufacturer)

        return manufacturers

    def seed_categories(self):
        """Create medicine categories."""
        categories_data = [
            ("Pain Relief", "Analgesics and painkillers"),
            ("Antibiotics", "Antibiotic medications for infections"),
            ("Vitamins & Supplements", "Vitamins, minerals, and dietary supplements"),
            ("Cold & Flu", "Treatment for colds, flu, and cough"),
            ("Digestive Health", "Medicines for digestive and gastrointestinal issues"),
            ("Skin Care", "Topical medications for skin conditions"),
            ("Diabetes Management", "Medicines for diabetes control"),
            ("Cardiovascular", "Heart and blood pressure medications"),
        ]

        categories = []
        for name, description in categories_data:
            category, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": description, "is_active": True},
            )
            categories.append(category)

        return categories

    def seed_medicines(self, categories, manufacturers):
        """Create a realistic catalog with NPR pricing and class-based Rx rules."""
        category_by_name = {c.name: c for c in categories}

        medicines = []
        for name, strength, dosage_form, category_name, composition, base_price in MEDICINE_CATALOG:
            category = category_by_name.get(category_name, categories[0])
            manufacturer = random.choice(manufacturers)
            requires_rx = category_name in RX_CATEGORIES

            medicine, _ = Medicine.objects.get_or_create(
                name=name,
                strength=strength,
                dosage_form=dosage_form,
                defaults={
                    "description": f"{name} {strength} — {composition}",
                    "category": category,
                    "manufacturer": manufacturer,
                    "composition": composition,
                    "requires_prescription": requires_rx,
                    "is_active": True,
                },
            )
            medicines.append(medicine)
            self.price_map[medicine.name] = base_price

        return medicines

    def _make_batch(self, medicine, staff, index, quantity, expiry_date):
        """Create one batch + inventory + PURCHASE_IN ledger entry from NPR price."""
        base = self.price_map.get(medicine.name, 20)
        selling_price = money(base * random.uniform(0.95, 1.15))
        purchase_price = money(float(selling_price) / random.uniform(1.2, 1.45))

        batch, created = Batch.objects.get_or_create(
            batch_number=f"{medicine.id}-BATCH-{index:03d}",
            defaults={
                "medicine": medicine,
                "expiry_date": expiry_date,
                "purchase_price": purchase_price,
                "selling_price": selling_price,
                "is_active": True,
            },
        )
        if created:
            Inventory.objects.get_or_create(
                batch=batch, defaults={"quantity_available": 0}
            )
            StockMovement.record(
                batch=batch,
                movement_type=StockMovement.MovementType.PURCHASE_IN,
                quantity=quantity,
                performed_by=staff,
                reference=f"Initial stock for {batch.batch_number}",
            )
        return batch

    def seed_batches_and_inventory(self, medicines, staff):
        """Healthy stock for every medicine, plus a few deliberate alert batches."""
        today = timezone.now().date()

        # Normal, healthy batches — 2 to 3 per medicine.
        for medicine in medicines:
            for n in range(random.randint(2, 3)):
                self._make_batch(
                    medicine, staff,
                    index=n + 1,
                    quantity=random.randint(50, 300),
                    expiry_date=today + timedelta(days=random.randint(120, 730)),
                )

        # Deliberate alert batches so the dashboard AttentionStrip lights up.
        for medicine in random.sample(medicines, 3):  # low stock (< 10)
            self._make_batch(
                medicine, staff,
                index=90,
                quantity=random.randint(2, 9),
                expiry_date=today + timedelta(days=random.randint(120, 400)),
            )
        for medicine in random.sample(medicines, 3):  # expiring soon (< 30 days)
            self._make_batch(
                medicine, staff,
                index=91,
                quantity=random.randint(20, 80),
                expiry_date=today + timedelta(days=random.randint(7, 25)),
            )
        for medicine in random.sample(medicines, 2):  # already expired, still active
            self._make_batch(
                medicine, staff,
                index=92,
                quantity=random.randint(10, 40),
                expiry_date=today - timedelta(days=random.randint(5, 45)),
            )

    def seed_orders_and_payments(self, customers, medicines, staff):
        """Create ~120 time-spread orders with payments and shipments."""
        statuses = [s for s, _ in ORDER_STATUS_WEIGHTS]
        weights = [w for _, w in ORDER_STATUS_WEIGHTS]

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_span = max((now - today_start).total_seconds(), 1)
        revenue_statuses = [
            Order.Status.DELIVERED, Order.Status.CONFIRMED, Order.Status.SHIPPED,
        ]

        for i in range(NUM_ORDERS):
            customer = random.choice(customers)

            # First few orders are pinned to a random moment *today* with a
            # revenue-counting status, so revenue.today / orders.today are
            # non-zero; the rest skew toward recent days for a shaped trend curve.
            if i < 4:
                status = random.choice(revenue_statuses)
                order_dt = today_start + timedelta(seconds=random.uniform(0, today_span))
            else:
                status = random.choices(statuses, weights=weights, k=1)[0]
                order_dt = self._past_datetime(ORDER_WINDOW_DAYS - 1, mode=6)

            order = Order.objects.create(
                user=customer,
                status=status,
                total_amount=Decimal("0"),
                delivery_address=self._nepali_address(
                    f"{customer.first_name} {customer.last_name}"
                ),
            )

            # Build order items from distinct medicines (reuse earliest-expiry
            # active batch lookup). Stock is NOT deducted — we set status
            # directly, exactly as reports expect, and avoid negative-stock errors.
            selected = random.sample(medicines, k=random.randint(1, 4))
            total = Decimal("0")
            for medicine in selected:
                batch = (
                    Batch.objects.filter(medicine=medicine, is_active=True)
                    .order_by("expiry_date")
                    .first()
                )
                if not batch:
                    continue
                quantity = random.randint(1, 5)
                unit_price = batch.selling_price
                OrderItem.objects.create(
                    order=order,
                    batch=batch,
                    quantity=quantity,
                    unit_price=unit_price,
                )
                total += unit_price * quantity

            order.total_amount = total
            order.save(update_fields=["total_amount"])
            self._backdate(Order, order.pk, order_dt)

            self._make_payment(order, status, order_dt)

            if status in (Order.Status.SHIPPED, Order.Status.DELIVERED):
                self._make_shipment(order, status, order_dt, staff)

        # Every customer keeps a (currently empty) cart, mirroring real usage.
        for customer in customers:
            Cart.objects.get_or_create(user=customer)

    def _make_payment(self, order, status, order_dt):
        """One payment per order, state matched to the order and backdated."""
        if status == Order.Status.PENDING:
            pay_status = Payment.Status.PENDING
        elif status == Order.Status.CANCELLED:
            # Half of cancelled orders had a failed payment attempt; rest none.
            if random.random() < 0.5:
                pay_status = Payment.Status.FAILED
            else:
                return
        else:
            # confirmed / processing / shipped / delivered → paid,
            # with a small share of delivered orders later refunded.
            if status == Order.Status.DELIVERED and random.random() < 0.08:
                pay_status = Payment.Status.REFUNDED
            else:
                pay_status = Payment.Status.COMPLETED

        payment = Payment.objects.create(
            order=order,
            gateway=Payment.Gateway.ESEWA,
            status=pay_status,
            amount=order.total_amount,
            gateway_ref=str(order.id),
        )

        updates = {}
        if pay_status in (Payment.Status.COMPLETED, Payment.Status.REFUNDED):
            paid_at = self._clamp_now(order_dt + timedelta(minutes=random.randint(2, 45)))
            payment.transaction_id = f"ESW-{uuid.uuid4().hex[:12].upper()}"
            payment.paid_at = paid_at
            updates["fields"] = ["transaction_id", "paid_at"]
            if pay_status == Payment.Status.REFUNDED:
                payment.refunded_at = self._clamp_now(
                    paid_at + timedelta(days=random.randint(1, 5))
                )
                updates["fields"].append("refunded_at")
            payment.save(update_fields=updates["fields"])

        # Pin the payment's created_at to the order's moment for a clean history.
        self._backdate(Payment, payment.pk, order_dt)

    def _make_shipment(self, order, status, order_dt, staff):
        dispatched_at = self._clamp_now(order_dt + timedelta(days=random.randint(1, 2)))
        if status == Order.Status.DELIVERED:
            ship_status = Shipment.Status.DELIVERED
            delivered_at = self._clamp_now(dispatched_at + timedelta(days=random.randint(1, 4)))
        else:  # SHIPPED
            ship_status = Shipment.Status.DISPATCHED
            delivered_at = None

        shipment = Shipment.objects.create(
            order=order,
            status=ship_status,
            delivery_address=order.delivery_address,
            carrier=random.choice(["Sajilo Delivery", "In-house", "Pathao Courier"]),
            tracking_number=f"TRACK-{order.id}",
            dispatched_at=dispatched_at,
            delivered_at=delivered_at,
            created_by=staff,
        )
        self._backdate(Shipment, shipment.pk, dispatched_at)

    def seed_medicine_relations(self, medicines):
        """Curated clinical companions + FBT weights generated from real orders."""
        by_name = {m.name: m for m in medicines}

        for from_name, to_name, weight in CURATED_COMPANIONS:
            from_med = by_name.get(from_name)
            to_med = by_name.get(to_name)
            if not (from_med and to_med):
                continue
            MedicineRelation.objects.get_or_create(
                from_medicine=from_med,
                to_medicine=to_med,
                relation_type=MedicineRelation.RelationType.SIDE_EFFECT_COMPANION,
                defaults={"weight": weight},
            )

        # Generate frequently-bought-together relations from the co-purchase
        # matrix of the orders we just seeded — this is exactly what the
        # dashboard "Rebuild recommendations" action runs, and it populates the
        # read-only "Auto" section of the manage-relations modal.
        result = update_relation_weights()
        return result.get("created", 0) + result.get("updated", 0)

    def seed_prescriptions(self, customers, medicines, staff):
        """Create sample prescriptions (some pending, some approved)."""
        prescription_medicines = [m for m in medicines if m.requires_prescription]

        for customer in random.sample(customers, k=min(12, len(customers))):
            for _ in range(random.randint(1, 2)):
                status = random.choice(
                    [Prescription.Status.PENDING, Prescription.Status.APPROVED]
                )
                prescription = Prescription.objects.create(
                    customer=customer,
                    status=status,
                    image="prescriptions/sample.pdf",
                )

                if status == Prescription.Status.APPROVED:
                    prescription.reviewed_by = staff
                    prescription.reviewed_at = timezone.now()
                    prescription.save(update_fields=["reviewed_by", "reviewed_at"])

                    selected_meds = random.sample(
                        prescription_medicines,
                        k=min(random.randint(1, 3), len(prescription_medicines)),
                    )
                    for medicine in selected_meds:
                        PrescriptionItem.objects.create(
                            prescription=prescription,
                            medicine=medicine,
                            approved_quantity=random.randint(1, 3),
                        )

                self._backdate(
                    Prescription, prescription.pk, self._past_datetime(25)
                )

    def print_summary(self, admin, staff, customers, manufacturers, categories, medicines):
        """Print a summary of seeded data."""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("📊 DATABASE SEEDING SUMMARY")
        self.stdout.write("=" * 60)

        self.stdout.write(f"\n👥 Users:")
        self.stdout.write(f"   • Admin: {admin.email} / admin123")
        self.stdout.write(f"   • Staff: {staff.email} / staff123")
        self.stdout.write(f"   • Customers: {len(customers)} (password: customer123)")

        self.stdout.write(f"\n🏭 Catalog:")
        self.stdout.write(f"   • Manufacturers: {len(manufacturers)}")
        self.stdout.write(f"   • Categories: {len(categories)}")
        self.stdout.write(f"   • Medicines: {len(medicines)}")

        self.stdout.write(f"\n📦 Inventory:")
        self.stdout.write(f"   • Batches: {Batch.objects.count()}")
        self.stdout.write(f"   • Low stock (<10): {Inventory.objects.filter(quantity_available__lt=10, batch__is_active=True).count()}")
        today = timezone.now().date()
        self.stdout.write(
            f"   • Expiring soon (≤30d): "
            f"{Batch.objects.filter(is_active=True, expiry_date__gte=today, expiry_date__lte=today + timedelta(days=30)).count()}"
        )
        self.stdout.write(
            f"   • Expired (still active): "
            f"{Batch.objects.filter(is_active=True, expiry_date__lt=today).count()}"
        )

        self.stdout.write(f"\n🛒 Orders ({Order.objects.count()} total):")
        for status, _ in ORDER_STATUS_WEIGHTS:
            count = Order.objects.filter(status=status).count()
            self.stdout.write(f"   • {status.label}: {count}")

        self.stdout.write(f"\n💳 Payments ({Payment.objects.count()} total):")
        for status in Payment.Status:
            count = Payment.objects.filter(status=status).count()
            if count:
                self.stdout.write(f"   • {status.label}: {count}")

        self.stdout.write(f"\n🔗 Recommendations:")
        self.stdout.write(
            f"   • Companion relations: "
            f"{MedicineRelation.objects.filter(relation_type='side_effect_companion').count()}"
        )
        self.stdout.write(
            f"   • Auto (frequently bought together): "
            f"{MedicineRelation.objects.filter(relation_type='frequently_bought_together').count()}"
        )

        self.stdout.write(f"\n📋 Prescriptions:")
        self.stdout.write(f"   • Total: {Prescription.objects.count()}")
        self.stdout.write(
            f"   • Pending: {Prescription.objects.filter(status='pending').count()}"
        )

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("\n✅ Test data ready. Log in as admin@ausadi.com / admin123\n")
