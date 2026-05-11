import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { medicinesApi } from "@/api/medicines"
import type { CreateMedicineRequest, UpdateMedicineRequest } from "@/types/medicine"

export const MEDICINES_KEY = ["medicines"] as const

export const useMedicines = () =>
  useQuery({
    queryKey: MEDICINES_KEY,
    queryFn: medicinesApi.getAll,
  })

export const useCreateMedicine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMedicineRequest) => medicinesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  })
}

export const useUpdateMedicine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicineRequest }) =>
      medicinesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  })
}

export const useDeleteMedicine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => medicinesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  })
}

export const useMedicineDetail = (id: string | null) =>
  useQuery({
    queryKey: ["medicines", id],
    queryFn: () => medicinesApi.getById(id!),
    enabled: !!id,
  })