import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { green } from "./tokens"

export const CTABanner = () => (
  <section style={{ padding: "80px 24px", background: `linear-gradient(135deg, ${green[700]} 0%, ${green[500]} 100%)` }}>
    <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ fontSize: "36px", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>
        Ready to get started?
      </h2>
      <p style={{ fontSize: "16px", color: green[100], margin: "0 0 36px", lineHeight: 1.7 }}>
        Join thousands of customers who trust ePharmacy for their healthcare needs. Register today and get your medicines delivered fast.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/register"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", backgroundColor: "#fff", color: green[700], borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
        >
          Create Free Account <ChevronRight size={16} />
        </Link>
        <Link
          to="/login"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", backgroundColor: "transparent", color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", border: "2px solid rgba(255,255,255,0.4)" }}
        >
          Sign In
        </Link>
      </div>
    </div>
  </section>
)
