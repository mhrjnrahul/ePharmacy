import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { categoriesApi } from "@/api/categories"
import type { CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category"

export const CATEGORIES_KEY = ["categories"] as const

export const useCategories = (params?: { page?: number }) =>
  useQuery({
    queryKey: [...CATEGORIES_KEY, params],
    queryFn: () => categoriesApi.getAll(params),
  })

/** All categories, unpaginated — for dropdowns/selects, not the categories list page. */
export const useAllCategories = () =>
  useQuery({
    queryKey: [...CATEGORIES_KEY, "all"],
    queryFn: categoriesApi.getAllUnpaginated,
  })

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export const useUpdateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoriesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export const useDeleteCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}