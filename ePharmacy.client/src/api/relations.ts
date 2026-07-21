import { api } from "./axios"
import type { MedicineRelation, CreateRelationRequest } from "@/types/relation"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const relationsApi = {
  // Relations where the given medicine is the "from" side. The backend paginates
  // this list endpoint (default PageNumberPagination), but the manage-relations
  // modal shows every relation at once with no pager — so we flatten all pages
  // into a single array. A medicine can easily have >10 relations once the
  // frequently-bought-together weights are generated.
  getForMedicine: (medicineId: string) =>
    fetchAllPages(page =>
      api
        .get<Paginated<MedicineRelation>>(`/api/catalog/medicines/${medicineId}/relations/`, {
          params: { page },
        })
        .then(r => r.data),
    ),

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
