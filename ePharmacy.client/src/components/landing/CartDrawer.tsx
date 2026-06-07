import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { ShoppingCart, X, Trash2, Package, ArrowRight, Minus, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/hooks/useCart"
import { green, gray } from "./tokens"

// ── Open/close state shared within the page via module-level signal ──────────
let _setOpen: ((v: boolean) => void) | null = null
export const openCart  = () => _setOpen?.(true)
export const closeCart = () => _setOpen?.(false)

// ── Cart badge icon (rendered in Navbar) ─────────────────────────────────────
export const CartTrigger = () => {
  const { data: cart } = useCart()
  const count = cart?.items?.length ?? 0

  return (
    <button
      onClick={openCart}
      title="Cart"
      style={{
        position: "relative", background: "none", border: "none",
        cursor: "pointer", padding: "6px", borderRadius: "8px",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[100])}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <ShoppingCart size={20} color={gray[700]} />
      {count > 0 && (
        <span style={{
          position: "absolute", top: "1px", right: "1px",
          minWidth: "16px", height: "16px", borderRadius: "8px",
          backgroundColor: green[600], color: "#fff",
          fontSize: "10px", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px", border: "1.5px solid #fff",
        }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}

// ── The drawer itself (rendered via portal at app root) ───────────────────────
export const CartDrawer = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const { data: cart, isLoading, isError } = useCart()
  const { mutate: removeItem } = useRemoveFromCart()
  const { mutate: updateQty, isPending: updatingQty } = useUpdateCartQuantity()

  // Expose setter so CartTrigger (and openCart/closeCart) can drive this
  useEffect(() => {
    _setOpen = setOpen
    return () => { _setOpen = null }
  }, [])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const count = cart?.items?.length ?? 0
  const total = cart?.total ?? 0

  const handleCheckout = () => {
    setOpen(false)
    navigate("/checkout")
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          backgroundColor: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301,
          width: "min(420px, 100vw)",
          backgroundColor: "#fff",
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.14)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${gray[100]}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart size={18} color={gray[700]} />
            <span style={{ fontSize: "16px", fontWeight: 700, color: gray[900] }}>
              Your Cart
            </span>
            {count > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 600, color: green[700], backgroundColor: green[50], padding: "2px 8px", borderRadius: "20px" }}>
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: gray[100], border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[200])}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = gray[100])}
          >
            <X size={15} color={gray[700]} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {isLoading ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: gray[500], fontSize: "14px" }}>Loading…</div>
          ) : isError ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#b91c1c", margin: "0 0 8px", fontWeight: 600 }}>Could not load cart</p>
              <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>Check your connection or try refreshing.</p>
            </div>
          ) : count === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "18px", backgroundColor: gray[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Package size={28} color={gray[500]} />
              </div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: gray[700], margin: "0 0 6px" }}>Your cart is empty</p>
              <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>Browse medicines and add items to get started.</p>
            </div>
          ) : (
            cart!.items.map(item => (
              <CartItem
                key={item.id}
                name={item.medicine_name}
                qty={item.quantity}
                subtotal={item.subtotal}
                requiresPrescription={item.requires_prescription}
                onRemove={() => removeItem(item.medicine)}
                onQtyChange={(newQty) => updateQty({ medicineId: item.medicine, quantity: newQty })}
                busy={updatingQty}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${gray[100]}`, flexShrink: 0, backgroundColor: "#fff" }}>
            {/* Total row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", color: gray[500] }}>Estimated Total</span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: gray[900] }}>
                {total > 0 ? `Rs. ${Number(total).toFixed(2)}` : "—"}
              </span>
            </div>

            {/* Prescription note if any Rx item */}
            {cart!.items.some(i => i.requires_prescription) && (
              <div style={{ fontSize: "12px", color: "#92400e", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "9px 12px", marginBottom: "14px" }}>
                One or more items require a prescription. You'll be asked to upload one at checkout.
              </div>
            )}

            <button
              onClick={handleCheckout}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "13px", backgroundColor: green[600], color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = green[700])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = green[600])}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cartSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>,
    document.body
  )
}

// ── Cart item row ─────────────────────────────────────────────────────────────
const CartItem = ({
  name, qty, subtotal, requiresPrescription, onRemove, onQtyChange, busy,
}: {
  name: string; qty: number; subtotal: number
  requiresPrescription: boolean
  onRemove: () => void
  onQtyChange: (newQty: number) => void
  busy: boolean
}) => (
  <div style={{ padding: "14px 24px", borderBottom: `1px solid ${gray[50]}` }}>
    {/* Row 1: icon · name · trash */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <ShoppingCart size={14} color={green[600]} />
      </div>
      <p style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: gray[900], margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </p>
      <button
        onClick={onRemove}
        title="Remove item"
        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: "4px", display: "flex", flexShrink: 0, borderRadius: "6px" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Trash2 size={13} />
      </button>
    </div>

    {/* Row 2: Rx badge · qty stepper · subtotal */}
    <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "48px" }}>
      {requiresPrescription && (
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#b45309", backgroundColor: "#fef3c7", padding: "2px 7px", borderRadius: "10px", flexShrink: 0 }}>Rx</span>
      )}

      {/* Qty stepper */}
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${gray[200]}`, borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
        <button
          onClick={() => onQtyChange(qty - 1)}
          disabled={busy}
          title={qty === 1 ? "Remove item" : "Decrease quantity"}
          style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: busy ? "wait" : "pointer", color: qty === 1 ? "#dc2626" : gray[700], transition: "background 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = qty === 1 ? "#fef2f2" : gray[100])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {qty === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
        </button>
        <span style={{ minWidth: "28px", textAlign: "center", fontSize: "13px", fontWeight: 700, color: gray[900], padding: "0 2px" }}>
          {qty}
        </span>
        <button
          onClick={() => onQtyChange(qty + 1)}
          disabled={busy}
          title="Increase quantity"
          style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: busy ? "wait" : "pointer", color: gray[700], transition: "background 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[100])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Subtotal */}
      {subtotal > 0 && (
        <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 700, color: gray[900], flexShrink: 0 }}>
          Rs. {Number(subtotal).toFixed(2)}
        </span>
      )}
    </div>
  </div>
)
