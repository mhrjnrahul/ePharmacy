import { api } from "./axios"
import type { UserRead, AdminCreateRequest } from "@/types/auth"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const usersApi = {
  getAll: (params?: { page?: number }) =>
    api.get<Paginated<UserRead>>("/api/auth/list/", { params }).then(r => r.data),

  // Fetches every page — User Management and Customers pages do client-side
  // search/role/status filtering and role-count summaries across the whole
  // user base, so they need the full list rather than one page at a time.
  getAllUnpaginated: () => fetchAllPages(page => usersApi.getAll({ page })),

  createStaff: (data: AdminCreateRequest) =>
    api.post<UserRead>("/api/auth/register-staff/", data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/auth/delete/${id}/`),

  restore: (id: string) =>
    api.patch(`/api/auth/restore/${id}/`),
}