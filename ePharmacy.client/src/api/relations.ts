import { api } from "./axios"
import type { MedicineRelation, CreateRelationRequest } from "@/types/relation"

export const relationsApi = {
  // Relations where the given medicine is the "from" side.
  getForMedicine: (medicineId: string) =>
    api.get<MedicineRelation[]>(`/api/catalog/medicines/${medicineId}/relations/`).then(r => r.data),

  create: (medicineId: string, data: CreateRelationRequest) =>
    api.post<MedicineRelation>(`/api/catalog/medicines/${medicineId}/relations/`, data).then(r => r.data),

  // A PATCH with only {weight} would leave from_medicine/to_medicine out of
  // attrs, and the serializer's validate() unconditionally compares those
  // two — so this always sends the full record instead of a partial one.
  update: (id: string, data: CreateRelationRequest) =>
    api.put<MedicineRelation>(`/api/catalog/relations/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/relations/${id}/`),
}
