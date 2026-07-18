import { useAuthStore } from "@/store/authStore"
import { logoutUser } from "@/api/auth"

/**
 * The backend blacklists the refresh token on logout (POST /api/auth/logout/),
 * but the store's logout() only ever cleared local state — the refresh token
 * stayed valid server-side for its full lifetime. Call the backend best-effort
 * (it's just cleanup; local logout must succeed even if this fails/is offline)
 * before clearing local state.
 */
export const useLogout = () => {
  const storeLogout = useAuthStore(s => s.logout)

  return () => {
    const refresh = useAuthStore.getState().refreshToken
    if (refresh) {
      logoutUser(refresh).catch(() => {})
    }
    storeLogout()
  }
}
