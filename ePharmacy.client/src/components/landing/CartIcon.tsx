import { useState, useRef, useEffect } from "react"
import { ShoppingCart, X, Trash2, Package } from "lucide-react"
import { useCart, useRemoveFromCart } from "@/hooks/useCart"
import { green, gray } from "./tokens"

export const CartIcon = () => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: cart, isLoading } = useCart()
  const { mutate: removeItem, isPending: removing } = useRemoveFromCart()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const count = cart?.items?.length ?? 0
  const total = cart?.total ?? 0

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* Icon button */}
      <button
        onClick={() => setOpen(o => !o)}
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
            padding: "0 3px", lineHeight: 1,
            border: "1.5px solid #fff",
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: "min(320px, calc(100vw - 32px))",
          backgroundColor: "#fff", borderRadius: "14px",
          border: `1px solid ${gray[200]}`,
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          overflow: "hidden", zIndex: 100,
        }}>

          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${gray[100]}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: gray[900], margin: 0 }}>
              Your Cart {count > 0 && <span style={{ color: gray[500], fontWeight: 400 }}>({count})</span>}
            </p>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", color: gray[500], borderRadius: "4px" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[100])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          {isLoading ? (
            <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: gray[500] }}>
              Loading...
            </div>
          ) : count === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: gray[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Package size={22} color={gray[500]} />
              </div>
              <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 4px" }}>Your cart is empty</p>
              <p style={{ fontSize: "12px", color: gray[500], margin: 0, opacity: 0.7 }}>Browse medicines and add items</p>
            </div>
          ) : (
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {cart!.items.map(item => (
                <div
                  key={item.id}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", borderBottom: `1px solid ${gray[50]}` }}
                >
                  {/* Medicine icon */}
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingCart size={13} color={green[600]} />
                  </div>

                  {/* Name + qty */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: gray[900], margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.medicine_name}
                    </p>
                    <p style={{ fontSize: "11px", color: gray[500], margin: 0 }}>
                      Qty: {item.quantity}
                      {item.subtotal > 0 && (
                        <span style={{ marginLeft: "6px", color: green[600], fontWeight: 500 }}>
                          · Rs. {Number(item.subtotal).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.medicine)}
                    disabled={removing}
                    title="Remove"
                    style={{ background: "none", border: "none", cursor: removing ? "not-allowed" : "pointer", padding: "4px", color: "#dc2626", borderRadius: "4px", display: "flex", flexShrink: 0, opacity: removing ? 0.5 : 1 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {count > 0 && (
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${gray[100]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: gray[500] }}>Total</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: gray[900] }}>
                  {total > 0 ? `Rs. ${Number(total).toFixed(2)}` : "—"}
                </span>
              </div>
              <button
                style={{ width: "100%", padding: "10px", backgroundColor: green[600], color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = green[700])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = green[600])}
              >
                Proceed to Checkout
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
