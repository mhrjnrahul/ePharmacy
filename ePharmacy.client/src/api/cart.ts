import { api } from "./axios"
import type { CartResponse } from "@/types/order"

export const cartApi = {
  get: () =>
    api.get<CartResponse>("/api/orders/cart/").then(r => r.data),

  add: (data: { medicine: string; quantity: number }) =>
    api.post<CartResponse>("/api/orders/cart/", data).then(r => r.data),

  remove: (medicineId: string) =>
    api.delete(`/api/orders/cart/${medicineId}/`),
}
