import { api } from "./axios"
import type { OrderList, OrderDetail, CheckoutResponse } from "@/types/order"

export const ordersApi = {
  checkout: (data: { delivery_address: string }) =>
    api.post<CheckoutResponse>("/api/orders/checkout/", data).then(r => r.data),


  getAll: (params?: { status?: string }) =>
    api.get<OrderList[]>("/api/orders/", { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<OrderDetail>(`/api/orders/${id}/`).then(r => r.data),

  updateStatus: (id: string, data: { status: string; reason?: string }) =>
    api.post(`/api/orders/${id}/status/`, data).then(r => r.data),

  cancel: (id: string, data?: { reason?: string }) =>
    api.post(`/api/orders/${id}/cancel/`, data ?? {}).then(r => r.data),
}