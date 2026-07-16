import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { relationsApi } from "@/api/relations"
import type { CreateRelationRequest } from "@/types/relation"

const relationsKey = (medicineId: string) => ["relations", medicineId] as const

export const useMedicineRelations = (medicineId: string | null) =>
  useQuery({
    queryKey: relationsKey(medicineId ?? ""),
    queryFn: () => relationsApi.getForMedicine(medicineId!),
    enabled: !!medicineId,
  })

export const useCreateRelation = (medicineId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRelationRequest) => relationsApi.create(medicineId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: relationsKey(medicineId) }),
  })
}

export const useUpdateRelation = (medicineId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRelationRequest }) =>
      relationsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: relationsKey(medicineId) }),
  })
}

export const useDeleteRelation = (medicineId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => relationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: relationsKey(medicineId) }),
  })
}
