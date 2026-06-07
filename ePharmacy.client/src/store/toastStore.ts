import { create } from "zustand"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, "id">) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), toast.duration)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  success: (message: string, duration = 4000) => useToastStore.getState().add({ message, type: "success", duration }),
  error:   (message: string, duration = 5000) => useToastStore.getState().add({ message, type: "error",   duration }),
  warning: (message: string, duration = 5000) => useToastStore.getState().add({ message, type: "warning", duration }),
  info:    (message: string, duration = 4000) => useToastStore.getState().add({ message, type: "info",    duration }),
}
