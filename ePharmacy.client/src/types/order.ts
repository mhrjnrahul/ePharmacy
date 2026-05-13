export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"

export interface OrderList {
  id: string
  status: OrderStatus
  total_amount: string
  delivery_address: string
  created_at: string
}

export interface OrderItem {
  id: string
  batch: string
  batch_number: string
  medicine_name: string
  quantity: number
  unit_price: string
  subtotal: string
}

export interface OrderDetail {
  id: string
  user: string
  customer_email: string
  status: OrderStatus
  status_display: string
  total_amount: string
  delivery_address: string
  items: OrderItem[]
  cancelled_by: string | null
  cancellation_reason: string
  cancelled_at: string | null
  created_at: string
  updated_at: string
}