# ePharmacy Database Seeder - Quick Reference

## What is it?

A Django management command that populates your database with realistic pharmaceutical test data in seconds.

## Quick Start

```bash
# Seed database (preserve existing data)
python manage.py seed_db

# Clear and reseed fresh
python manage.py seed_db --clear

# Users only
python manage.py seed_db --users-only
```

## What Gets Created

✅ **7 Users**
- 1 Admin (admin@epharmacy.com / admin123)
- 1 Staff (staff@epharmacy.com / staff123)
- 5 Customers (random emails / customer123)

✅ **Catalog**
- 8 Manufacturers (Himalayan Pharma, Ranbaxy Nepal, etc.)
- 8 Categories (Pain Relief, Antibiotics, Vitamins, etc.)
- 18 Medicines (various dosage forms: tablets, capsules, syrups, injections, creams, drops)

✅ **Inventory**
- 42 Batches (2-3 batches per medicine)
- 42 Inventory Records (stock tracking)
- Stock movements for audit trail

✅ **Orders & Payments**
- 12 Orders across 5 customers
- 12 Payments (one per order)
- 7 Shipments with tracking

✅ **Prescriptions**
- 6 Prescriptions for first 3 customers
- Prescription items with approved quantities

✅ **Medicine Relations**
- 6 Relations (side effect companions & frequently bought together)

## Sample Login Credentials

| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@epharmacy.com      | admin123     |
| Staff    | staff@epharmacy.com      | staff123     |
| Customer | (randomly generated)     | customer123  |

## API Testing Examples

```bash
# List all manufacturers
curl -s http://localhost:8000/api/catalog/manufacturers/ | jq

# List all medicines
curl -s http://localhost:8000/api/catalog/medicines/ | jq

# List all orders (requires authentication)
curl -s http://localhost:8000/api/orders/ | jq

# Get admin token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@epharmacy.com","password":"admin123"}'

# Use token in requests
curl -s http://localhost:8000/api/admin-endpoint/ \
  -H "Authorization: Bearer <token>"
```

## Data Characteristics

- **Deterministic**: Same data every time (reproducible for testing)
- **Realistic**: Actual pharmacy names, medicines, dosages
- **Complete**: All relations populated (medicines → categories, manufacturers, batches)
- **Audited**: Stock movements recorded for inventory changes
- **Varied**: Different statuses (pending, confirmed, shipped, delivered)

## File Location

```
backend/
├── catalog/management/commands/seed_db.py  ← Main seeder
├── SEEDER.md                                ← Full documentation
└── requirements.txt                         (includes faker==40.15.0)
```

## For More Information

See `SEEDER.md` for detailed documentation including:
- Complete usage guide
- Customization instructions
- Troubleshooting tips
- API testing examples

## Troubleshooting

```bash
# Command not found?
# Make sure 'catalog' is in INSTALLED_APPS in settings.py

# Integrity errors?
# Use --clear flag: python manage.py seed_db --clear

# Faker import error?
# Reinstall: pip install --upgrade faker
```

---

**Status**: ✅ Ready to use  
**Version**: 1.0  
**Created**: May 12, 2026
