import { api } from "./axios"
import type { Manufacturer, CreateManufacturerRequest, UpdateManufacturerRequest } from "@/types/manufacturer"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const manufacturersApi = {
  getAll: (params?: { page?: number }) =>
    api.get<Paginated<Manufacturer>>("/api/catalog/manufacturers/", { params }).then(r => r.data),

  // Fetches every page — for populating dropdowns, not the manufacturers list page.
  getAllUnpaginated: () => fetchAllPages(page => manufacturersApi.getAll({ page })),

  getById: (id: string) =>
    api.get<Manufacturer>(`/api/catalog/manufacturers/${id}/`).then(r => r.data),

  create: (data: CreateManufacturerRequest) =>
    api.post<Manufacturer>("/api/catalog/manufacturers/", data).then(r => r.data),

  update: (id: string, data: UpdateManufacturerRequest) =>
    api.put<Manufacturer>(`/api/catalog/manufacturers/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/manufacturers/${id}/`),
}