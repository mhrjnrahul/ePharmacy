export interface BatchList {
  id: string
  medicine: string        
  batch_number: string
  expiry_date: string
  selling_price: string
  quantity_available: number
  is_expired: boolean
  is_active: boolean
}

export interface BatchDetail {
  id: string
  medicine: string
  medicine_name: string
  batch_number: string
  expiry_date: string
  purchase_price: string
  selling_price: string
  is_active: boolean
  is_expired: boolean
  inventory: {
    id: string
    quantity_available: number
    updated_at: string
  }
  created_at: string
  updated_at: string
}

export interface CreateBatchRequest {
  medicine: string
  batch_number: string
  expiry_date: string
  purchase_price: string
  selling_price: string
  is_active: boolean
  initial_quantity: number
}

export interface UpdateBatchRequest {
  selling_price: string
  is_active: boolean
}

export type MovementType = "purchase_in" | "sale_out" | "return_in" | "adjustment" | "expired_out"

export interface StockMovement {
  id: string
  batch: string
  medicine_name: string
  movement_type: MovementType
  movement_type_display: string
  quantity: number
  quantity_before: number
  quantity_after: number
  performed_by: string | null
  performed_by_email: string
  reference: string
  notes: string
  created_at: string
}

export interface StockAdjustRequest {
  batch: string
  quantity: number
  direction: "in" | "out"
  notes: string
}