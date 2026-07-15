export type DosageForm =
  | "tablet" | "capsule" | "syrup"
  | "injection" | "cream" | "drops" | "inhaler"

export interface Medicine {
  id: string
  name: string
  description: string
  category: string        // UUID
  category_name: string
  manufacturer: string    // UUID
  manufacturer_name: string
  customer_price: string | null   // FIFO batch price; null = out of stock
  available_stock: number
  in_stock: boolean
  requires_prescription: boolean
  dosage_form: DosageForm
  dosage_form_display: string
  strength: string        // e.g. "500mg"
  composition: string     // comma-separated active ingredients, e.g. "Paracetamol"
  image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicineListItem {
  id: string
  name: string
  strength: string
  dosage_form: DosageForm
  dosage_form_display: string
  category_name: string
  manufacturer_name: string
  customer_price: string | null
  available_stock: number
  in_stock: boolean
  requires_prescription: boolean
  composition: string
  image: string | null
  is_active: boolean
}

export interface MedicineListParams {
  category?: string
  manufacturer?: string
  requires_prescription?: boolean
  dosage_form?: DosageForm
  search?: string
  ordering?: string
  page?: number
}

export interface RecommendationResponse {
  medicine?: string
  based_on_cart_items?: number
  results: MedicineListItem[]
}

export interface CreateMedicineRequest {
  name: string
  description: string
  category: string        // UUID
  manufacturer: string    // UUID
  requires_prescription: boolean
  dosage_form: DosageForm
  strength: string
  composition: string
  is_active: boolean
}

export interface UpdateMedicineRequest extends CreateMedicineRequest {}