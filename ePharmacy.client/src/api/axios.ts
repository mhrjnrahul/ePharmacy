import axios from "axios"
import { useAuthStore } from "@/store/authStore"

const BASE_URL = "http://127.0.0.1:8000"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  )
  failedQueue = []
}

// Auth endpoints return 401 for wrong credentials, not for an expired session —
// letting the refresh/redirect logic below run for these would hide the real
// error behind a hard redirect to /login (looks like the page just reloaded).
const AUTH_ENDPOINTS = ["/api/auth/login/", "/api/auth/register/", "/api/auth/refresh/"]

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = AUTH_ENDPOINTS.some((url) => originalRequest?.url?.includes(url))

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refresh = localStorage.getItem("refresh_token")

    if (!refresh) {
      useAuthStore.getState().logout()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh })
      localStorage.setItem("access_token", data.access)
      useAuthStore.getState().setTokens(data.access, refresh)
      originalRequest.headers.Authorization = `Bearer ${data.access}`
      processQueue(null, data.access)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      window.location.href = "/login"
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)