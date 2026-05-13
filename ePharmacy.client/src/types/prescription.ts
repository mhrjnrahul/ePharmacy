export type PrescriptionStatus = "pending" | "approved" | "rejected"

export interface PrescriptionList {
  id: string
  customer: string
  customer_email: string
  status: PrescriptionStatus
  created_at: string
  reviewed_at: string | null
}

export interface PrescriptionItem {
  id: string
  medicine: string
  medicine_name: string
  approved_quantity: number
}

export interface PrescriptionDetail {
  id: string
  customer: string
  customer_email: string
  image: string
  status: PrescriptionStatus
  reviewed_by: string | null
  reviewed_by_email: string
  reviewed_at: string | null
  rejection_reason: string
  notes: string
  items: PrescriptionItem[]
  created_at: string
  updated_at: string
}