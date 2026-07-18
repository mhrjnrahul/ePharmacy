import { api } from "./axios"
import type { CartResponse } from "@/types/order"
import type { RecommendationResponse } from "@/types/medicine"

export const cartApi = {
  get: () =>
    api.get<CartResponse>("/api/orders/cart/").then(r => r.data),

  add: (data: { medicine: string; quantity: number }) =>
    api.post<CartResponse>("/api/orders/cart/", data).then(r => r.data),

  remove: (medicineId: string) =>
    api.delete(`/api/orders/cart/${medicineId}/`),

  // "You might also need…" based on current cart contents
  getRecommendations: () =>
    api.get<RecommendationResponse>("/api/catalog/recommendations/cart/").then(r => r.data),
}
