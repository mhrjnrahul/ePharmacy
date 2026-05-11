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
  requires_prescription: boolean
  dosage_form: DosageForm
  dosage_form_display: string
  strength: string        // e.g. "500mg"
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
  requires_prescription: boolean
  image: string | null
  is_active: boolean
}

export interface CreateMedicineRequest {
  name: string
  description: string
  category: string        // UUID
  manufacturer: string    // UUID
  requires_prescription: boolean
  dosage_form: DosageForm
  strength: string
  is_active: boolean
}

export interface UpdateMedicineRequest extends CreateMedicineRequest {}