import { Link } from "react-router-dom"
import { Pill, ShoppingCart, Check, Loader2 } from "lucide-react"
import type { MedicineListItem } from "@/types/medicine"
import { useAuthStore } from "@/store/authStore"
import { useAddToCart, useCart } from "@/hooks/useCart"
import { openCart } from "@/components/landing/CartDrawer"
import { toast } from "@/store/toastStore"
import { RxTag, StockTag } from "@/components/ui/tag"
import { mediaUrl } from "@/lib/apiUrl"

export const formatPrice = (price: string | null) =>
  price === null ? null : `Rs. ${Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

export const ShopCard = ({ medicine }: { medicine: MedicineListItem }) => {
  const { user, isAuthenticated } = useAuthStore()
  const isCustomer = isAuthenticated && user?.role === "CUSTOMER"

  const { data: cart } = useCart()
  const cartItem = cart?.items.find(i => i.medicine === medicine.id)
  const { mutate: addToCart, isPending: adding } = useAddToCart()

  const image = mediaUrl(medicine.image)
  const price = formatPrice(medicine.customer_price)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (cartItem) {
      openCart()
      return
    }
    addToCart(
      { medicine: medicine.id, quantity: 1 },
      {
        onSuccess: () => toast.success(`${medicine.name} added to cart.`),
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail ?? "Could not add to cart."),
      },
    )
  }

  return (
    <Link
      to={`/shop/${medicine.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-primary-soft">
        {image ? (
          <img src={image} alt={medicine.name} className="size-full object-cover" />
        ) : (
          <Pill size={28} className="text-primary" />
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {medicine.requires_prescription && <RxTag />}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-semibold text-foreground">{medicine.name}</p>
        <p className="text-xs text-muted-foreground">
          {medicine.strength} · {medicine.dosage_form_display}
        </p>
        <StockTag available={medicine.available_stock} />

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="tnum text-sm font-bold text-foreground">
            {price ?? <span className="text-muted-foreground">—</span>}
          </span>
          {isCustomer && medicine.in_stock && (
            <button
              onClick={handleAdd}
              disabled={adding}
              title={cartItem ? `${cartItem.quantity} in cart — open cart` : "Add to cart"}
              className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {adding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : cartItem ? (
                <Check size={14} />
              ) : (
                <ShoppingCart size={14} />
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

export const ShopCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border bg-card">
    <div className="h-36 animate-pulse bg-muted" />
    <div className="space-y-2 p-3">
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-6 w-full animate-pulse rounded bg-muted" />
    </div>
  </div>
)
