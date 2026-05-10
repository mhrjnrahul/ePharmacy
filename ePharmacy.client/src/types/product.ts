export type DosageForm =
  | "TABLET"
  | "CAPSULE"
  | "SYRUP"
  | "INJECTION"
  | "CREAM"
  | "DROPS"
  | "INHALER"
  | "PATCH"
  | "SUPPOSITORY"
  | "OTHER"

export type ProductStatus = "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED"

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  parent: number | null
}

export interface ProductVariant {
  id: number
  product: number
  sku: string
  name: string
  dosage_form: DosageForm
  cost_price: number
  selling_price: number
  stock_level: number
  reorder_point: number
  expiry_date: string | null
  is_default: boolean
  is_active: boolean
  image: string | null
}

export interface Product {
  id: number
  name: string
  description: string
  is_active: boolean
  image: string | null
  categories: Category[]
  variants: ProductVariant[]
  created_at: string
  updated_at: string
}

export interface CreateProductRequest {
  name: string
  description: string
  is_active: boolean
  category_ids: number[]
}

export interface CreateVariantRequest {
  product: number
  sku: string
  name: string
  dosage_form: DosageForm
  cost_price: number
  selling_price: number
  stock_level: number
  reorder_point: number
  expiry_date: string | null
  is_default: boolean
  is_active: boolean
}