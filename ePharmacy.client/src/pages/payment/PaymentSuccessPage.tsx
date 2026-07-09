import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { CheckCircle, XCircle, Loader, Pill, ArrowRight } from "lucide-react"
import { paymentsApi } from "@/api/payments"
import { green, gray } from "@/components/landing/tokens"

type State = "verifying" | "success" | "failed"

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<State>("verifying")
  const [transactionId, setTransactionId] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      // eSewa v2 redirects with ?data=<base64encodedJSON>
      const rawData = searchParams.get("data")
      if (!rawData) {
        setState("failed")
        return
      }

      try {
        const decoded = JSON.parse(atob(rawData)) as Record<string, string>
        const record = await paymentsApi.verify(decoded)
        if (record.status === "COMPLETED") {
          setTransactionId(record.transaction_id)
          setState("success")
        } else {
          setState("failed")
        }
      } catch {
        setState("failed")
      }
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: "100vh", backgroundColor: gray[50], display: "flex", flexDirection: "column", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>

      {/* Simple header */}
      <header style={{ backgroundColor: "#fff", borderBottom: `1px solid ${gray[200]}`, padding: "0 24px", height: "60px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: green[600], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pill size={14} color="#fff" />
        </div>
        <span style={{ fontSize: "15px", fontWeight: 700, color: gray[900] }}>ePharmacy</span>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: "440px", backgroundColor: "#fff", borderRadius: "20px", border: `1px solid ${gray[200]}`, padding: "48px 40px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>

          {state === "verifying" && (
            <>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: gray[100], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Loader size={32} color={gray[500]} style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: gray[900], margin: "0 0 8px" }}>Verifying Payment…</h1>
              <p style={{ fontSize: "14px", color: gray[500], margin: 0 }}>Please wait while we confirm your transaction.</p>
            </>
          )}

          {state === "success" && (
            <>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={36} color={green[600]} />
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: gray[900], margin: "0 0 10px" }}>Payment Successful!</h1>
              <p style={{ fontSize: "14px", color: gray[500], margin: "0 0 8px", lineHeight: 1.6 }}>
                Your order has been placed and payment confirmed.
              </p>
              {transactionId && (
                <p style={{ fontSize: "12px", color: gray[500], margin: "0 0 28px" }}>
                  Transaction ID: <span style={{ fontWeight: 600, color: gray[700] }}>{transactionId}</span>
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  to="/account/orders"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", backgroundColor: green[600], color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = green[700])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = green[600])}
                >
                  View My Orders <ArrowRight size={15} />
                </Link>
                <Link
                  to="/"
                  style={{ padding: "12px", border: `1px solid ${gray[200]}`, borderRadius: "10px", fontSize: "14px", fontWeight: 500, color: gray[700], textDecoration: "none" }}
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}

          {state === "failed" && (
            <>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <XCircle size={36} color="#dc2626" />
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: gray[900], margin: "0 0 10px" }}>Payment Failed</h1>
              <p style={{ fontSize: "14px", color: gray[500], margin: "0 0 28px", lineHeight: 1.6 }}>
                We couldn't verify your payment. Your cart has not been charged. Please try again.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  to="/checkout"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", backgroundColor: green[600], color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
                >
                  Try Again
                </Link>
                <Link
                  to="/"
                  style={{ padding: "12px", border: `1px solid ${gray[200]}`, borderRadius: "10px", fontSize: "14px", fontWeight: 500, color: gray[700], textDecoration: "none" }}
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default PaymentSuccessPage
