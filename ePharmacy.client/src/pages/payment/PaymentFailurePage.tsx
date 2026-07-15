import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Loader } from "lucide-react"
import { gray } from "@/components/landing/tokens"

/** eSewa redirects here when the customer cancels or the payment fails on their end. */
const PaymentFailurePage = () => {
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    navigate("/shop", { replace: true, state: { paymentStatus: "failed" } })
  }, [navigate])

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", backgroundColor: gray[50], fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      <Loader size={28} color={gray[500]} style={{ animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: "14px", color: gray[500] }}>Redirecting…</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default PaymentFailurePage
