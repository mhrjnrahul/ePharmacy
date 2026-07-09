import { useState } from "react"
import { Pill, ShoppingCart, Info, Check, AlertTriangle } from "lucide-react"
import type { MedicineListItem } from "@/types/medicine"
import { useAuthStore } from "@/store/authStore"
import { useAddToCart, useCart } from "@/hooks/useCart"
import { openCart } from "./CartDrawer"
import { toast } from "@/store/toastStore"
import { green, gray } from "./tokens"

const BASE_URL = "http://127.0.0.1:8000"

interface Props {
  medicine: MedicineListItem
  onDetails: () => void
}

export const MedicineCard = ({ medicine, onDetails }: Props) => {
  const { user, isAuthenticated } = useAuthStore()
  const isCustomer = isAuthenticated && user?.role === "CUSTOMER"

  const { data: cart } = useCart()
  const cartItem = cart?.items.find(i => i.medicine === medicine.id)
  const isInCart = !!cartItem

  const { mutate: addToCart, isPending: adding, reset } = useAddToCart()
  const [justAdded, setJustAdded] = useState(false)

  const imageUrl = medicine.image
    ? medicine.image.startsWith("http") ? medicine.image : `${BASE_URL}${medicine.image}`
    : null

  const handleCartClick = () => {
    // Already in cart — open drawer instead of re-posting
    if (isInCart) {
      openCart()
      toast.info(`${medicine.name} is already in your cart. Adjust quantity there.`)
      return
    }

    // Prescription warning fires immediately before the API call
    if (medicine.requires_prescription) {
      toast.warning(`${medicine.name} requires a prescription — you'll need to upload one after ordering.`)
    }

    addToCart(
      { medicine: medicine.id, quantity: 1 },
      {
        onSuccess: () => {
          setJustAdded(true)
          setTimeout(() => { setJustAdded(false); reset() }, 2000)
          if (!medicine.requires_prescription) {
            toast.success("Added to cart!")
          }
        },
        onError: () => {
          toast.error("Failed to add to cart. Please try again.")
        },
      }
    )
  }

  return (
    <div
      style={{ borderRadius: "16px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = green[500] }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = gray[200] }}
    >
      {/* Image */}
      <div
        onClick={onDetails}
        style={{ height: "156px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", position: "relative" }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={medicine.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: green[100], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pill size={26} color={green[600]} />
          </div>
        )}
        {/* Rx overlay badge */}
        {medicine.requires_prescription && (
          <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", alignItems: "center", gap: "3px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "3px 7px", borderRadius: "20px" }}>
            <AlertTriangle size={10} color="#b45309" />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#b45309" }}>Rx</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: gray[900], margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {medicine.name}
          </h3>
          <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>
            {medicine.strength} · {medicine.dosage_form_display}
          </p>
        </div>

        {/* Category badge */}
        <span style={{ fontSize: "11px", fontWeight: 500, color: green[700], backgroundColor: green[50], padding: "3px 9px", borderRadius: "20px", alignSelf: "flex-start" }}>
          {medicine.category_name}
        </span>

        {/* CTA */}
        <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
          {/* Details — always */}
          <button
            onClick={onDetails}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "9px 0", backgroundColor: "#fff", color: green[600], border: `1px solid ${green[200]}`, borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = green[50]; e.currentTarget.style.borderColor = green[500] }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.borderColor = green[200] }}
          >
            <Info size={13} /> Details
          </button>

          {/* Cart — CUSTOMER only */}
          {isCustomer && (
            <button
              onClick={handleCartClick}
              disabled={adding}
              title={
                isInCart ? `${cartItem!.quantity} in cart — click to adjust`
                : medicine.is_active ? (medicine.requires_prescription ? "Prescription required" : "Add to cart")
                : "Out of stock"
              }
              style={{
                width: "38px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: isInCart ? green[50] : justAdded ? green[50] : !medicine.is_active ? gray[100] : green[600],
                color: isInCart ? green[700] : justAdded ? green[700] : !medicine.is_active ? gray[400] : "#fff",
                border: isInCart || justAdded ? `1.5px solid ${green[300]}` : "none",
                borderRadius: "8px",
                cursor: adding ? "wait" : !medicine.is_active ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: adding ? 0.6 : 1,
                position: "relative",
              }}
              onMouseEnter={e => { if (!isInCart && !justAdded && medicine.is_active) e.currentTarget.style.backgroundColor = green[700] }}
              onMouseLeave={e => { if (!isInCart && !justAdded && medicine.is_active) e.currentTarget.style.backgroundColor = green[600] }}
            >
              {justAdded || isInCart ? <Check size={14} /> : <ShoppingCart size={14} />}
              {/* Qty badge when in cart */}
              {isInCart && cartItem!.quantity > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-5px", minWidth: "15px", height: "15px", borderRadius: "8px", backgroundColor: green[600], color: "#fff", fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px", border: "1.5px solid #fff" }}>
                  {cartItem!.quantity}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export const MedicineCardSkeleton = () => (
  <div style={{ borderRadius: "16px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", overflow: "hidden" }}>
    <div style={{ height: "156px", backgroundColor: gray[100] }} />
    <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div>
        <div style={{ height: "14px", backgroundColor: gray[100], borderRadius: "4px", marginBottom: "6px", width: "72%" }} />
        <div style={{ height: "12px", backgroundColor: gray[100], borderRadius: "4px", width: "48%" }} />
      </div>
      <div style={{ height: "22px", width: "72px", backgroundColor: gray[100], borderRadius: "20px" }} />
      <div style={{ height: "36px", backgroundColor: gray[100], borderRadius: "8px" }} />
    </div>
  </div>
)
