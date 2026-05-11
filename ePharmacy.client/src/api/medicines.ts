import { api } from "./axios"
import type { Medicine, MedicineListItem, CreateMedicineRequest, UpdateMedicineRequest } from "@/types/medicine"

export const medicinesApi = {
  getAll: () =>
    api.get<MedicineListItem[]>("/api/catalog/medicines/").then(r => r.data),

  getById: (id: string) =>
    api.get<Medicine>(`/api/catalog/medicines/${id}/`).then(r => r.data),

  create: (data: CreateMedicineRequest) =>
    api.post<Medicine>("/api/catalog/medicines/", data).then(r => r.data),

  update: (id: string, data: UpdateMedicineRequest) =>
    api.put<Medicine>(`/api/catalog/medicines/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/medicines/${id}/`),
}