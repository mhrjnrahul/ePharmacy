import { api } from "./axios"
import type {
  Medicine,
  MedicineListItem,
  MedicineListParams,
  CreateMedicineRequest,
  UpdateMedicineRequest,
  RecommendationResponse,
} from "@/types/medicine"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

// Medicine writes go multipart only when a new image file is attached — plain
// JSON otherwise, since re-sending a File object through JSON isn't possible
// and the backend doesn't require multipart when the image isn't changing.
const toFormData = (data: CreateMedicineRequest) => {
  const form = new FormData()
  form.append("name", data.name)
  form.append("description", data.description)
  form.append("category", data.category)
  form.append("manufacturer", data.manufacturer)
  form.append("requires_prescription", String(data.requires_prescription))
  form.append("dosage_form", data.dosage_form)
  form.append("strength", data.strength)
  form.append("composition", data.composition)
  form.append("is_active", String(data.is_active))
  if (data.image) form.append("image", data.image)
  return form
}

export const medicinesApi = {
  getAll: (params?: MedicineListParams) =>
    api.get<Paginated<MedicineListItem>>("/api/catalog/medicines/", { params }).then(r => r.data),

  // Fetches every page — for populating dropdowns, not the medicines list page.
  getAllUnpaginated: (params?: Omit<MedicineListParams, "page">) =>
    fetchAllPages(page => medicinesApi.getAll({ ...params, page })),

  getById: (id: string) =>
    api.get<Medicine>(`/api/catalog/medicines/${id}/`).then(r => r.data),

  // Public — best-sellers for the landing/shop pages
  getPopular: (limit = 8) =>
    api.get<RecommendationResponse>("/api/catalog/medicines/popular/", { params: { limit } }).then(r => r.data),

  // Public — "frequently bought together" for a medicine detail page
  getRecommendations: (id: string) =>
    api.get<RecommendationResponse>(`/api/catalog/medicines/${id}/recommendations/`).then(r => r.data),

  // Public — in-stock substitutes, ranked by composition similarity (for out-of-stock medicines)
  getSubstitutes: (id: string) =>
    api.get<RecommendationResponse>(`/api/catalog/medicines/${id}/substitutes/`).then(r => r.data),

  create: (data: CreateMedicineRequest) => {
    if (!data.image) {
      const { image: _image, ...rest } = data
      return api.post<Medicine>("/api/catalog/medicines/", rest).then(r => r.data)
    }
    // Content-Type must stay unset (not "multipart/form-data") so the browser
    // appends its own boundary parameter when it serializes the FormData —
    // an explicit value here overrides that and Django can't parse the body.
    return api
      .post<Medicine>("/api/catalog/medicines/", toFormData(data), { headers: { "Content-Type": undefined } })
      .then(r => r.data)
  },

  update: (id: string, data: UpdateMedicineRequest) => {
    if (!data.image) {
      const { image: _image, ...rest } = data
      return api.put<Medicine>(`/api/catalog/medicines/${id}/`, rest).then(r => r.data)
    }
    return api
      .put<Medicine>(`/api/catalog/medicines/${id}/`, toFormData(data), { headers: { "Content-Type": undefined } })
      .then(r => r.data)
  },

  delete: (id: string) =>
    api.delete(`/api/catalog/medicines/${id}/`),

  // Staff — recompute frequently-bought-together weights from order history
  rebuildRecommendations: () =>
    api.post<{ detail: string; created: number; updated: number }>(
      "/api/catalog/recommendations/rebuild/"
    ).then(r => r.data),
}
