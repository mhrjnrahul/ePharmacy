import { createBrowserRouter, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import AppLayout from "@/layouts/AppLayout"
import AuthLayout from "@/layouts/AuthLayout"

// Pages
import LandingPage from "@/pages/landing/LandingPage"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import UnauthorizedPage from "@/pages/auth/UnauthorizedPage"

import DashboardPage from "@/pages/dashboard/DashboardPage"
import CategoriesPage from "@/pages/categories/CategoriesPage"
import MedicinesPage from "@/pages/medicine/MedicinesPage"
import ManufacturersPage from "@/pages/manufacturers/ManufacturersPage"
import InventoryPage from "@/pages/inventory/InventoryPage"
import StockAdjustmentsPage from "@/pages/stock-adjustments/Stockadjustmentspage"
import UserManagementPage from "@/pages/user-management/UserManagementPage"
import OrdersPage from "@/pages/orders/OrdersPage"

export const router = createBrowserRouter([
  // ── Landing (standalone, no layout wrapper) ───────────────────────
  { path: "/", element: <LandingPage /> },

  // ── Auth (split layout) ───────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: "login",    element: <LoginPage />    },
      { path: "register", element: <RegisterPage /> },
    ],
  },

  // ── Unauthorized ──────────────────────────────────────────────────
  { path: "/unauthorized", element: <UnauthorizedPage /> },

  // ── Admin only ────────────────────────────────────────────────────
  {
    element: <ProtectedRoute roles={["ADMIN"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "users", element: <UserManagementPage /> },
          { path: "logs",  element: <div style={{ padding: "24px" }}>System Logs — coming soon</div>    },
        ],
      },
    ],
  },

  // ── Admin + Staff ─────────────────────────────────────────────────
  {
    element: <ProtectedRoute roles={["ADMIN", "STAFF"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "dashboard",         element: <DashboardPage /> },
          { path: "medicines", element: <MedicinesPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "manufacturers",         element: <ManufacturersPage />         },
          { path: "customers",         element: <div style={{ padding: "24px" }}>Customers — coming soon</div>         },
          { path: "sales",             element: <div style={{ padding: "24px" }}>Sales — coming soon</div>             },
          { path: "purchase-orders",   element: <InventoryPage />   },
          { path: "stock-adjustments", element: <StockAdjustmentsPage /> },
          { path: "reports",           element: <div style={{ padding: "24px" }}>Reports — coming soon</div>           },
        ],
      },
    ],
  },

  // ── All authenticated ─────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "orders", element: <OrdersPage /> },
        ],
      },
    ],
  },

  // ── Catch all ─────────────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
])