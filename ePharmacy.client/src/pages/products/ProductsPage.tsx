import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchProducts, fetchCategories, deleteProduct } from "@/api/products"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Search } from "lucide-react"
import type { Product, ProductVariant } from "@/types"
import ProductFormModal from "./ProductFormModal"
import VariantFormModal from "./VariantFormModal"

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => "Rs. " + n.toLocaleString("en-NP")

const dosageLabels: Record<string, string> = {
  TABLET: "Tablet", CAPSULE: "Capsule", SYRUP: "Syrup",
  INJECTION: "Injection", CREAM: "Cream", DROPS: "Drops",
  INHALER: "Inhaler", PATCH: "Patch", SUPPOSITORY: "Suppository", OTHER: "Other",
}

const stockBadge = (v: ProductVariant) => {
  if (v.stock_level === 0)              return { bg: "#fee2e2", color: "#991b1b", label: "Out of Stock" }
  if (v.stock_level <= v.reorder_point) return { bg: "#fef9c3", color: "#854d0e", label: "Low Stock"    }
  return                                       { bg: "#dcfce7", color: "#166534", label: "In Stock"     }
}

const expiryWarning = (expiry: string | null) => {
  if (!expiry) return null
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
  if (days <= 30) return { label: `Expires in ${days}d`, color: "#991b1b" }
  if (days <= 60) return { label: `Expires in ${days}d`, color: "#854d0e" }
  return null
}

// ── sub components ────────────────────────────────────────────────────────────

const Badge = ({ bg, color, label }: { bg: string; color: string; label: string }) => (
  <span style={{ fontSize: "11px", fontWeight: 500, backgroundColor: bg, color, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>
    {label}
  </span>
)

// ── main ──────────────────────────────────────────────────────────────────────

const ProductsPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch]               = useState("")
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all")
  const [statusFilter, setStatusFilter]   = useState<"all" | "active" | "inactive">("all")
  const [expandedId, setExpandedId]       = useState<number | null>(null)

  // modals
  const [productModal, setProductModal]   = useState<{ open: boolean; product?: Product }>({ open: false })
  const [variantModal, setVariantModal]   = useState<{ open: boolean; product?: Product; variant?: ProductVariant }>({ open: false })

  const { data: products, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts })
  const { data: categories }          = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })

  const { mutate: remove } = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  })

  const filtered = products?.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.variants.some(v => v.sku.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = categoryFilter === "all" || p.categories.some(c => c.id === categoryFilter)
    const matchStatus   = statusFilter === "all" ||
                          (statusFilter === "active" && p.is_active) ||
                          (statusFilter === "inactive" && !p.is_active)
    return matchSearch && matchCategory && matchStatus
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>Products</h1>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            {products?.length ?? 0} medicines in inventory
          </p>
        </div>
        <button
          onClick={() => setProductModal({ open: true })}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#059669", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Medicine
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            style={{ width: "100%", paddingLeft: "32px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#111827", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#111827", backgroundColor: "#ffffff", outline: "none" }}
        >
          <option value="all">All Categories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#111827", backgroundColor: "#ffffff", outline: "none" }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {isLoading ? (
          <p style={{ padding: "24px", fontSize: "13px", color: "#9ca3af" }}>Loading products...</p>
        ) : filtered?.length === 0 ? (
          <p style={{ padding: "24px", fontSize: "13px", color: "#9ca3af" }}>No products found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["", "Medicine", "Category", "Variants", "Status", "Actions"].map(h => (
                  <th key={h} style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textAlign: "left", padding: "10px 16px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered?.map((product, pi) => (
                <>
                  {/* Product row */}
                  <tr
                    key={product.id}
                    style={{ borderBottom: expandedId === product.id ? "none" : pi < (filtered.length - 1) ? "1px solid #f3f4f6" : "none", backgroundColor: expandedId === product.id ? "#f9fafb" : "#ffffff" }}
                  >
                    {/* Expand toggle */}
                    <td style={{ padding: "12px 8px 12px 16px", width: "32px" }}>
                      <button
                        onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
                      >
                        {expandedId === product.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </td>

                    {/* Name */}
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: "0 0 2px 0" }}>{product.name}</p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{product.description}</p>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {product.categories.map(c => (
                          <span key={c.id} style={{ fontSize: "11px", backgroundColor: "#eff6ff", color: "#1e40af", padding: "2px 8px", borderRadius: "20px" }}>
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Variants count */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>{product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <Badge
                        bg={product.is_active ? "#dcfce7" : "#f3f4f6"}
                        color={product.is_active ? "#166534" : "#6b7280"}
                        label={product.is_active ? "Active" : "Inactive"}
                      />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setProductModal({ open: true, product })}
                          style={{ padding: "5px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete ${product.name}?`)) remove(product.id) }}
                          style={{ padding: "5px", borderRadius: "6px", border: "1px solid #fee2e2", backgroundColor: "#fff5f5", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded variants */}
                  {expandedId === product.id && (
                    <tr key={`${product.id}-variants`}>
                      <td colSpan={6} style={{ padding: "0 16px 16px 48px", backgroundColor: "#f9fafb" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <p style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280", margin: 0 }}>Variants</p>
                          <button
                            onClick={() => setVariantModal({ open: true, product })}
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", backgroundColor: "#059669", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}
                          >
                            <Plus size={11} /> Add Variant
                          </button>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#f3f4f6" }}>
                              {["SKU", "Name", "Form", "Cost", "Price", "Stock", "Expiry", "Status", ""].map(h => (
                                <th key={h} style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textAlign: "left", padding: "8px 12px" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((v, vi) => {
                              const stock   = stockBadge(v)
                              const expWarn = expiryWarning(v.expiry_date)
                              return (
                                <tr key={v.id} style={{ borderTop: vi > 0 ? "1px solid #f3f4f6" : "none" }}>
                                  <td style={{ padding: "8px 12px", fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>{v.sku}</td>
                                  <td style={{ padding: "8px 12px", fontSize: "12px", color: "#111827", fontWeight: v.is_default ? 500 : 400 }}>
                                    {v.name} {v.is_default && <span style={{ fontSize: "10px", color: "#059669" }}>• default</span>}
                                  </td>
                                  <td style={{ padding: "8px 12px", fontSize: "12px", color: "#6b7280" }}>{dosageLabels[v.dosage_form]}</td>
                                  <td style={{ padding: "8px 12px", fontSize: "12px", color: "#6b7280" }}>{fmt(v.cost_price)}</td>
                                  <td style={{ padding: "8px 12px", fontSize: "12px", color: "#111827", fontWeight: 500 }}>{fmt(v.selling_price)}</td>
                                  <td style={{ padding: "8px 12px" }}><Badge {...stock} /></td>
                                  <td style={{ padding: "8px 12px" }}>
                                    {expWarn
                                      ? <span style={{ fontSize: "11px", color: expWarn.color, fontWeight: 500 }}>{expWarn.label}</span>
                                      : <span style={{ fontSize: "11px", color: "#9ca3af" }}>{v.expiry_date ?? "—"}</span>
                                    }
                                  </td>
                                  <td style={{ padding: "8px 12px" }}>
                                    <Badge
                                      bg={v.is_active ? "#dcfce7" : "#f3f4f6"}
                                      color={v.is_active ? "#166534" : "#6b7280"}
                                      label={v.is_active ? "Active" : "Inactive"}
                                    />
                                  </td>
                                  <td style={{ padding: "8px 12px" }}>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                      <button
                                        onClick={() => setVariantModal({ open: true, product, variant: v })}
                                        style={{ padding: "4px", borderRadius: "4px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", cursor: "pointer", color: "#6b7280", display: "flex" }}
                                      >
                                        <Pencil size={11} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {productModal.open && (
        <ProductFormModal
          product={productModal.product}
          onClose={() => setProductModal({ open: false })}
        />
      )}
      {variantModal.open && variantModal.product && (
        <VariantFormModal
          product={variantModal.product}
          variant={variantModal.variant}
          onClose={() => setVariantModal({ open: false })}
        />
      )}
    </div>
  )
}

export default ProductsPage