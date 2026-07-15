import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { useAllCategories } from "@/hooks/useCategories"
import { green, gray } from "./tokens"

// Purely cosmetic — the backend doesn't model an icon per category, so this
// is a best-effort lookup by name with a sensible fallback. Unlike the old
// hardcoded list, nothing here fabricates data (name/description/id all come
// from the real API).
const CATEGORY_ICONS: Record<string, string> = {
  "Pain Relief": "💊",
  "Antibiotics": "🦠",
  "Vitamins & Supplements": "⚡",
  "Cold & Flu": "🤧",
  "Digestive Health": "🫁",
  "Skin Care": "🧴",
  "Diabetes Management": "🩸",
  "Cardiovascular": "❤️",
}
const DEFAULT_ICON = "🩹"
const VISIBLE_COUNT = 6

const CATEGORIES_STYLES = `
  .categories-section { padding: 80px 24px; }
  .categories-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 900px) { .categories-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px) { .categories-section { padding: 56px 20px; } }
  @media (max-width: 480px) { .categories-grid { grid-template-columns: 1fr; } }
`

const CategorySkeleton = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", borderRadius: "14px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff" }}>
    <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: gray[100], flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ height: "14px", width: "60%", backgroundColor: gray[100], borderRadius: "4px", marginBottom: "8px" }} />
      <div style={{ height: "11px", width: "85%", backgroundColor: gray[100], borderRadius: "4px" }} />
    </div>
  </div>
)

export const CategoriesSection = () => {
  const { data: categories, isLoading } = useAllCategories()
  const visible = (categories ?? []).filter(c => c.is_active).slice(0, VISIBLE_COUNT)

  return (
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
          {isLoading
            ? Array.from({ length: VISIBLE_COUNT }).map((_, i) => <CategorySkeleton key={i} />)
            : visible.map(({ id, name, description }) => (
                <Link
                  key={id}
                  to={`/shop?category=${id}`}
                  style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", borderRadius: "14px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = green[500]; e.currentTarget.style.backgroundColor = green[50] }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = gray[200];  e.currentTarget.style.backgroundColor = "#fff"   }}
                >
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                    {CATEGORY_ICONS[name] ?? DEFAULT_ICON}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: gray[900], margin: "0 0 2px" }}>{name}</p>
                    <p style={{ fontSize: "12px", color: gray[500], margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {description || "Browse this category"}
                    </p>
                  </div>
                  <ChevronRight size={16} color={gray[500]} />
                </Link>
              ))
          }
        </div>

        {!isLoading && visible.length === 0 && (
          <p style={{ textAlign: "center", padding: "32px", fontSize: "14px", color: gray[500] }}>
            No categories available at the moment.
          </p>
        )}

      </div>
    </section>
  )
}
