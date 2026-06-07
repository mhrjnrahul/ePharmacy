import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { green, gray } from "./tokens"

const CATEGORIES = [
  { label: "Antibiotics",    icon: "🦠", desc: "Bacterial infection treatments",  count: 48 },
  { label: "Analgesics",     icon: "💊", desc: "Pain relief medicines",           count: 62 },
  { label: "Antacids",       icon: "🫁", desc: "Acid reflux & ulcer relief",      count: 35 },
  { label: "Antihistamines", icon: "🌿", desc: "Allergy relief medicines",        count: 29 },
  { label: "Antidiabetics",  icon: "🩸", desc: "Diabetes management",            count: 41 },
  { label: "Vitamins",       icon: "⚡", desc: "Supplements & vitamins",          count: 87 },
]

export const CategoriesSection = () => (
  <section id="categories" style={{ padding: "80px 24px", backgroundColor: gray[50] }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
        <div>
          <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 8px" }}>
            Browse by Category
          </h2>
          <p style={{ fontSize: "15px", color: gray[500], margin: 0 }}>
            Find medicines organised by drug class
          </p>
        </div>
        <Link
          to="/register"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: green[600], textDecoration: "none" }}
        >
          View all <ChevronRight size={15} />
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {CATEGORIES.map(({ label, icon, desc, count }) => (
          <Link
            key={label}
            to="/register"
            style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", borderRadius: "14px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = green[500]; e.currentTarget.style.backgroundColor = green[50] }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = gray[200];  e.currentTarget.style.backgroundColor = "#fff"   }}
          >
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: gray[900], margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontSize: "12px", color: gray[500], margin: "0 0 6px" }}>{desc}</p>
              <span style={{ fontSize: "11px", fontWeight: 500, color: green[700], backgroundColor: green[100], padding: "2px 8px", borderRadius: "20px" }}>
                {count} medicines
              </span>
            </div>
            <ChevronRight size={16} color={gray[500]} />
          </Link>
        ))}
      </div>

    </div>
  </section>
)
