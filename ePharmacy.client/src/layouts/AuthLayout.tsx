import { Outlet, Link, useLocation } from "react-router-dom"
import { Pill, ShieldCheck, Truck, Clock, Star } from "lucide-react"

const features = [
  { icon: <ShieldCheck size={18} />, text: "100% genuine medicines"              },
  { icon: <Truck       size={18} />, text: "Same-day delivery in Kathmandu"      },
  { icon: <Clock       size={18} />, text: "24/7 availability"                   },
  { icon: <Star        size={18} />, text: "Licensed pharmacists on every order" },
]

const stats = [
  { value: "10,000+", label: "Medicines" },
  { value: "50,000+", label: "Customers" },
  { value: "500+",    label: "Suppliers" },
  { value: "24/7",    label: "Support"   },
]

const AuthLayout = () => {
  const { pathname } = useLocation()
  const isLogin = pathname === "/login"

  return (
    <>
      {/* ── Responsive breakpoint styles ── */}
      <style>{`
        .auth-root {
          min-height: 100vh;
          height: 100vh;
          display: flex;
          background-color: #f9fafb;
          overflow: hidden;
        }
        .auth-form-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 32px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          min-width: 0;
        }
        .auth-form-side::-webkit-scrollbar {
          display: none;
        }
        .auth-brand-panel {
          width: 480px;
          flex-shrink: 0;
          background: linear-gradient(160deg, #047857 0%, #059669 50%, #10b981 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 48px;
          position: relative;
          overflow: hidden;
        }
        .auth-back-link { margin-bottom: 28px; }
        .auth-toggle    { margin-top: 24px; }
        @media (max-width: 768px) {
          .auth-brand-panel { display: none; }
          .auth-form-side   {
            padding: 32px 24px 28px;
            justify-content: flex-start;
          }
          .auth-back-link { margin-bottom: 20px; }
          .auth-toggle    { margin-top: 20px; }
        }
      `}</style>

      <div className="auth-root">

        {/* ── Form side ── */}
        <div className="auth-form-side">
          <div style={{ width: "100%", maxWidth: "420px" }}>

            {/* Back link */}
            <div className="auth-back-link">
              <Link
                to="/"
                style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#059669")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
              >
                ← Back to home
              </Link>
            </div>

            {/* Page content (LoginPage / RegisterPage) */}
            <Outlet />

            {/* Toggle */}
            <div className="auth-toggle" style={{ textAlign: "center" }}>
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
        </div>

        {/* ── Brand panel (hidden on mobile) ── */}
        <div className="auth-brand-panel">
          {/* Decoration circles */}
          <div style={{ position: "absolute", top: "-80px",  right: "-80px", width: "300px", height: "300px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", top: "40%",    right: "-40px", width: "160px", height: "160px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pill size={22} color="#ffffff" />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>ePharmacy</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, margin: "0 0 16px" }}>
            Nepal's Most Trusted Online Pharmacy
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 48px" }}>
            Order genuine medicines from the comfort of your home. Fast delivery, licensed pharmacists, always available.
          </p>

          {/* Feature list */}
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

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px" }}>{value}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}

export default AuthLayout
