import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { shipmentsApi } from "@/api/shipments"
import type { CreateShipmentRequest, ShipmentStatus, ShipmentStatusUpdateRequest } from "@/types/shipment"
import { ORDERS_KEY } from "./useOrders"

export const SHIPMENTS_KEY = ["shipments"] as const

export const useShipments = (params?: { status?: ShipmentStatus; page?: number }) =>
  useQuery({
    queryKey: [...SHIPMENTS_KEY, params],
    queryFn: () => shipmentsApi.getAll(params),
  })

export const useShipmentDetail = (id: string | null) =>
  useQuery({
    queryKey: [...SHIPMENTS_KEY, id],
    queryFn: () => shipmentsApi.getById(id!),
    enabled: !!id,
  })

/** Track a shipment by order ID. 404 (no shipment yet) is not an error state worth retrying. */
export const useOrderShipment = (orderId: string | null) =>
  useQuery({
    queryKey: [...SHIPMENTS_KEY, "order", orderId],
    queryFn: () => shipmentsApi.getByOrder(orderId!),
    enabled: !!orderId,
    retry: false,
  })

export const useCreateShipment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateShipmentRequest) => shipmentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENTS_KEY })
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}

export const useUpdateShipmentStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ShipmentStatusUpdateRequest) =>
      shipmentsApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPMENTS_KEY })
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}
