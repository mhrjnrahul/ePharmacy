import { api } from "./axios"
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const categoriesApi = {
  getAll: (params?: { page?: number }) =>
    api.get<Paginated<Category>>("/api/catalog/categories/", { params }).then(r => r.data),

  // Fetches every page — for populating dropdowns, not the categories list page.
  getAllUnpaginated: () => fetchAllPages(page => categoriesApi.getAll({ page })),

  getById: (id: string) =>
    api.get<Category>(`/api/catalog/categories/${id}/`).then(r => r.data),

  create: (data: CreateCategoryRequest) =>
    api.post<Category>("/api/catalog/categories/", data).then(r => r.data),

  update: (id: string, data: UpdateCategoryRequest) =>
    api.put<Category>(`/api/catalog/categories/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/categories/${id}/`),
}