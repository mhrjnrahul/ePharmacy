import { api } from "./axios"
import type { Manufacturer, CreateManufacturerRequest, UpdateManufacturerRequest } from "@/types/manufacturer"

export const manufacturersApi = {
  getAll: () =>
    api.get<Manufacturer[]>("/api/catalog/manufacturers/").then(r => r.data),

  getById: (id: string) =>
    api.get<Manufacturer>(`/api/catalog/manufacturers/${id}/`).then(r => r.data),

  create: (data: CreateManufacturerRequest) =>
    api.post<Manufacturer>("/api/catalog/manufacturers/", data).then(r => r.data),

  update: (id: string, data: UpdateManufacturerRequest) =>
    api.put<Manufacturer>(`/api/catalog/manufacturers/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/manufacturers/${id}/`),
}