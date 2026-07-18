import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { paymentsApi } from "@/api/payments"
import { ORDERS_KEY } from "./useOrders"

export const usePaymentByOrder = (orderId: string | null) =>
  useQuery({
    queryKey: ["payment", orderId],
    queryFn: async () => {
      try {
        return await paymentsApi.getByOrder(orderId!)
      } catch (err: any) {
        // No payment has been initiated for this order yet — not an error state.
        if (err?.response?.status === 404) return null
        throw err
      }
    },
    enabled: !!orderId,
  })

export const useRefundPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      paymentsApi.refund(orderId, reason),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ["payment", orderId] })
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}
