import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { medicinesApi } from "@/api/medicines"
import type { CreateMedicineRequest, MedicineListParams, UpdateMedicineRequest } from "@/types/medicine"

export const MEDICINES_KEY = ["medicines"] as const

export const useMedicines = (params?: MedicineListParams) =>
  useQuery({
    queryKey: params ? [...MEDICINES_KEY, params] : MEDICINES_KEY,
    queryFn: () => medicinesApi.getAll(params),
  })

/** All medicines, unpaginated — for dropdowns/selects, not the medicines list page. */
export const useAllMedicines = (params?: Omit<MedicineListParams, "page">) =>
  useQuery({
    queryKey: [...MEDICINES_KEY, "all", params],
    queryFn: () => medicinesApi.getAllUnpaginated(params),
  })

export const usePopularMedicines = (limit = 8) =>
  useQuery({
    queryKey: [...MEDICINES_KEY, "popular", limit],
    queryFn: () => medicinesApi.getPopular(limit),
  })

export const useMedicineRecommendations = (id: string | null) =>
  useQuery({
    queryKey: [...MEDICINES_KEY, id, "recommendations"],
    queryFn: () => medicinesApi.getRecommendations(id!),
    enabled: !!id,
  })

export const useRebuildRecommendations = () =>
  useMutation({
    mutationFn: medicinesApi.rebuildRecommendations,
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