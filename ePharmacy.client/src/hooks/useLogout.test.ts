import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAuthStore } from "@/store/authStore"
import * as authApi from "@/api/auth"
import { useLogout } from "./useLogout"

// Regression coverage for the bug fixed this session: the backend blacklists
// the refresh token on logout, but the store's logout() only ever cleared
// local state — the refresh token stayed valid server-side indefinitely.
describe("useLogout", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
    vi.restoreAllMocks()
  })

  it("calls the backend logout endpoint with the current refresh token", async () => {
    const logoutSpy = vi.spyOn(authApi, "logoutUser").mockResolvedValue(undefined)
    useAuthStore.getState().setTokens("access-1", "refresh-1")

    const { result } = renderHook(() => useLogout())
    await act(async () => result.current())

    expect(logoutSpy).toHaveBeenCalledWith("refresh-1")
  })

  it("still clears local auth state even if the backend call fails", async () => {
    vi.spyOn(authApi, "logoutUser").mockRejectedValue(new Error("network down"))
    useAuthStore.getState().setTokens("access-1", "refresh-1")

    const { result } = renderHook(() => useLogout())
    await act(async () => result.current())

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(localStorage.getItem("access_token")).toBeNull()
  })

  it("does not call the backend if there was no refresh token to begin with", async () => {
    const logoutSpy = vi.spyOn(authApi, "logoutUser").mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogout())
    await act(async () => result.current())

    expect(logoutSpy).not.toHaveBeenCalled()
  })
})
