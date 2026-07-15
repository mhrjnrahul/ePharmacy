import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ordersApi } from "@/api/orders"
import { BATCHES_KEY, MOVEMENTS_KEY } from "./useInventory"
import { PRESCRIPTIONS_KEY } from "./usePrescriptions"

export const ORDERS_KEY = ["orders"] as const
// Kept in sync manually with useShipments.ts's SHIPMENTS_KEY — importing it
// here would create a circular import (useShipments.ts imports ORDERS_KEY).
const SHIPMENTS_KEY = ["shipments"] as const

export const useOrders = (params?: { status?: string; page?: number }) =>
  useQuery({
    queryKey: [...ORDERS_KEY, params],
    queryFn: () => ordersApi.getAll(params),
  })

/** All matching orders, unpaginated — for dropdowns/selects, not the orders list page. */
export const useAllOrders = (params?: { status?: string }) =>
  useQuery({
    queryKey: [...ORDERS_KEY, "all", params],
    queryFn: () => ordersApi.getAllUnpaginated(params),
  })

export const useOrderDetail = (id: string | null) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  })

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      ordersApi.updateStatus(id, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
      qc.invalidateQueries({ queryKey: SHIPMENTS_KEY })
      // Confirming deducts stock (and cancelling-from-any-status restores it),
      // so batches/movements/summary/dashboard all need a refetch too.
      qc.invalidateQueries({ queryKey: BATCHES_KEY })
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY })
      qc.invalidateQueries({ queryKey: ["inventory-summary"] })
      qc.invalidateQueries({ queryKey: ["reports"] })
      qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY })
    },
  })
}

export const useCancelOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ordersApi.cancel(id, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
      // Cancelling restores stock (if it had been deducted) and releases
      // any prescription the order had consumed.
      qc.invalidateQueries({ queryKey: BATCHES_KEY })
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY })
      qc.invalidateQueries({ queryKey: ["inventory-summary"] })
      qc.invalidateQueries({ queryKey: ["reports"] })
      qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY })
    },
  })
}