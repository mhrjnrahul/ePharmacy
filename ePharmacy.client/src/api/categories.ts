import { api } from "./axios"
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category"

export const categoriesApi = {
  getAll: () =>
    api.get<Category[]>("/api/catalog/categories/").then(r => r.data),

  getById: (id: string) =>
    api.get<Category>(`/api/catalog/categories/${id}/`).then(r => r.data),

  create: (data: CreateCategoryRequest) =>
    api.post<Category>("/api/catalog/categories/", data).then(r => r.data),

  update: (id: string, data: UpdateCategoryRequest) =>
    api.put<Category>(`/api/catalog/categories/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/catalog/categories/${id}/`),
}