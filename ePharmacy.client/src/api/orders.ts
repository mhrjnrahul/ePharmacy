import { api } from "./axios"
import type { OrderList, OrderDetail, CheckoutResponse } from "@/types/order"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const ordersApi = {
  checkout: (data: { delivery_address: string }) =>
    api.post<CheckoutResponse>("/api/orders/checkout/", data).then(r => r.data),


  getAll: (params?: { status?: string; page?: number }) =>
    api.get<Paginated<OrderList>>("/api/orders/", { params }).then(r => r.data),

  // Fetches every page — for populating dropdowns (e.g. "processing" orders in Create shipment).
  getAllUnpaginated: (params?: { status?: string }) =>
    fetchAllPages(page => ordersApi.getAll({ ...params, page })),

  getById: (id: string) =>
    api.get<OrderDetail>(`/api/orders/${id}/`).then(r => r.data),

  updateStatus: (id: string, data: { status: string; reason?: string }) =>
    api.post(`/api/orders/${id}/status/`, data).then(r => r.data),

  cancel: (id: string, data?: { reason?: string }) =>
    api.post(`/api/orders/${id}/cancel/`, data ?? {}).then(r => r.data),
}