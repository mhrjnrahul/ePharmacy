// import { api } from "./axios"
import type {
  DashboardStats,
  TopSellingProduct,
  RecentOrder,
  SalesTrend,
  ExpiryAlert,
  ReorderSuggestion,
  StockHealth,
} from "@/types"

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return {
    total_revenue: 485250,
    total_orders: 1284,
    total_profit: 142300,
    low_stock_count: 8,
    pending_orders: 23,
  }
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<DashboardStats>("/api/v1/analytics/dashboard/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchTopSelling = async (): Promise<TopSellingProduct[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    { id: 1, name: "Paracetamol 500mg", total_sold: 842, revenue: 42100 },
    { id: 2, name: "Amoxicillin 250mg", total_sold: 634, revenue: 88760 },
    { id: 3, name: "Omeprazole 20mg",   total_sold: 521, revenue: 62520 },
    { id: 4, name: "Cetirizine 10mg",   total_sold: 480, revenue: 33600 },
    { id: 5, name: "Metformin 500mg",   total_sold: 390, revenue: 27300 },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<TopSellingProduct[]>("/api/v1/analytics/top-selling/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchRecentOrders = async (): Promise<RecentOrder[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    { id: 1, order_number: "ORD-0001", status: "DELIVERED",  total_amount: 2450, created_at: "2025-04-10T10:30:00Z" },
    { id: 2, order_number: "ORD-0002", status: "PENDING",    total_amount: 1200, created_at: "2025-04-10T11:00:00Z" },
    { id: 3, order_number: "ORD-0003", status: "PROCESSING", total_amount: 3800, created_at: "2025-04-10T11:45:00Z" },
    { id: 4, order_number: "ORD-0004", status: "SHIPPED",    total_amount: 950,  created_at: "2025-04-10T12:00:00Z" },
    { id: 5, order_number: "ORD-0005", status: "CANCELLED",  total_amount: 1750, created_at: "2025-04-10T12:30:00Z" },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<RecentOrder[]>("/api/v1/orders/all/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchSalesTrend = async (): Promise<SalesTrend[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    { date: "Apr 4",  revenue: 38200, orders: 98  },
    { date: "Apr 5",  revenue: 42100, orders: 110 },
    { date: "Apr 6",  revenue: 39800, orders: 102 },
    { date: "Apr 7",  revenue: 51200, orders: 134 },
    { date: "Apr 8",  revenue: 47600, orders: 121 },
    { date: "Apr 9",  revenue: 55400, orders: 145 },
    { date: "Apr 10", revenue: 61800, orders: 158 },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<SalesTrend[]>("/api/v1/analytics/reports/sales/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchExpiryAlerts = async (): Promise<ExpiryAlert[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    { id: 1, product_name: "Amoxicillin",   variant_name: "500mg Capsule", sku: "AMX-500-CAP", stock_level: 240, expiry_date: "2025-04-25", days_until_expiry: 15 },
    { id: 2, product_name: "Ibuprofen",     variant_name: "400mg Tablet",  sku: "IBU-400-TAB", stock_level: 180, expiry_date: "2025-05-01", days_until_expiry: 21 },
    { id: 3, product_name: "Cetirizine",    variant_name: "10mg Tablet",   sku: "CET-010-TAB", stock_level: 96,  expiry_date: "2025-05-10", days_until_expiry: 30 },
    { id: 4, product_name: "Metformin",     variant_name: "500mg Tablet",  sku: "MET-500-TAB", stock_level: 420, expiry_date: "2025-05-18", days_until_expiry: 38 },
    { id: 5, product_name: "Pantoprazole",  variant_name: "40mg Tablet",   sku: "PAN-040-TAB", stock_level: 150, expiry_date: "2025-06-01", days_until_expiry: 52 },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // Requires your friend to add a dedicated expiry alerts endpoint
  // e.g. GET /api/v1/inventory/expiry-alerts/?days=90
  // const response = await api.get<ExpiryAlert[]>("/api/v1/inventory/expiry-alerts/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchReorderSuggestions = async (): Promise<ReorderSuggestion[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    { id: 1, product_name: "Paracetamol",  variant_name: "500mg Tablet",  sku: "PAR-500-TAB", stock_level: 12, reorder_point: 50  },
    { id: 2, product_name: "Omeprazole",   variant_name: "20mg Capsule",  sku: "OME-020-CAP", stock_level: 8,  reorder_point: 40  },
    { id: 3, product_name: "Azithromycin", variant_name: "250mg Tablet",  sku: "AZI-250-TAB", stock_level: 5,  reorder_point: 30  },
    { id: 4, product_name: "Amlodipine",   variant_name: "5mg Tablet",    sku: "AML-005-TAB", stock_level: 18, reorder_point: 60  },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // Already exists in Django — hits the low-stock endpoint
  // const response = await api.get<ReorderSuggestion[]>("/api/v1/inventory/low-stock/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchStockHealth = async (): Promise<StockHealth> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return {
    healthy: 142,
    low_stock: 8,
    out_of_stock: 3,
  }
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // Requires your friend to add this endpoint
  // e.g. GET /api/v1/inventory/stock-health/
  // const response = await api.get<StockHealth>("/api/v1/inventory/stock-health/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}