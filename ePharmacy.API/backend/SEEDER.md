# Database Seeder Documentation

This document explains how to use the database seeder to populate your ePharmacy API with realistic test data.

## Overview

The seeder is a Django management command that populates your database with realistic pharmaceutical data including:

- **Users**: Admin, Staff, and 5 Customers
- **Catalog**: 8 Manufacturers, 8 Categories, 18 Medicines
- **Inventory**: 42 Batches with stock movements and 42 Inventory records
- **Orders**: 12 Sample orders with payments and shipments
- **Prescriptions**: 6 Sample prescriptions with items
- **Medicine Relations**: Companion medicines and frequently-bought-together recommendations

## Prerequisites

Ensure the Faker library is installed:

```bash
pip install faker==40.15.0
```

Or install from requirements.txt:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage (Preserve Existing Data)

To seed the database while keeping existing data:

```bash
python manage.py seed_db
```

### Clear and Reseed (Destructive)

To completely clear all data and seed fresh:

```bash
python manage.py seed_db --clear
```

⚠️ **WARNING**: The `--clear` flag will delete all data from the database. Use with caution!

### Seed Only Users

To seed only user data without creating medicines and orders:

```bash
python manage.py seed_db --users-only
```

### View Help

```bash
python manage.py seed_db --help
```

## What Gets Created

### Users

```
Admin User:
  Email: admin@epharmacy.com
  Password: admin123
  Role: ADMIN

Staff User:
  Email: staff@epharmacy.com
  Password: staff123
  Role: STAFF

5 Customers:
  Email: [randomly generated]
  Password: customer123
  Role: CUSTOMER
```

### Catalog Data

**8 Manufacturers:**
- Himalayan Pharma
- Biochem Pharmaceutical
- Ipca Laboratories
- Ranbaxy Nepal
- Lupin Limited
- Sun Pharma
- GlaxoSmithKline
- Novo Nordisk

**8 Categories:**
- Pain Relief
- Antibiotics
- Vitamins & Supplements
- Cold & Flu
- Digestive Health
- Skin Care
- Diabetes Management
- Cardiovascular

**18 Medicines** with various dosage forms:
- Tablets: Paracetamol, Ibuprofen, Aspirin, Ciprofloxacin, Vitamin C, etc.
- Capsules: Amoxicillin, Vitamin D3, Omeprazole, etc.
- Syrups: Cough Syrup
- Injections: Ceftriaxone
- Creams: Antibiotic Cream, Hydrocortisone
- Drops: Eye Drops

### Inventory

- **42 Batches**: Each medicine has 2-3 batches with:
  - Unique batch numbers
  - Random expiry dates (60-730 days from now)
  - Realistic purchase and selling prices
  - Stock quantity (20-200 units per batch)

- **Stock Movements**: Each batch records initial purchase movements for full audit trail

### Orders

- **12 Orders** across 5 customers with:
  - Random statuses: PENDING, CONFIRMED, or SHIPPED
  - Multiple items per order
  - Price snapshots locked at order time
  - Realistic delivery addresses

- **12 Payments**: One per order with:
  - Matching order amounts
  - Status matching order status

- **7 Shipments**: For CONFIRMED and SHIPPED orders with:
  - Realistic carriers (Sajilo Delivery, In-house, Local Courier)
  - Tracking numbers
  - Proper status synchronization

### Prescriptions

- **6 Prescriptions** for first 3 customers with:
  - Random statuses: PENDING or APPROVED
  - For approved prescriptions: assigned to staff reviewer
  - **Prescription Items**: 1-3 medicines per prescription with approved quantities

### Medicine Relations

- **6 Relations** including:
  - Side effect companions (e.g., Omeprazole with Ibuprofen for stomach protection)
  - Frequently bought together (e.g., Vitamin C + D3)

## API Testing

After seeding, you can test the API endpoints:

### List all manufacturers:
```bash
curl -s http://localhost:8000/api/catalog/manufacturers/ | jq
```

### List all medicines:
```bash
curl -s http://localhost:8000/api/catalog/medicines/ | jq
```

### List all orders:
```bash
curl -s http://localhost:8000/api/orders/ | jq
```

### Get specific manufacturer by ID:
```bash
# First get a manufacturer ID from the list, then:
curl -s http://localhost:8000/api/catalog/manufacturers/{id}/ | jq
```

### Authentication for admin/staff endpoints:

```bash
# Login as admin
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@epharmacy.com",
    "password": "admin123"
  }'

# Use returned access token in subsequent requests:
curl -s http://localhost:8000/api/admin-only-endpoint/ \
  -H "Authorization: Bearer {access_token}" | jq
```

## Seed Data Characteristics

All seeded data is:

- **Deterministic**: Same results each run (seed set to 42) - useful for reproducible testing
- **Realistic**: Pharmacy-appropriate data with realistic medicine names, dosages, and prices
- **Complete**: Includes all related records (e.g., inventory for each batch)
- **Audited**: Stock movements recorded for inventory changes
- **Varied**: Different statuses and scenarios for testing different workflows

## Modifying Seed Data

To customize the seeded data, edit `catalog/management/commands/seed_db.py`:

### Change number of customers:
```python
def seed_users(self, fake):
    # Change the range in the for loop:
    for i in range(10):  # Creates 10 customers instead of 5
        ...
```

### Change number of medicines:
Edit the `medicines_data` list in `seed_medicines()` method

### Change price ranges:
In `seed_batches_and_inventory()`:
```python
purchase_price = Decimal(random.uniform(10, 200))  # Adjust range
selling_price = purchase_price * Decimal(random.uniform(1.2, 1.5))  # Adjust markup
```

### Change inventory quantities:
In `seed_batches_and_inventory()`:
```python
quantity = random.randint(20, 200)  # Adjust range
```

## Troubleshooting

### Command not found error
Ensure the django app is in INSTALLED_APPS in settings.py:
```python
INSTALLED_APPS = [
    ...
    "catalog",
    ...
]
```

### Integrity errors
If you get unique constraint errors, use `--clear` flag to reset the database:
```bash
python manage.py seed_db --clear
```

### Faker import errors
Reinstall the faker library:
```bash
pip install --upgrade faker
```

## File Location

```
ePharmacy.API/backend/
└── catalog/
    └── management/
        └── commands/
            └── seed_db.py  ← This file
```

## Summary

The seeder provides a complete, realistic test dataset that can be regenerated on demand. Use it for:

- ✅ Development and testing
- ✅ API endpoint testing
- ✅ Load testing
- ✅ Demo purposes
- ✅ Frontend development with real-like data

**Happy testing! 🎉**
