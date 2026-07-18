// Shapes returned by /api/reports/* — see backend reports/views.py

import type { OrderStatus } from "./order"

export interface DashboardStats {
  revenue: {
    total: number
    today: number
    this_month: number
  }
  orders: {
    total: number
    today: number
    pending: number
    by_status: Partial<Record<OrderStatus, number>>
  }
  customers: {
    total: number
    new_this_month: number
  }
  catalog: {
    total_medicines: number
    active_medicines: number
  }
  prescriptions: {
    pending: number
  }
  inventory: {
    low_stock_count: number
    expiring_soon_count: number
    expired_count: number
  }
}

export interface SalesTrendPoint {
  date: string
  revenue: number
  orders: number
}

export interface SalesTrendResponse {
  days: number
  results: SalesTrendPoint[]
}

export interface TopSellingItem {
  medicine_id: string
  medicine_name: string
  total_quantity: number
  total_revenue: number
  order_count: number
}

export interface TopSellingResponse {
  days: number
  results: TopSellingItem[]
}
