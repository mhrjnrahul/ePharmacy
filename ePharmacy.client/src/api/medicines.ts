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

  create: (data: CreateMedicineRequest) =>
    api.post<Medicine>("/api/catalog/medicines/", data).then(r => r.data),

  update: (id: string, data: UpdateMedicineRequest) =>
    api.put<Medicine>(`/api/catalog/medicines/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/medicines/${id}/`),

  // Staff — recompute frequently-bought-together weights from order history
  rebuildRecommendations: () =>
    api.post<{ detail: string; created: number; updated: number }>(
      "/api/catalog/recommendations/rebuild/"
    ).then(r => r.data),
}
