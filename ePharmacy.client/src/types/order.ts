export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"

export interface CartItem {
  id: string
  medicine: string        // UUID
  medicine_name: string
  requires_prescription: boolean
  quantity: number
  subtotal: number        // server-computed from earliest batch price; may be 0 if no batch
}

export interface CartResponse {
  id: string
  items: CartItem[]
  total: number
}

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

export interface CheckoutResponse {
  id: string
  status: OrderStatus
  total_amount: string
  delivery_address: string
  created_at: string
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"

export interface PaymentInitiateResponse {
  amount: string
  tax_amount: string
  total_amount: string
  transaction_uuid: string
  product_code: string
  product_service_charge: string
  product_delivery_charge: string
  success_url: string
  failure_url: string
  signed_field_names: string
  signature: string
  [key: string]: string  // allow extra fields eSewa may add
}

export interface PaymentRecord {
  id: string
  order: string
  status: PaymentStatus
  amount: string
  transaction_id: string | null
  created_at: string
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