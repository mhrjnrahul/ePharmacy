import { createBrowserRouter, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import RootLayout from "@/layouts/RootLayout"
import AppLayout from "@/layouts/AppLayout"
import AuthLayout from "@/layouts/AuthLayout"
import StorefrontLayout from "@/layouts/StorefrontLayout"
import AccountLayout from "@/layouts/AccountLayout"
import { useAuthStore } from "@/store/authStore"

// Public / storefront
import LandingPage from "@/pages/landing/LandingPage"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import UnauthorizedPage from "@/pages/auth/UnauthorizedPage"
import ShopPage from "@/pages/shop/ShopPage"
import ShopMedicinePage from "@/pages/shop/ShopMedicinePage"
import CheckoutPage from "@/pages/checkout/CheckoutPage"
import PaymentSuccessPage from "@/pages/payment/PaymentSuccessPage"

// Customer account
import AccountOrdersPage from "@/pages/account/AccountOrdersPage"
import AccountOrderDetailPage from "@/pages/account/AccountOrderDetailPage"
import AccountPrescriptionsPage from "@/pages/account/AccountPrescriptionsPage"
import AccountProfilePage from "@/pages/account/AccountProfilePage"

// Console (admin/staff)
import DashboardPage from "@/pages/dashboard/DashboardPage"
import CategoriesPage from "@/pages/categories/CategoriesPage"
import MedicinesPage from "@/pages/medicine/MedicinesPage"
import ManufacturersPage from "@/pages/manufacturers/ManufacturersPage"
import InventoryPage from "@/pages/inventory/InventoryPage"
import StockAdjustmentsPage from "@/pages/stock-adjustments/Stockadjustmentspage"
import UserManagementPage from "@/pages/user-management/UserManagementPage"
import OrdersPage from "@/pages/orders/OrdersPage"
import CustomersPage from "@/pages/customers/CustomersPage"
import AlertsPage from "@/pages/alerts/AlertsPage"
import ConsolePrescriptionsPage from "@/pages/prescriptions/ConsolePrescriptionsPage"
import ShipmentsPage from "@/pages/shipments/ShipmentsPage"
import ReportsPage from "@/pages/reports/ReportsPage"

/** Sends /orders to the right home per role — customers and staff live in different worlds now. */
const OrdersRedirect = () => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === "CUSTOMER" ? "/account/orders" : "/admin/orders"} replace />
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [

      // ── Landing (renders its own navbar/footer) ─────────────────────
      { path: "/", element: <LandingPage /> },

      // ── Auth ────────────────────────────────────────────────────────
      {
        element: <AuthLayout />,
        children: [
          { path: "login",    element: <LoginPage />    },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      { path: "/unauthorized", element: <UnauthorizedPage /> },

      // ── Storefront (public browsing) ────────────────────────────────
      {
        element: <StorefrontLayout />,
        children: [
          { path: "shop",     element: <ShopPage /> },
          { path: "shop/:id", element: <ShopMedicinePage /> },
        ],
      },

      // ── Customer account + checkout (any authenticated user) ───────
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <StorefrontLayout />,
            children: [
              {
                path: "account",
                element: <AccountLayout />,
                children: [
                  { index: true,          element: <Navigate to="/account/orders" replace /> },
                  { path: "orders",       element: <AccountOrdersPage /> },
                  { path: "orders/:id",   element: <AccountOrderDetailPage /> },
                  { path: "prescriptions", element: <AccountPrescriptionsPage /> },
                  { path: "profile",      element: <AccountProfilePage /> },
                ],
              },
            ],
          },
          // Standalone pages with their own minimal chrome
          { path: "checkout",        element: <CheckoutPage />       },
          { path: "payment/success", element: <PaymentSuccessPage /> },
        ],
      },

      // ── Console (admin/staff) ───────────────────────────────────────
      {
        element: <ProtectedRoute roles={["ADMIN", "STAFF"]} />,
        children: [
          {
            path: "admin",
            element: <AppLayout />,
            children: [
              { index: true,               element: <DashboardPage /> },
              { path: "orders",            element: <OrdersPage /> },
              { path: "prescriptions",     element: <ConsolePrescriptionsPage /> },
              { path: "shipments",         element: <ShipmentsPage /> },
              { path: "inventory",         element: <InventoryPage /> },
              { path: "alerts",            element: <AlertsPage /> },
              { path: "stock-adjustments", element: <StockAdjustmentsPage /> },
              { path: "medicines",         element: <MedicinesPage /> },
              { path: "categories",        element: <CategoriesPage /> },
              { path: "manufacturers",     element: <ManufacturersPage /> },
              { path: "customers",         element: <CustomersPage /> },
              { path: "reports",           element: <ReportsPage /> },
              {
                element: <ProtectedRoute roles={["ADMIN"]} />,
                children: [
                  { path: "users", element: <UserManagementPage /> },
                ],
              },
            ],
          },
        ],
      },

      // ── Legacy route redirects (old bookmarks keep working) ────────
      { path: "/dashboard",         element: <Navigate to="/admin" replace /> },
      { path: "/medicines",         element: <Navigate to="/admin/medicines" replace /> },
      { path: "/categories",        element: <Navigate to="/admin/categories" replace /> },
      { path: "/manufacturers",     element: <Navigate to="/admin/manufacturers" replace /> },
      { path: "/customers",         element: <Navigate to="/admin/customers" replace /> },
      { path: "/purchase-orders",   element: <Navigate to="/admin/inventory" replace /> },
      { path: "/stock-adjustments", element: <Navigate to="/admin/stock-adjustments" replace /> },
      { path: "/users",             element: <Navigate to="/admin/users" replace /> },
      { path: "/sales",             element: <Navigate to="/admin/reports" replace /> },
      { path: "/reports",           element: <Navigate to="/admin/reports" replace /> },
      { path: "/logs",              element: <Navigate to="/admin" replace /> },
      { path: "/orders",            element: <OrdersRedirect /> },

      // ── Catch all ───────────────────────────────────────────────────
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
