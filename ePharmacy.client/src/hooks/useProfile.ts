import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { profileApi } from "@/api/profile"
import { useAuthStore } from "@/store/authStore"

export const PROFILE_KEY = ["profile", "me"] as const

export const useMe = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: profileApi.me,
    enabled: isAuthenticated,
  })
}

export const useUpdateProfile = () => {
  const qc = useQueryClient()
  const setUser = useAuthStore(s => s.setUser)
  return useMutation({
    mutationFn: (data: { first_name?: string; last_name?: string }) => profileApi.update(data),
    onSuccess: (user) => {
      // keep the persisted auth store in sync so the navbar name updates
      setUser(user)
      qc.invalidateQueries({ queryKey: PROFILE_KEY })
    },
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) =>
      profileApi.changePassword(data),
  })
