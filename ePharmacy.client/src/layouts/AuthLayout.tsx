import { Outlet, Link, useLocation } from "react-router-dom"
import { Pill, ShieldCheck, Truck, Clock, Star } from "lucide-react"

const features = [
  { icon: <ShieldCheck size={18} />, text: "100% genuine medicines"           },
  { icon: <Truck size={18} />,       text: "Same-day delivery in Kathmandu"   },
  { icon: <Clock size={18} />,       text: "24/7 availability"                },
  { icon: <Star size={18} />,        text: "Licensed pharmacists on every order" },
]

const AuthLayout = () => {
  const { pathname } = useLocation()
  const isLogin = pathname === "/login"

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#f9fafb" }}>

      {/* ── Left — Form side ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "48px 40px", overflowY: "auto" }}>

        {/* Back to home */}
        <div style={{ width: "100%", maxWidth: "440px", marginBottom: "32px" }}>
          <Link
            to="/"
            style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#059669")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
          >
            ← Back to home
          </Link>
        </div>

        {/* Form content injected here */}
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <Outlet />
        </div>

        {/* Toggle between login / register */}
        <div style={{ marginTop: "28px", textAlign: "center" }}>
          {isLogin ? (
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#059669", fontWeight: 600, textDecoration: "none" }}>
                Create one
              </Link>
            </p>
          ) : (
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#059669", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ── Right — Brand panel ── */}
      <div style={{ width: "480px", flexShrink: 0, background: "linear-gradient(160deg, #047857 0%, #059669 50%, #10b981 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 48px", position: "relative", overflow: "hidden" }}>

        {/* Background decoration circles */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: "40%", right: "-40px", width: "160px", height: "160px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pill size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>ePharmacy</span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, margin: "0 0 16px 0" }}>
          Nepal's Most Trusted Online Pharmacy
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 48px 0" }}>
          Order genuine medicines from the comfort of your home. Fast delivery, licensed pharmacists, always available.
        </p>

        {/* Features list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
          {features.map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", flexShrink: 0 }}>
                {icon}
              </div>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          {[
            { value: "10,000+", label: "Medicines"  },
            { value: "50,000+", label: "Customers"  },
            { value: "500+",    label: "Suppliers"  },
            { value: "24/7",    label: "Support"    },
          ].map(({ value, label }) => (
            <div key={label}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px 0" }}>{value}</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default AuthLayout