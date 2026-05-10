export interface DashboardStats {
  total_revenue: number
  total_orders: number
  total_profit: number
  low_stock_count: number
  pending_orders: number
}

export interface TopSellingProduct {
  id: number
  name: string
  total_sold: number
  revenue: number
}

export interface RecentOrder {
  id: number
  order_number: string
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  total_amount: number
  created_at: string
}

export interface SalesTrend {
  date: string
  revenue: number
  orders: number
}

export interface ExpiryAlert {
  id: number
  product_name: string
  variant_name: string
  sku: string
  stock_level: number
  expiry_date: string
  days_until_expiry: number
}

export interface ReorderSuggestion {
  id: number
  product_name: string
  variant_name: string
  sku: string
  stock_level: number
  reorder_point: number
}

export interface StockHealth {
  healthy: number
  low_stock: number
  out_of_stock: number
}