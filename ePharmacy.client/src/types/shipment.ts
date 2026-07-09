export type ShipmentStatus =
  | "preparing" | "dispatched" | "out_for_delivery" | "delivered" | "failed"

export interface Shipment {
  id: string
  order: string
  order_status: string
  customer_email: string
  status: ShipmentStatus
  status_display: string
  carrier: string
  tracking_number: string
  delivery_address: string
  dispatched_at: string | null
  delivered_at: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface CreateShipmentRequest {
  order: string
  carrier?: string
  tracking_number?: string
  delivery_address?: string
  notes?: string
}

export interface ShipmentStatusUpdateRequest {
  status: ShipmentStatus
  tracking_number?: string
  notes?: string
}
