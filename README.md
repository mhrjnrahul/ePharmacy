# Ausadi

A full-stack online pharmacy management system covering the complete lifecycle of a pharmacy business: catalog management, batch-level inventory with FIFO stock rotation, prescription review, order fulfilment, shipment tracking, payments, and sales analytics — with separate experiences for customers and for pharmacy staff/admins.

The system is split into two independent projects that communicate over a REST API:

- **`ePharmacy.API/backend`** — Django + Django REST Framework API
- **`ePharmacy.client`** — React + TypeScript single-page application

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Core Business Workflows](#core-business-workflows)
- [User Roles & Permissions](#user-roles--permissions)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)

---

## Overview

Ausadi models a real pharmacy's day-to-day operations rather than a generic storefront. Medicines are tracked at the **batch** level (not just a single stock count), sales automatically deduct from the batch that expires soonest, every stock change is written to an immutable audit ledger, and prescription-only medicines cannot be purchased until a pharmacist has explicitly reviewed and approved the specific quantities a customer is allowed to buy.

The application serves three kinds of users through one codebase:

- **Customers** browse the catalog, manage a cart, check out and pay online (eSewa), upload prescriptions, and track their own orders.
- **Staff** run day-to-day operations: confirm/process/ship orders, review prescriptions, adjust stock, manage shipments.
- **Admins** additionally manage the catalog (medicines/categories/manufacturers), staff accounts, and view sales reports.

## Key Features

**Customer-facing**
- Browse and search the medicine catalog by category, dosage form, and prescription requirement
- Shopping cart with live stock/price checks
- Checkout with delivery address validation and online payment via eSewa
- Upload prescriptions and track their approval status
- "Frequently bought together" and cart-based product recommendations, plus in-stock substitute suggestions for out-of-stock medicines
- Order history with live shipment tracking
- Personal account dashboard (order/spend summary, pending prescriptions, recent orders)

**Staff / Admin console**
- Central dashboard with revenue, order, and stock-alert widgets, plus a 30-day sales trend chart
- Order management with an enforced status pipeline, cancellation with automatic stock restoration, and a payment status/refund view per order
- Prescription review workflow — approve specific medicines/quantities or reject with a reason shown to the customer
- Batch-level inventory management: add batches, adjust stock manually, view the full movement ledger, write off expired stock
- Low-stock / expiring-soon / expired stock alerts with configurable thresholds
- Shipment dispatch and delivery tracking, synced back to order status
- Catalog management (medicines, categories, manufacturers) with search/filtering and photo uploads
- A dedicated view for curating medicine relations (companion medicines, frequently-bought-together pairs) that feed the recommendation engine
- Staff and customer account management, including a customer detail view with prescription history
- Sales reports: revenue trends, top-selling medicines, recommendation-weight rebuilding

## Tech Stack

### Backend

| Component | Choice |
|---|---|
| Framework | Django 6.0.3 + Django REST Framework 3.16.1 |
| Auth | JWT via `djangorestframework-simplejwt` (60 min access / 1 day rotating refresh, blacklist on rotation) |
| Filtering | `django-filter` |
| API schema / docs | `drf-spectacular` (OpenAPI schema + Swagger UI) |
| Database | SQLite (development) |
| Images | Pillow |

### Frontend

| Component | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 (React Compiler enabled) |
| Routing | React Router 7 |
| Server state | TanStack React Query 5 |
| Client state | Zustand (auth store, persisted) |
| HTTP client | Axios (with auto token-refresh interceptor) |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI, Lucide icons |
| Charts | Recharts |

## System Architecture

- **Client–server, stateless API.** The React SPA talks to the Django backend exclusively over JSON REST endpoints under `/api/`; there is no server-side rendering or shared session state.
- **JWT-based auth.** On login the backend issues a short-lived access token and a longer-lived rotating refresh token. The frontend attaches the access token to every request via an Axios interceptor and transparently refreshes it on a 401, retrying the original request once.
- **Role-based access control.** Every user has exactly one role — `ADMIN`, `STAFF`, or `CUSTOMER` — enforced on both sides: DRF permission classes gate each endpoint, and the frontend's route tree wraps role-restricted sections in a `ProtectedRoute` guard.
- **App-per-domain backend.** The Django project is split into focused apps (`users`, `catalog`, `inventory`, `prescriptions`, `orders`, `payment`, `shipment`, `reports`, plus a shared `core` app), each owning its own models, serializers, and views.
- **Snapshot pattern for financial integrity.** An `OrderItem` locks in the unit price and batch at the moment of checkout, so later price or stock changes never retroactively affect a placed order.
- **Immutable audit ledger.** Every stock change — sale, purchase, return, manual adjustment, or write-off — is recorded as a `StockMovement` row with before/after quantities; stock levels are never edited directly, only derived from this ledger.
- **Client-side caching.** React Query owns all server state (medicines, cart, orders, prescriptions, etc.), with mutations invalidating the relevant query keys so the UI stays in sync without manual refetching.

## Project Structure

```
Ausadi/
├── ePharmacy.API/
│   └── backend/
│       ├── config/            # Django project settings, root URLconf
│       ├── core/               # Shared TimeStampedModel base, Role enum, shared permissions
│       ├── users/              # Custom User model, auth (JWT), registration, profile
│       ├── catalog/             # Categories, manufacturers, medicines, recommendation engine
│       ├── inventory/           # Batches, stock ledger, adjustments, alerts
│       ├── prescriptions/       # Prescription upload + staff approval workflow
│       ├── orders/              # Cart, checkout, order lifecycle
│       ├── payment/             # eSewa payment integration
│       ├── shipment/            # Shipment dispatch/delivery tracking
│       └── reports/              # Dashboard/analytics endpoints
│
└── ePharmacy.client/
    └── src/
        ├── api/                # Axios client + one module per backend domain
        ├── hooks/               # React Query hooks wrapping the api/ modules
        ├── store/               # Zustand stores (auth, toast, cart-drawer signal)
        ├── router/              # Route tree, role guards
        ├── layouts/              # Shell layouts (storefront, account, admin console, auth)
        ├── components/           # Shared UI (landing sections, cart, shop cards, shadcn/ui primitives)
        ├── pages/                # One folder per route/feature area
        └── types/                # Shared TypeScript types mirroring backend serializers
```

## Core Business Workflows

### FIFO batch selection & stock deduction
Medicines are stocked in **batches**, each with its own expiry date, purchase price, and selling price. At checkout, the system picks the batch for each medicine that (a) is active, (b) has not expired, and (c) holds enough quantity to fully cover the requested amount — ordered by soonest expiry first. If no single batch can cover the quantity, checkout fails rather than splitting the order across batches. This guarantees older stock is always sold before newer stock.

### Immutable stock ledger
Stock is never edited directly. Every change — a sale, a manual adjustment, a returned/cancelled order, or writing off expired stock — is recorded as a `StockMovement` entry capturing the movement type, quantity, and the exact before/after stock levels, all inside a database transaction with row-level locking to stay correct under concurrent orders.

### Order lifecycle
Orders move through a fixed pipeline: **Pending → Confirmed → Processing → Shipped → Delivered**, with **Cancelled** reachable from any non-delivered state. Confirming an order is the point stock is actually deducted; cancelling an order that had already deducted stock automatically restores it. Customers may only cancel their own orders while still Pending; staff can cancel at any point before delivery.

### Prescription approval
A customer uploads a prescription image/PDF as a standalone document — it isn't tied to a specific order at upload time. A staff member reviews it and either **approves** it (specifying exactly which medicines and up to what quantity it authorises) or **rejects** it with a reason the customer can see. Adding a prescription-only medicine to the cart or checking out re-validates that an approved prescription still covers the requested quantity.

### Shipment tracking
Once an order reaches Processing, staff can create a shipment, which progresses **Preparing → Dispatched → Out for Delivery → Delivered** (or **Failed**). Shipment status changes automatically sync back to the parent order's status (e.g. dispatching a shipment moves the order to "Shipped").

### Recommendation engine
Three signals feed a combined "you might also like" score for a medicine or a whole cart:
1. **Content-based** — hand-curated medicine relations (e.g. a companion medicine for side effects, or items frequently bought together), manageable from the admin console.
2. **Collaborative filtering** — cosine similarity over a co-purchase matrix built from real order history.
3. **Composition-based** — Jaccard similarity over each medicine's active-ingredient list, which also powers **substitute suggestions**: if a medicine is out of stock, customers are shown in-stock alternatives that share its composition.

Scores from the content-based and collaborative signals are weighted and summed to rank suggestions; the "frequently bought together" weights can be recomputed on demand from the latest order history.

### Payment (eSewa)
Checkout creates a `Pending` payment record and returns a signed form payload (HMAC-SHA256) that the frontend auto-submits to eSewa's hosted payment page. After the customer completes payment, eSewa redirects back with a signed response, which the backend independently re-verifies against eSewa's transaction-status API before marking the payment (and the underlying order) as confirmed. Failed or tampered verifications are rejected.

## User Roles & Permissions

| Capability | Customer | Staff | Admin |
|---|---|---|---|
| Browse catalog, cart, checkout | ✅ | — | — |
| Upload & track own prescriptions | ✅ | — | — |
| View own orders & shipments | ✅ | — | — |
| Review/approve/reject prescriptions | | ✅ | ✅ |
| Manage orders, shipments, inventory | | ✅ | ✅ |
| View sales reports & dashboard | | ✅ | ✅ |
| Manage catalog (medicines/categories/manufacturers) | | ✅ | ✅ |
| Manage staff accounts | | | ✅ |

## API Overview

All endpoints are namespaced under `/api/`. Interactive documentation is available at `/api/docs/` (OpenAPI schema at `/api/schema/`) once the backend is running.

| Prefix | Domain |
|---|---|
| `/api/auth/` | Registration, login, token refresh/logout, profile, user management |
| `/api/catalog/` | Categories, manufacturers, medicines, recommendations |
| `/api/inventory/` | Batches, stock movements, manual adjustments, stock summary |
| `/api/prescriptions/` | Upload, review, approval/rejection, approved items |
| `/api/orders/` | Cart, checkout, order list/detail, status updates, cancellation |
| `/api/payment/` | Payment initiation, verification, detail, refund |
| `/api/shipping/` | Shipment creation, status updates, tracking by order |
| `/api/reports/` | Dashboard stats, sales trend, top-selling medicines |

## Getting Started

### Backend

```bash
cd ePharmacy.API/backend
python -m venv venv
venv\Scripts\activate        # Windows — use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_db      # optional — populates realistic demo data
python manage.py runserver
```

The API serves at `http://127.0.0.1:8000/`. Seeding creates demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ausadi.com` | `admin123` |
| Staff | `staff@ausadi.com` | `staff123` |
| Customer | (5 randomly generated) | `customer123` |

### Frontend

```bash
cd ePharmacy.client
npm install
npm run dev
```

The app serves at `http://localhost:5173/` and expects the backend to be running at `http://127.0.0.1:8000`.

Other useful scripts: `npm run build` (type-check + production build), `npm run lint`, `npm run preview`.
