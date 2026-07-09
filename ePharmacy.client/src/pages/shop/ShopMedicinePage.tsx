import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Minus, Pill, Plus, ShoppingCart } from "lucide-react"
import { useMedicineDetail, useMedicineRecommendations } from "@/hooks/useMedicines"
import { useAddToCart, useCart } from "@/hooks/useCart"
import { useAuthStore } from "@/store/authStore"
import { openCart } from "@/components/landing/CartDrawer"
import { ShopCard, ShopCardSkeleton, mediaUrl, formatPrice } from "@/components/shop/ShopCard"
import { RxTag, StockTag, Tag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "@/store/toastStore"

const ShopMedicinePage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: medicine, isLoading, isError } = useMedicineDetail(id ?? null)
  const { data: recommendations } = useMedicineRecommendations(id ?? null)

  const { user, isAuthenticated } = useAuthStore()
  const isCustomer = isAuthenticated && user?.role === "CUSTOMER"

  const { data: cart } = useCart()
  const cartItem = cart?.items.find(i => i.medicine === id)
  const addToCart = useAddToCart()

  const [quantity, setQuantity] = useState(1)

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError || !medicine) {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <EmptyState
          icon={<Pill size={24} />}
          title="Medicine not found"
          description="It may have been removed from the catalog."
          action={
            <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">
              Back to shop
            </Link>
          }
        />
      </div>
    )
  }

  const image = mediaUrl(medicine.image)
  const price = formatPrice(medicine.customer_price)
  const maxQuantity = Math.max(1, medicine.available_stock)

  const handleAdd = () => {
    addToCart.mutate(
      { medicine: medicine.id, quantity },
      {
        onSuccess: () => {
          toast.success(`${medicine.name} ×${quantity} added to cart.`)
          openCart()
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail ?? "Could not add to cart."),
      },
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link
        to="/shop"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to shop
      </Link>

      <div className="grid gap-6 rounded-xl border bg-card p-6 md:grid-cols-2">
        {/* Image */}
        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-primary-soft">
          {image ? (
            <img src={image} alt={medicine.name} className="max-h-80 w-full object-contain" />
          ) : (
            <Pill size={48} className="text-primary" />
          )}
        </div>

        {/* Facts */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag tone="neutral">{medicine.dosage_form_display}</Tag>
            <Tag tone="neutral">{medicine.category_name}</Tag>
            {medicine.requires_prescription && <RxTag />}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {medicine.name} <span className="text-lg font-medium text-muted-foreground">{medicine.strength}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">by {medicine.manufacturer_name}</p>

          {medicine.description && (
            <p className="mt-3 text-sm leading-relaxed text-foreground">{medicine.description}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <span className="tnum text-2xl font-bold text-foreground">
              {price ?? <span className="text-base font-medium text-muted-foreground">Currently unavailable</span>}
            </span>
            <StockTag available={medicine.available_stock} />
          </div>

          {/* Purchase controls */}
          <div className="mt-auto pt-6">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Sign in to order
              </Link>
            ) : !isCustomer ? (
              <p className="text-sm text-muted-foreground">Staff accounts cannot place orders.</p>
            ) : !medicine.in_stock ? (
              <p className="text-sm text-muted-foreground">
                Out of stock — check back soon.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {/* Quantity stepper, capped at available stock */}
                <div className="flex items-center rounded-md border">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-foreground hover:bg-muted disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="tnum w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                    disabled={quantity >= maxQuantity}
                    className="p-2 text-foreground hover:bg-muted disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={addToCart.isPending}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {addToCart.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                  {cartItem ? "Update cart" : "Add to cart"}
                </button>

                {cartItem && (
                  <span className="tnum text-xs text-muted-foreground">{cartItem.quantity} already in cart</span>
                )}
              </div>
            )}

            {medicine.requires_prescription && isCustomer && (
              <p className="mt-3 text-xs text-muted-foreground">
                This medicine needs an approved prescription before checkout.{" "}
                <Link to="/account/prescriptions" className="font-semibold text-primary hover:underline">
                  Upload yours here
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Frequently bought together */}
      {recommendations && recommendations.results.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-bold tracking-tight text-foreground">
            Frequently bought together
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recommendations.results.slice(0, 4).map(m => (
              <ShopCard key={m.id} medicine={m} />
            ))}
          </div>
        </div>
      )}
      {!recommendations && (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ShopCardSkeleton key={i} />)}
        </div>
      )}
    </div>
  )
}

export default ShopMedicinePage
