import { useEffect, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { Loader } from "lucide-react"
import { paymentsApi } from "@/api/payments"
import { gray } from "@/components/landing/tokens"

/**
 * eSewa v2 redirects here with ?data=<base64encodedJSON>.
 * We verify server-side, then hand off to the shop page (with the cart
 * drawer open) which renders the actual success/failure modal — this page
 * is just the transient landing spot for the redirect.
 */
const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const verify = async () => {
      const rawData = searchParams.get("data")
      if (!rawData) {
        navigate("/shop", { replace: true, state: { paymentStatus: "failed" } })
        return
      }

      try {
        // eSewa's `data` value is base64, which routinely contains literal "+"
        // characters. useSearchParams() is backed by URLSearchParams, which
        // decodes the query string as application/x-www-form-urlencoded —
        // every "+" becomes a space before we ever see it. Left uncorrected,
        // atob() silently decodes the wrong bytes and JSON.parse fails, so a
        // genuinely successful payment intermittently lands on "failed"
        // depending on whether that transaction's base64 happened to
        // contain a "+". Base64 never legitimately contains a raw space, so
        // restoring it is safe.
        const base64 = rawData.replace(/ /g, "+")
        const decoded = JSON.parse(atob(base64)) as Record<string, string>
        const record = await paymentsApi.verify(decoded)
        // A repeat verify (e.g. page refresh) returns {detail: "Payment already verified."}
        if (record.status === "completed" || !record.status) {
          navigate("/shop", {
            replace: true,
            state: { paymentStatus: "success", transactionId: record.transaction_id ?? undefined },
          })
        } else {
          navigate("/shop", { replace: true, state: { paymentStatus: "failed" } })
        }
      } catch (err) {
        console.error("Payment verification failed:", err)
        // 409 = money was captured by eSewa but the order couldn't be
        // confirmed (e.g. a stock conflict). Distinct from a clean failure —
        // the customer was charged, so "Payment Failed" would be misleading.
        if (isAxiosError(err) && err.response?.status === 409) {
          const detail = err.response.data?.detail
          navigate("/shop", {
            replace: true,
            state: { paymentStatus: "conflict", message: typeof detail === "string" ? detail : undefined },
          })
          return
        }
        navigate("/shop", { replace: true, state: { paymentStatus: "failed" } })
      }
    }

    verify()
  }, [navigate, searchParams])

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", backgroundColor: gray[50], fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      <Loader size={28} color={gray[500]} style={{ animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: "14px", color: gray[500] }}>Verifying your payment…</p>
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
