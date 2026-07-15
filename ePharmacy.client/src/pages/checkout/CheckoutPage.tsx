import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShoppingCart, MapPin, ArrowLeft, ShieldAlert, Package, Pill, CreditCard } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { ordersApi } from "@/api/orders"
import { paymentsApi, submitEsewaForm } from "@/api/payments"
import { toast } from "@/store/toastStore"
import { extractErrorMessage } from "@/lib/errors"
import { green, gray } from "@/components/landing/tokens"

// Matches the backend's CheckoutSerializer.delivery_address min_length
const MIN_ADDRESS_LENGTH = 10

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { data: cart, isLoading } = useCart()

  const [address, setAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [simulating, setSimulating] = useState(false)

  const items = cart?.items ?? []
  const total = cart?.total ?? 0
  const hasRx = items.some(i => i.requires_prescription)
  const isEmpty = !isLoading && items.length === 0

  const trimmedAddress = address.trim()
  const addressTooShort = trimmedAddress.length > 0 && trimmedAddress.length < MIN_ADDRESS_LENGTH

  const validateBeforeSubmit = () => {
    if (!trimmedAddress) {
      toast.warning("Please enter a delivery address.")
      return false
    }
    if (trimmedAddress.length < MIN_ADDRESS_LENGTH) {
      toast.warning(`Delivery address must be at least ${MIN_ADDRESS_LENGTH} characters — please include street, area, and city.`)
      return false
    }
    if (isEmpty) {
      toast.warning("Your cart is empty.")
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateBeforeSubmit()) return

    setSubmitting(true)
    try {
      // 1. Create the order
      const order = await ordersApi.checkout({ delivery_address: trimmedAddress })

      // 2. Initiate eSewa payment
      const payload = await paymentsApi.initiate(order.id)

      // 3. Redirect to eSewa gateway (browser form POST)
      submitEsewaForm(payload)
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to place order. Please try again."))
      setSubmitting(false)
    }
  }

  // DEV/TEST ONLY — backend 404s this outside DEBUG. Use while eSewa's
  // sandbox is unreliable, to keep testing the rest of the order flow.
  const handleSimulateSuccess = async () => {
    if (!validateBeforeSubmit()) return

    setSimulating(true)
    try {
      const order = await ordersApi.checkout({ delivery_address: trimmedAddress })
      await paymentsApi.testComplete(order.id)
      navigate("/shop", { state: { paymentStatus: "success" } })
    } catch (err) {
      toast.error(extractErrorMessage(err, "Simulated payment failed."))
      setSimulating(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: gray[50], fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>

      {/* Top bar */}
      <header style={{ backgroundColor: "#fff", borderBottom: `1px solid ${gray[200]}`, padding: "0 24px", height: "60px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: gray[500], padding: "6px 0", borderRadius: "6px" }}
          onMouseEnter={e => (e.currentTarget.style.color = gray[900])}
          onMouseLeave={e => (e.currentTarget.style.color = gray[500])}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ width: "1px", height: "20px", backgroundColor: gray[200] }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: green[600], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pill size={14} color="#fff" />
          </div>
          <span style={{ fontSize: "15px", fontWeight: 700, color: gray[900] }}>ePharmacy Checkout</span>
        </div>
      </header>

      <div className="checkout-grid" style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "28px", alignItems: "start", boxSizing: "border-box" }}>

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Delivery address */}
          <section style={{ backgroundColor: "#fff", borderRadius: "16px", border: `1px solid ${gray[200]}`, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={16} color={green[600]} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: gray[900], margin: 0 }}>Delivery Address</h2>
            </div>

            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter your full delivery address…"
              rows={4}
              style={{
                width: "100%", padding: "12px 14px", fontSize: "14px", color: gray[900],
                border: `1.5px solid ${addressTooShort ? "#ef4444" : gray[200]}`, borderRadius: "10px", resize: "vertical",
                outline: "none", fontFamily: "inherit", lineHeight: 1.6,
                transition: "border-color 0.15s", boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = addressTooShort ? "#ef4444" : green[500])}
              onBlur={e => (e.target.style.borderColor = addressTooShort ? "#ef4444" : gray[200])}
            />
            <p style={{ fontSize: "12px", margin: "6px 0 0", color: addressTooShort ? "#ef4444" : gray[500] }}>
              {addressTooShort
                ? `Please add a few more details (at least ${MIN_ADDRESS_LENGTH} characters, e.g. street, area, and city).`
                : "Include street, area, and city so we can deliver accurately."}
            </p>
          </section>

          {/* Prescription notice */}
          {hasRx && (
            <div style={{ display: "flex", gap: "12px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 18px" }}>
              <ShieldAlert size={18} color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>Prescription Required</p>
                <p style={{ fontSize: "13px", color: "#78350f", margin: 0, lineHeight: 1.6 }}>
                  One or more items in your cart require a valid prescription. After placing your order, please submit your prescription via{" "}
                  <Link to="/prescriptions" style={{ color: green[600], textDecoration: "underline" }}>My Prescriptions</Link>.
                  Your order will be confirmed once the prescription is approved.
                </p>
              </div>
            </div>
          )}

          {/* Payment info */}
          <div style={{ display: "flex", gap: "12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 18px" }}>
            <CreditCard size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px" }}>Secure Payment via eSewa</p>
              <p style={{ fontSize: "13px", color: "#1d4ed8", margin: 0, lineHeight: 1.6 }}>
                You'll be redirected to eSewa's secure payment page to complete your transaction.
              </p>
            </div>
          </div>

        </div>

        {/* ── Right column — order summary ── */}
        <div className="checkout-summary" style={{ backgroundColor: "#fff", borderRadius: "16px", border: `1px solid ${gray[200]}`, overflow: "hidden", position: "sticky", top: "24px" }}>

          <div style={{ padding: "20px 22px", borderBottom: `1px solid ${gray[100]}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingCart size={16} color={gray[700]} />
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: gray[900], margin: 0 }}>Order Summary</h2>
          </div>

          {/* Items */}
          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {isLoading ? (
              <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: gray[500] }}>Loading…</div>
            ) : isEmpty ? (
              <div style={{ padding: "32px", textAlign: "center" }}>
                <Package size={32} color={gray[200]} />
                <p style={{ fontSize: "13px", color: gray[500], margin: "10px 0 0" }}>Cart is empty</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", borderBottom: `1px solid ${gray[50]}` }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: gray[900], margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                      {item.medicine_name}
                    </p>
                    <p style={{ fontSize: "12px", color: gray[500], margin: 0 }}>
                      Qty: {item.quantity}
                      {item.requires_prescription && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 600, color: "#b45309", backgroundColor: "#fef3c7", padding: "1px 6px", borderRadius: "10px" }}>Rx</span>
                      )}
                    </p>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: gray[900], flexShrink: 0, marginLeft: "8px" }}>
                    {item.subtotal > 0 ? `Rs. ${Number(item.subtotal).toFixed(2)}` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Total + CTA */}
          <div style={{ padding: "16px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${gray[100]}`, marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", color: gray[500] }}>Total</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: gray[900] }}>
                {total > 0 ? `Rs. ${Number(total).toFixed(2)}` : "—"}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || isEmpty || isLoading}
              style={{
                width: "100%", padding: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                backgroundColor: submitting || isEmpty ? gray[200] : green[600],
                color: submitting || isEmpty ? gray[500] : "#fff",
                border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: 700,
                cursor: submitting || isEmpty ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!submitting && !isEmpty) e.currentTarget.style.backgroundColor = green[700] }}
              onMouseLeave={e => { if (!submitting && !isEmpty) e.currentTarget.style.backgroundColor = green[600] }}
            >
              <CreditCard size={16} />
              {submitting ? "Redirecting to eSewa…" : "Pay with eSewa"}
            </button>

            {/* DEV/TEST ONLY — no-ops (backend 404s) once DEBUG=False */}
            <button
              onClick={handleSimulateSuccess}
              disabled={submitting || simulating || isEmpty || isLoading}
              style={{
                width: "100%", marginTop: "8px", padding: "9px",
                backgroundColor: "transparent",
                color: simulating ? gray[400] : gray[500],
                border: `1px dashed ${gray[300]}`, borderRadius: "10px",
                fontSize: "11.5px", fontWeight: 600,
                cursor: simulating || submitting || isEmpty ? "not-allowed" : "pointer",
              }}
            >
              {simulating ? "Simulating…" : "eSewa sandbox down? Simulate success (test only)"}
            </button>

            <p style={{ fontSize: "11px", color: gray[500], textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
              By placing this order you agree to our terms and conditions.
            </p>
          </div>
        </div>

      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; padding: 24px 16px !important; }
          .checkout-summary { position: static !important; top: auto !important; }
        }
      `}</style>
    </div>
  )
}

export default CheckoutPage
