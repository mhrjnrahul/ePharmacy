import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ordersApi } from "@/api/orders"

export const ORDERS_KEY = ["orders"] as const

export const useOrders = (params?: { status?: string }) =>
  useQuery({
    queryKey: [...ORDERS_KEY, params],
    queryFn: () => ordersApi.getAll(params),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  })
}

export const useCancelOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ordersApi.cancel(id, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  })
}