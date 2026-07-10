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

const CATEGORIES_STYLES = `
  .categories-section { padding: 80px 24px; }
  .categories-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 900px) { .categories-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px) { .categories-section { padding: 56px 20px; } }
  @media (max-width: 480px) { .categories-grid { grid-template-columns: 1fr; } }
`

export const CategoriesSection = () => (
  <section id="categories" className="categories-section" style={{ backgroundColor: gray[50] }}>
    <style>{CATEGORIES_STYLES}</style>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "40px" }}>
        <div>
          <h2 style={{ fontSize: "36px", fontWeight: 700, color: gray[900], margin: "0 0 8px" }}>
            Browse by Category
          </h2>
          <p style={{ fontSize: "15px", color: gray[500], margin: 0 }}>
            Find medicines organised by drug class
          </p>
        </div>
        <Link
          to="/shop"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: green[600], textDecoration: "none" }}
        >
          View all <ChevronRight size={15} />
        </Link>
      </div>

      <div className="categories-grid">
        {CATEGORIES.map(({ label, icon, desc, count }) => (
          <Link
            key={label}
            to="/shop"
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
