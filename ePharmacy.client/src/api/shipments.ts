import { api } from "./axios"
import type {
  Shipment,
  CreateShipmentRequest,
  ShipmentStatusUpdateRequest,
  ShipmentStatus,
} from "@/types/shipment"

// NOTE: the backend mounts this app at /api/shipping/
export const shipmentsApi = {
  // Staff: all shipments. Customer: own only.
  getAll: (params?: { status?: ShipmentStatus }) =>
    api.get<Shipment[]>("/api/shipping/", { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<Shipment>(`/api/shipping/${id}/`).then(r => r.data),

  // Staff creates a shipment for a PROCESSING order
  create: (data: CreateShipmentRequest) =>
    api.post<Shipment>("/api/shipping/", data).then(r => r.data),

  updateStatus: (id: string, data: ShipmentStatusUpdateRequest) =>
    api.post<Shipment>(`/api/shipping/${id}/status/`, data).then(r => r.data),

  // Track by order ID — 404 when no shipment exists yet
  getByOrder: (orderId: string) =>
    api.get<Shipment>(`/api/shipping/order/${orderId}/`).then(r => r.data),
}
