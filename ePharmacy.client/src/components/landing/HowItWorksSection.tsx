import { Search, ShoppingCart, Package } from "lucide-react"
import { green, gray } from "./tokens"

const STEPS = [
  { icon: <Search       size={24} color={green[600]} />, step: "01", title: "Search Medicine",  desc: "Search by name, category, or condition. Find exactly what you need."      },
  { icon: <ShoppingCart size={24} color={green[600]} />, step: "02", title: "Add to Cart",      desc: "Add items to your cart. Upload prescription if required."                 },
  { icon: <Package      size={24} color={green[600]} />, step: "03", title: "Fast Delivery",    desc: "We verify your order and deliver it straight to your door."               },
]

export const HowItWorksSection = () => (
  <section id="how" style={{ padding: "80px 24px", backgroundColor: "#fff" }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 12px" }}>
          How It Works
        </h2>
        <p style={{ fontSize: "16px", color: gray[500], margin: 0 }}>
          Get your medicines in 3 simple steps
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px", position: "relative" }}>
        {/* Connector line */}
        <div style={{ position: "absolute", top: "40px", left: "calc(16.66% + 40px)", right: "calc(16.66% + 40px)", height: "2px", backgroundColor: green[100], zIndex: 0 }} />

        {STEPS.map(({ icon, step, title, desc }) => (
          <div key={step} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#fff", border: `2px solid ${green[100]}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
              {icon}
              <span style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: green[600], color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {step}
              </span>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: "0 0 8px" }}>{title}</h3>
            <p style={{ fontSize: "13px", color: gray[500], margin: 0, lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

    </div>
  </section>
)
