"""
Django management command to seed the database with realistic test data.

Usage:
    python manage.py seed_db --clear       # Clear all data and reseed
    python manage.py seed_db               # Append new data (preserve existing)
    python manage.py seed_db --users-only  # Seed only users
    python manage.py seed_db --help        # Show help
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from users.models import User
from core.models import Role
from catalog.models import Category, Manufacturer, Medicine, MedicineRelation
from inventory.models import Batch, Inventory, StockMovement
from orders.models import Cart, Order, OrderItem
from payment.models import Payment
from shipment.models import Shipment
from prescriptions.models import Prescription, PrescriptionItem


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
        fake = Faker("en_US")
        Faker.seed(42)
        random.seed(42)

        clear_data = options.get("clear", False)
        users_only = options.get("users_only", False)

        if clear_data:
            self.stdout.write(self.style.WARNING("🗑️  Clearing all data..."))
            self.clear_all_data()
            self.stdout.write(self.style.SUCCESS("✓ Data cleared."))

        self.stdout.write(self.style.HTTP_INFO("📝 Starting database seeding...\n"))

        # Seed users
        self.stdout.write("👥 Seeding users...")
        admin, staff, customers = self.seed_users(fake)
        self.stdout.write(self.style.SUCCESS(f"✓ Created: 1 admin, 1 staff, 5 customers\n"))

        if users_only:
            self.stdout.write(
                self.style.SUCCESS("\n✅ User seeding complete! Skipping catalog data.\n")
            )
            return

        # Seed catalog
        self.stdout.write("🏭 Seeding manufacturers...")
        manufacturers = self.seed_manufacturers(fake)
        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(manufacturers)} manufacturers\n"))

        self.stdout.write("📂 Seeding categories...")
        categories = self.seed_categories(fake)
        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(categories)} categories\n"))

        self.stdout.write("💊 Seeding medicines...")
        medicines = self.seed_medicines(fake, categories, manufacturers)
        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(medicines)} medicines\n"))

        # Seed medicine relations
        self.stdout.write("🔗 Seeding medicine relations...")
        self.seed_medicine_relations(medicines)
        self.stdout.write(self.style.SUCCESS("✓ Created medicine relationships\n"))

        # Seed inventory
        self.stdout.write("📦 Seeding batches and inventory...")
        self.seed_batches_and_inventory(medicines, staff)
        self.stdout.write(self.style.SUCCESS("✓ Created batches and inventory\n"))

        # Seed orders and related data
        self.stdout.write("🛒 Seeding orders, payments, and shipments...")
        self.seed_orders_and_payments(customers, medicines, staff, fake)
        self.stdout.write(self.style.SUCCESS("✓ Created orders and payments\n"))

        # Seed prescriptions
        self.stdout.write("📋 Seeding prescriptions...")
        self.seed_prescriptions(customers, medicines, staff, fake)
        self.stdout.write(self.style.SUCCESS("✓ Created prescriptions\n"))

        self.stdout.write(
            self.style.SUCCESS("\n✅ Database seeding complete! 🎉\n")
        )
        self.print_summary(admin, staff, customers, manufacturers, categories, medicines)

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

    def seed_users(self, fake):
        """Create admin, staff, and customer users."""
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
        for i in range(5):
            customer = User.objects.create_user(
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password="customer123",
                role=Role.CUSTOMER,
            )
            customers.append(customer)

        return admin, staff, customers

    def seed_manufacturers(self, fake):
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

    def seed_categories(self, fake):
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

    def seed_medicines(self, fake, categories, manufacturers):
        """Create medicines with various dosage forms and strengths."""
        # (name, strength, dosage_form, category_names, composition)
        # The last three entries are branded products sharing composition
        # with an existing generic above — real substitute pairs so the
        # "out of stock -> similar medicines" feature has data to show.
        medicines_data = [
            ("Paracetamol", "500mg", "tablet", ["Pain Relief"], "Paracetamol"),
            ("Ibuprofen", "400mg", "tablet", ["Pain Relief"], "Ibuprofen"),
            ("Aspirin", "75mg", "tablet", ["Pain Relief", "Cardiovascular"], "Aspirin"),
            ("Amoxicillin", "500mg", "capsule", ["Antibiotics"], "Amoxicillin"),
            ("Ciprofloxacin", "500mg", "tablet", ["Antibiotics"], "Ciprofloxacin"),
            ("Vitamin C", "1000mg", "tablet", ["Vitamins & Supplements"], "Ascorbic Acid"),
            ("Vitamin D3", "400IU", "capsule", ["Vitamins & Supplements"], "Cholecalciferol"),
            ("Multivitamin", "Daily", "tablet", ["Vitamins & Supplements"], "Multivitamin Complex"),
            ("Cough Syrup", "5ml", "syrup", ["Cold & Flu"], "Dextromethorphan"),
            ("Omeprazole", "20mg", "capsule", ["Digestive Health"], "Omeprazole"),
            ("Metformin", "500mg", "tablet", ["Diabetes Management"], "Metformin"),
            ("Atorvastatin", "10mg", "tablet", ["Cardiovascular"], "Atorvastatin"),
            ("Lisinopril", "10mg", "tablet", ["Cardiovascular"], "Lisinopril"),
            ("Antibiotic Cream", "2%", "cream", ["Skin Care"], "Neomycin"),
            ("Hydrocortisone", "1%", "cream", ["Skin Care"], "Hydrocortisone"),
            ("Diphenhydramine", "25mg", "tablet", ["Cold & Flu"], "Diphenhydramine"),
            ("Ceftriaxone", "250mg", "injection", ["Antibiotics"], "Ceftriaxone"),
            ("Eye Drops", "0.5%", "drops", ["Skin Care"], "Chloramphenicol"),
            ("Crocin", "500mg", "tablet", ["Pain Relief"], "Paracetamol"),
            ("Calpol", "500mg", "tablet", ["Pain Relief"], "Paracetamol"),
            ("Brufen", "400mg", "tablet", ["Pain Relief"], "Ibuprofen"),
        ]

        medicines = []
        for name, strength, dosage_form, category_names, composition in medicines_data:
            category_list = [c for c in categories if c.name in category_names]
            category = category_list[0] if category_list else categories[0]
            manufacturer = random.choice(manufacturers)

            medicine, _ = Medicine.objects.get_or_create(
                name=name,
                strength=strength,
                dosage_form=dosage_form,
                defaults={
                    "description": f"{name} {strength} — {dosage_form} form",
                    "category": category,
                    "manufacturer": manufacturer,
                    "composition": composition,
                    "requires_prescription": random.choice([True, False]),
                    "is_active": True,
                },
            )
            medicines.append(medicine)

        return medicines

    def seed_medicine_relations(self, medicines):
        """Create medicine relations (side effects, frequently bought together)."""
        # Example relations: commonly prescribed together
        relations = [
            (medicines[0], medicines[9], "side_effect_companion"),  # Paracetamol + Omeprazole
            (medicines[1], medicines[9], "side_effect_companion"),  # Ibuprofen + Omeprazole
            (medicines[5], medicines[6], "frequently_bought_together"),  # Vitamin C + D3
            (medicines[6], medicines[5], "frequently_bought_together"),  # D3 + Vitamin C
            (medicines[3], medicines[14], "frequently_bought_together"),  # Amoxicillin + Hydrocortisone
            (medicines[2], medicines[12], "frequently_bought_together"),  # Aspirin + Lisinopril
        ]

        for from_med, to_med, relation_type in relations:
            MedicineRelation.objects.get_or_create(
                from_medicine=from_med,
                to_medicine=to_med,
                relation_type=relation_type,
                defaults={"weight": Decimal(random.uniform(0.5, 1.0))},
            )

    def seed_batches_and_inventory(self, medicines, staff):
        """Create product batches and inventory records."""
        for medicine in medicines:
            # Create 2-3 batches per medicine
            for batch_num in range(random.randint(2, 3)):
                batch_number = f"{medicine.id}-BATCH-{batch_num + 1:03d}"
                expiry_date = timezone.now().date() + timedelta(days=random.randint(60, 730))

                purchase_price = Decimal(random.uniform(10, 200))
                selling_price = purchase_price * Decimal(random.uniform(1.2, 1.5))

                batch, created = Batch.objects.get_or_create(
                    batch_number=batch_number,
                    defaults={
                        "medicine": medicine,
                        "expiry_date": expiry_date,
                        "purchase_price": purchase_price,
                        "selling_price": selling_price,
                        "is_active": True,
                    },
                )

                if created:
                    # Create inventory record
                    quantity = random.randint(20, 200)
                    inventory, _ = Inventory.objects.get_or_create(
                        batch=batch,
                        defaults={"quantity_available": quantity},
                    )

                    # Record the purchase stock movement
                    StockMovement.record(
                        batch=batch,
                        movement_type=StockMovement.MovementType.PURCHASE_IN,
                        quantity=quantity,
                        performed_by=staff,
                        reference=f"Initial stock for {batch_number}",
                    )

    def seed_orders_and_payments(self, customers, medicines, staff, fake):
        """Create sample orders with payments and shipments."""
        for customer in customers:
            # Create 1-3 orders per customer
            for order_num in range(random.randint(1, 3)):
                # Create order
                selected_medicines = random.sample(medicines, k=random.randint(1, 4))
                total_amount = Decimal(0)
                order_items = []

                order = Order.objects.create(
                    user=customer,
                    status=random.choice(
                        [Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.SHIPPED]
                    ),
                    total_amount=Decimal(0),  # Will update below
                    delivery_address=fake.address(),
                )

                # Add items to order
                for medicine in selected_medicines:
                    # Get a valid batch with stock
                    batch = (
                        Batch.objects.filter(
                            medicine=medicine,
                            is_active=True,
                        )
                        .order_by("expiry_date")
                        .first()
                    )

                    if not batch:
                        continue

                    quantity = random.randint(1, 5)
                    unit_price = batch.selling_price

                    order_item = OrderItem.objects.create(
                        order=order,
                        batch=batch,
                        quantity=quantity,
                        unit_price=unit_price,
                    )
                    total_amount += unit_price * quantity

                # Update order total
                order.total_amount = total_amount
                order.save(update_fields=["total_amount"])

                # Create payment
                payment = Payment.objects.create(
                    order=order,
                    status=(
                        Payment.Status.COMPLETED
                        if order.status != Order.Status.PENDING
                        else Payment.Status.PENDING
                    ),
                    amount=total_amount,
                )

                # Create shipment if order is confirmed or shipped
                if order.status in [Order.Status.CONFIRMED, Order.Status.SHIPPED]:
                    shipment = Shipment.objects.create(
                        order=order,
                        status=(
                            Shipment.Status.DISPATCHED
                            if order.status == Order.Status.SHIPPED
                            else Shipment.Status.PREPARING
                        ),
                        delivery_address=order.delivery_address,
                        carrier=random.choice(["Sajilo Delivery", "In-house", "Local Courier"]),
                        tracking_number=f"TRACK-{order.id}",
                        created_by=staff,
                    )

                # Create cart (inactive for completed orders)
                Cart.objects.get_or_create(user=customer)

    def seed_prescriptions(self, customers, medicines, staff, fake):
        """Create sample prescriptions."""
        prescription_medicines = [med for med in medicines if med.requires_prescription]

        for customer in customers[:3]:  # Create prescriptions for first 3 customers
            for _ in range(random.randint(1, 2)):
                prescription = Prescription.objects.create(
                    customer=customer,
                    status=random.choice(
                        [
                            Prescription.Status.PENDING,
                            Prescription.Status.APPROVED,
                        ]
                    ),
                    image="prescriptions/sample.pdf",
                )

                # Approve some prescriptions
                if prescription.status == Prescription.Status.APPROVED:
                    prescription.reviewed_by = staff
                    prescription.reviewed_at = timezone.now()
                    prescription.save()

                    # Add prescription items
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

    def print_summary(self, admin, staff, customers, manufacturers, categories, medicines):
        """Print a summary of seeded data."""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("📊 DATABASE SEEDING SUMMARY")
        self.stdout.write("=" * 60)

        self.stdout.write(f"\n👥 Users:")
        self.stdout.write(f"   • Admin: {admin.email}")
        self.stdout.write(f"   • Staff: {staff.email}")
        self.stdout.write(f"   • Customers: {len(customers)}")
        for customer in customers:
            self.stdout.write(f"      - {customer.email}")

        self.stdout.write(f"\n🏭 Catalog:")
        self.stdout.write(f"   • Manufacturers: {len(manufacturers)}")
        self.stdout.write(f"   • Categories: {len(categories)}")
        self.stdout.write(f"   • Medicines: {len(medicines)}")

        batch_count = Batch.objects.count()
        inventory_count = Inventory.objects.count()
        self.stdout.write(f"\n📦 Inventory:")
        self.stdout.write(f"   • Batches: {batch_count}")
        self.stdout.write(f"   • Inventory Records: {inventory_count}")

        order_count = Order.objects.count()
        payment_count = Payment.objects.count()
        shipment_count = Shipment.objects.count()
        self.stdout.write(f"\n🛒 Orders:")
        self.stdout.write(f"   • Orders: {order_count}")
        self.stdout.write(f"   • Payments: {payment_count}")
        self.stdout.write(f"   • Shipments: {shipment_count}")

        prescription_count = Prescription.objects.count()
        self.stdout.write(f"\n📋 Prescriptions:")
        self.stdout.write(f"   • Prescriptions: {prescription_count}")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("\n✅ You're all set! Test data is ready.\n")
        self.stdout.write("Quick Test Commands:")
        self.stdout.write("─" * 60)
        self.stdout.write(f"  curl -s http://localhost:8000/api/catalog/manufacturers/ | jq")
        self.stdout.write(f"  curl -s http://localhost:8000/api/catalog/medicines/ | jq")
        self.stdout.write("─" * 60 + "\n")
