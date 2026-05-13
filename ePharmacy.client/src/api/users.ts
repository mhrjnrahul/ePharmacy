import { api } from "./axios"
import type { UserRead, AdminCreateRequest } from "@/types/auth"

export const usersApi = {
  getAll: () =>
    api.get<UserRead[]>("/api/auth/list/").then(r => r.data),

  createStaff: (data: AdminCreateRequest) =>
    api.post<UserRead>("/api/auth/register-staff/", data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/api/auth/delete/${id}/`),

  restore: (id: string) =>
    api.patch(`/api/auth/restore/${id}/`),
}