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
          { path: "users", element: <div style={{ padding: "24px" }}>User Management — coming soon</div> },
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
          { path: "suppliers",         element: <div style={{ padding: "24px" }}>Suppliers — coming soon</div>         },
          { path: "customers",         element: <div style={{ padding: "24px" }}>Customers — coming soon</div>         },
          { path: "sales",             element: <div style={{ padding: "24px" }}>Sales — coming soon</div>             },
          { path: "purchase-orders",   element: <div style={{ padding: "24px" }}>Purchase Orders — coming soon</div>   },
          { path: "stock-adjustments", element: <div style={{ padding: "24px" }}>Stock Adjustments — coming soon</div> },
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
          { path: "orders", element: <div style={{ padding: "24px" }}>Orders — coming soon</div> },
        ],
      },
    ],
  },

  // ── Catch all ─────────────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
])