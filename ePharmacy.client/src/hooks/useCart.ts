import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cartApi } from "@/api/cart"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"

export const CART_KEY = ["cart"] as const

export const useCart = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.get,
    enabled: isAuthenticated,
  })
}

export const useAddToCart = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { medicine: string; quantity: number }) => cartApi.add(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  })
}

export const useRemoveFromCart = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (medicineId: string) => cartApi.remove(medicineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY })
      toast.success("Item removed from cart.")
    },
    onError: () => toast.error("Failed to remove item. Please try again."),
  })
}

export const useUpdateCartQuantity = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ medicineId, quantity }: { medicineId: string; quantity: number }) => {
      if (quantity <= 0) return cartApi.remove(medicineId)
      return cartApi.add({ medicine: medicineId, quantity })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
    onError: () => toast.error("Failed to update quantity."),
  })
}
