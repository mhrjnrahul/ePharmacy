import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { manufacturersApi } from "@/api/manufacturers"
import type { CreateManufacturerRequest, UpdateManufacturerRequest } from "@/types/manufacturer"

export const MANUFACTURERS_KEY = ["manufacturers"] as const

export const useManufacturers = (params?: { page?: number }) =>
  useQuery({
    queryKey: [...MANUFACTURERS_KEY, params],
    queryFn: () => manufacturersApi.getAll(params),
  })

/** All manufacturers, unpaginated — for dropdowns/selects, not the manufacturers list page. */
export const useAllManufacturers = () =>
  useQuery({
    queryKey: [...MANUFACTURERS_KEY, "all"],
    queryFn: manufacturersApi.getAllUnpaginated,
  })

export const useCreateManufacturer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateManufacturerRequest) => manufacturersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MANUFACTURERS_KEY }),
  })
}

export const useUpdateManufacturer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateManufacturerRequest }) =>
      manufacturersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: MANUFACTURERS_KEY }),
  })
}

export const useDeleteManufacturer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => manufacturersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MANUFACTURERS_KEY }),
  })
}