import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi } from "@/api/users"
import type { AdminCreateRequest } from "@/types/auth"

export const USERS_KEY = ["users"] as const

export const useUsers = () =>
  useQuery({
    queryKey: USERS_KEY,
    queryFn: usersApi.getAll,
  })

export const useCreateStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminCreateRequest) => usersApi.createStaff(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export const useRestoreUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  })
}