import { CheckCircle, XCircle } from "lucide-react"
import { green, gray } from "@/components/landing/tokens"

interface Props {
  status: "success" | "failed"
  transactionId?: string
  onClose: () => void
}

/** Shown over the shop page after returning from eSewa — replaces the old standalone success page. */
export const PaymentResultModal = ({ status, transactionId, onClose }: Props) => {
  const isSuccess = status === "success"

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", backdropFilter: "blur(3px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: "400px",
        backgroundColor: "#fff", borderRadius: "20px",
        padding: "36px 24px", textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          backgroundColor: isSuccess ? green[50] : "#fef2f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
        }}>
          {isSuccess
            ? <CheckCircle size={32} color={green[600]} />
            : <XCircle size={32} color="#dc2626" />}
        </div>

        <h2 style={{ fontSize: "19px", fontWeight: 800, color: gray[900], margin: "0 0 8px" }}>
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h2>
        <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 4px", lineHeight: 1.6 }}>
          {isSuccess
            ? "Your order has been placed and payment confirmed."
            : "We couldn't verify your payment. Your cart has not been charged."}
        </p>
        {isSuccess && transactionId && (
          <p style={{ fontSize: "11px", color: gray[500], margin: "8px 0 0" }}>
            Transaction ID: <span style={{ fontWeight: 600, color: gray[700] }}>{transactionId}</span>
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "22px", width: "100%", padding: "12px",
            backgroundColor: isSuccess ? green[600] : "#fff",
            color: isSuccess ? "#fff" : gray[700],
            border: isSuccess ? "none" : `1px solid ${gray[200]}`,
            borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (isSuccess) e.currentTarget.style.backgroundColor = green[700] }}
          onMouseLeave={e => { if (isSuccess) e.currentTarget.style.backgroundColor = green[600] }}
        >
          {isSuccess ? "Continue Shopping" : "Try Again"}
        </button>
      </div>
    </div>
  )
}
