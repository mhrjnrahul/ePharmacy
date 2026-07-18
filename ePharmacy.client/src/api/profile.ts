import { api } from "./axios"
import type { User } from "@/types/auth"

export const profileApi = {
  me: () =>
    api.get<User>("/api/auth/me/").then(r => r.data),

  update: (data: { first_name?: string; last_name?: string }) =>
    api.patch<User>("/api/auth/me/", data).then(r => r.data),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post<{ detail: string }>("/api/auth/change-password/", data).then(r => r.data),
}
