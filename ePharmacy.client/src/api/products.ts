// import { api } from "./axios"
import type {
  Product,
  ProductVariant,
  Category,
  CreateProductRequest,
  CreateVariantRequest,
} from "@/types"

// ── Categories ────────────────────────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    { id: 1, name: "Antibiotics",    slug: "antibiotics",    description: "Bacterial infection treatments", parent: null },
    { id: 2, name: "Analgesics",     slug: "analgesics",     description: "Pain relief medicines",          parent: null },
    { id: 3, name: "Antacids",       slug: "antacids",       description: "Acid reflux and ulcer relief",   parent: null },
    { id: 4, name: "Antihistamines", slug: "antihistamines", description: "Allergy relief medicines",       parent: null },
    { id: 5, name: "Antidiabetics",  slug: "antidiabetics",  description: "Diabetes management medicines",  parent: null },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<Category[]>("/api/v1/products/categories/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

// ── Products ──────────────────────────────────────────────────────────────────

export const fetchProducts = async (): Promise<Product[]> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  return [
    {
      id: 1,
      name: "Paracetamol",
      description: "Common pain reliever and fever reducer",
      is_active: true,
      image: null,
      categories: [{ id: 2, name: "Analgesics", slug: "analgesics", description: "", parent: null }],
      variants: [
        { id: 1, product: 1, sku: "PAR-500-TAB", name: "500mg Tablet", dosage_form: "TABLET",  cost_price: 25,  selling_price: 45,  stock_level: 12,  reorder_point: 50,  expiry_date: "2026-06-01", is_default: true,  is_active: true, image: null },
        { id: 2, product: 1, sku: "PAR-250-SYR", name: "250mg Syrup",  dosage_form: "SYRUP",   cost_price: 60,  selling_price: 95,  stock_level: 85,  reorder_point: 30,  expiry_date: "2026-03-15", is_default: false, is_active: true, image: null },
      ],
      created_at: "2025-01-10T08:00:00Z",
      updated_at: "2025-04-01T10:00:00Z",
    },
    {
      id: 2,
      name: "Amoxicillin",
      description: "Broad-spectrum antibiotic",
      is_active: true,
      image: null,
      categories: [{ id: 1, name: "Antibiotics", slug: "antibiotics", description: "", parent: null }],
      variants: [
        { id: 3, product: 2, sku: "AMX-250-CAP", name: "250mg Capsule", dosage_form: "CAPSULE", cost_price: 80,  selling_price: 140, stock_level: 240, reorder_point: 60,  expiry_date: "2025-04-25", is_default: true,  is_active: true, image: null },
        { id: 4, product: 2, sku: "AMX-500-CAP", name: "500mg Capsule", dosage_form: "CAPSULE", cost_price: 140, selling_price: 240, stock_level: 5,   reorder_point: 40,  expiry_date: "2026-01-10", is_default: false, is_active: true, image: null },
      ],
      created_at: "2025-01-12T08:00:00Z",
      updated_at: "2025-04-01T10:00:00Z",
    },
    {
      id: 3,
      name: "Omeprazole",
      description: "Proton pump inhibitor for acid reflux",
      is_active: true,
      image: null,
      categories: [{ id: 3, name: "Antacids", slug: "antacids", description: "", parent: null }],
      variants: [
        { id: 5, product: 3, sku: "OME-020-CAP", name: "20mg Capsule", dosage_form: "CAPSULE", cost_price: 55, selling_price: 95, stock_level: 8, reorder_point: 40, expiry_date: "2026-02-20", is_default: true, is_active: true, image: null },
      ],
      created_at: "2025-01-15T08:00:00Z",
      updated_at: "2025-04-01T10:00:00Z",
    },
    {
      id: 4,
      name: "Cetirizine",
      description: "Second-generation antihistamine",
      is_active: true,
      image: null,
      categories: [{ id: 4, name: "Antihistamines", slug: "antihistamines", description: "", parent: null }],
      variants: [
        { id: 6, product: 4, sku: "CET-010-TAB", name: "10mg Tablet", dosage_form: "TABLET", cost_price: 20, selling_price: 35, stock_level: 96, reorder_point: 50, expiry_date: "2025-05-10", is_default: true, is_active: true, image: null },
      ],
      created_at: "2025-01-18T08:00:00Z",
      updated_at: "2025-04-01T10:00:00Z",
    },
    {
      id: 5,
      name: "Metformin",
      description: "First-line medication for type 2 diabetes",
      is_active: false,
      image: null,
      categories: [{ id: 5, name: "Antidiabetics", slug: "antidiabetics", description: "", parent: null }],
      variants: [
        { id: 7, product: 5, sku: "MET-500-TAB", name: "500mg Tablet", dosage_form: "TABLET", cost_price: 45, selling_price: 75, stock_level: 420, reorder_point: 80, expiry_date: "2025-05-18", is_default: true, is_active: true, image: null },
      ],
      created_at: "2025-01-20T08:00:00Z",
      updated_at: "2025-04-01T10:00:00Z",
    },
  ]
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<Product[]>("/api/v1/products/")
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const fetchProduct = async (id: number): Promise<Product> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  const all = await fetchProducts()
  const found = all.find((p) => p.id === id)
  if (!found) throw new Error("Product not found")
  return found
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.get<Product>(`/api/v1/products/${id}/`)
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  console.log("createProduct mock:", data)
  throw new Error("Not implemented in mock")
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.post<Product>("/api/v1/products/", data)
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const updateProduct = async (id: number, data: Partial<CreateProductRequest>): Promise<Product> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  console.log("updateProduct mock:", id, data)
  throw new Error("Not implemented in mock")
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.put<Product>(`/api/v1/products/${id}/`, data)
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const deleteProduct = async (id: number): Promise<void> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  console.log("deleteProduct mock:", id)
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // await api.delete(`/api/v1/products/${id}/`)
  // ── END REAL ─────────────────────────────────────────────────────────
}

// ── Variants ──────────────────────────────────────────────────────────────────

export const createVariant = async (productId: number, data: CreateVariantRequest): Promise<ProductVariant> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  console.log("createVariant mock:", productId, data)
  throw new Error("Not implemented in mock")
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.post<ProductVariant>(`/api/v1/products/${productId}/variations/`, data)
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const updateVariant = async (productId: number, variantId: number, data: Partial<CreateVariantRequest>): Promise<ProductVariant> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  console.log("updateVariant mock:", productId, variantId, data)
  throw new Error("Not implemented in mock")
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // const response = await api.put<ProductVariant>(`/api/v1/products/${productId}/variations/${variantId}/`, data)
  // return response.data
  // ── END REAL ─────────────────────────────────────────────────────────
}

export const deleteVariant = async (productId: number, variantId: number): Promise<void> => {
  // ── MOCK (remove this block when backend is ready) ──────────────────
  console.log("deleteVariant mock:", productId, variantId)
  // ── END MOCK ─────────────────────────────────────────────────────────

  // ── REAL (uncomment when backend is ready) ───────────────────────────
  // await api.delete(`/api/v1/products/${productId}/variations/${variantId}/`)
  // ── END REAL ─────────────────────────────────────────────────────────
}