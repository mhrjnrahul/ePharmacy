import { ShieldCheck, Truck, Clock, Star } from "lucide-react"
import { green, gray } from "./tokens"

const FEATURES = [
  { icon: <ShieldCheck size={22} color={green[600]} />, title: "100% Genuine Medicines",  desc: "All medicines sourced directly from verified suppliers and manufacturers."  },
  { icon: <Truck       size={22} color={green[600]} />, title: "Fast Delivery",           desc: "Same-day delivery in Kathmandu valley. Next-day delivery across Nepal."   },
  { icon: <Clock       size={22} color={green[600]} />, title: "24/7 Availability",       desc: "Order anytime. Our platform is always open, even on public holidays."    },
  { icon: <Star        size={22} color={green[600]} />, title: "Licensed Pharmacists",    desc: "Every order reviewed by a licensed pharmacist before dispatch."          },
]

export const FeaturesSection = () => (
  <section id="features" style={{ padding: "80px 24px", backgroundColor: "#fff" }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 12px" }}>
          Why Choose ePharmacy?
        </h2>
        <p style={{ fontSize: "16px", color: gray[500], margin: "0 auto", maxWidth: "520px" }}>
          We combine technology with healthcare expertise to give you the best pharmacy experience in Nepal.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
        {FEATURES.map(({ icon, title, desc }) => (
          <div
            key={title}
            style={{ padding: "28px 24px", borderRadius: "16px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              {icon}
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 8px" }}>{title}</h3>
            <p style={{ fontSize: "13px", color: gray[500], margin: 0, lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

    </div>
  </section>
)
