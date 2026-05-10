import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createVariant, updateVariant } from "@/api/products"
import { X, Loader2 } from "lucide-react"
import type { Product, ProductVariant, DosageForm } from "@/types"

interface Props {
  product: Product
  variant?: ProductVariant
  onClose: () => void
}

const dosageOptions: { value: DosageForm; label: string }[] = [
  { value: "TABLET",      label: "Tablet"      },
  { value: "CAPSULE",     label: "Capsule"     },
  { value: "SYRUP",       label: "Syrup"       },
  { value: "INJECTION",   label: "Injection"   },
  { value: "CREAM",       label: "Cream"       },
  { value: "DROPS",       label: "Drops"       },
  { value: "INHALER",     label: "Inhaler"     },
  { value: "PATCH",       label: "Patch"       },
  { value: "SUPPOSITORY", label: "Suppository" },
  { value: "OTHER",       label: "Other"       },
]

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "13px",
  color: "#111827",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
}

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#374151",
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={labelStyle}>
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
    {children}
  </div>
)

const VariantFormModal = ({ product, variant, onClose }: Props) => {
  const queryClient = useQueryClient()
  const isEdit = !!variant

  const [sku,         setSku        ] = useState(variant?.sku          ?? "")
  const [name,        setName       ] = useState(variant?.name         ?? "")
  const [dosageForm,  setDosageForm ] = useState<DosageForm>(variant?.dosage_form ?? "TABLET")
  const [costPrice,   setCostPrice  ] = useState(variant?.cost_price   ?? 0)
  const [sellingPrice,setSellingPrice] = useState(variant?.selling_price ?? 0)
  const [stockLevel,  setStockLevel ] = useState(variant?.stock_level  ?? 0)
  const [reorderPoint,setReorderPoint] = useState(variant?.reorder_point ?? 0)
  const [expiryDate,  setExpiryDate ] = useState(variant?.expiry_date  ?? "")
  const [isDefault,   setIsDefault  ] = useState(variant?.is_default   ?? false)
  const [isActive,    setIsActive   ] = useState(variant?.is_active    ?? true)
  const [error,       setError      ] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof createVariant>[1]) =>
      isEdit
        ? updateVariant(product.id, variant!.id, data)
        : createVariant(product.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onClose()
    },
    onError: () => setError("Something went wrong. Please try again."),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!sku.trim())  { setError("SKU is required.");          return }
    if (!name.trim()) { setError("Variant name is required."); return }
    if (costPrice <= 0)    { setError("Cost price must be greater than 0.");    return }
    if (sellingPrice <= 0) { setError("Selling price must be greater than 0."); return }
    if (sellingPrice < costPrice) { setError("Selling price cannot be less than cost price."); return }
    mutate({
      product: product.id,
      sku: sku.trim(),
      name: name.trim(),
      dosage_form: dosageForm,
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_level: stockLevel,
      reorder_point: reorderPoint,
      expiry_date: expiryDate || null,
      is_default: isDefault,
      is_active: isActive,
    })
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  // profit margin preview
  const margin = sellingPrice > 0 && costPrice > 0
    ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)
    : null

  return (
    <div
      onClick={handleBackdrop}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}
    >
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
              {isEdit ? "Edit Variant" : "Add Variant"}
            </h2>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: "6px", borderRadius: "8px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "#9ca3af", display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}
        >

          {/* SKU + Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="SKU" required>
              <input
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. PAR-500-TAB"
                disabled={isPending}
                style={{ ...inputStyle, fontFamily: "monospace" }}
              />
            </Field>
            <Field label="Variant Name" required>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. 500mg Tablet"
                disabled={isPending}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Dosage form */}
          <Field label="Dosage Form" required>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {dosageOptions.map(opt => {
                const selected = dosageForm === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDosageForm(opt.value)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      border: selected ? "1px solid #059669" : "1px solid #e5e7eb",
                      backgroundColor: selected ? "#ecfdf5" : "#ffffff",
                      color: selected ? "#065f46" : "#6b7280",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Pricing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Cost Price (Rs.)" required>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={e => setCostPrice(Number(e.target.value))}
                disabled={isPending}
                style={inputStyle}
              />
            </Field>
            <Field label="Selling Price (Rs.)" required>
              <input
                type="number"
                min={0}
                value={sellingPrice}
                onChange={e => setSellingPrice(Number(e.target.value))}
                disabled={isPending}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Margin preview */}
          {margin !== null && (
            <div style={{ padding: "8px 12px", backgroundColor: margin >= 20 ? "#ecfdf5" : "#fef9c3", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Profit margin</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: margin >= 20 ? "#059669" : "#ca8a04" }}>
                {margin}%
              </span>
            </div>
          )}

          {/* Stock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Stock Level">
              <input
                type="number"
                min={0}
                value={stockLevel}
                onChange={e => setStockLevel(Number(e.target.value))}
                disabled={isPending}
                style={inputStyle}
              />
            </Field>
            <Field label="Reorder Point">
              <input
                type="number"
                min={0}
                value={reorderPoint}
                onChange={e => setReorderPoint(Number(e.target.value))}
                disabled={isPending}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Expiry date */}
          <Field label="Expiry Date">
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              disabled={isPending}
              style={inputStyle}
            />
          </Field>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Default variant",    sub: "Shown first on product listing", value: isDefault, set: setIsDefault },
              { label: "Active",             sub: "Inactive variants won't appear in sales", value: isActive, set: setIsActive },
            ].map(({ label, sub, value, set }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0" }}>{sub}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set((prev: boolean) => !prev)}
                  style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer", backgroundColor: value ? "#059669" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                >
                  <span style={{ position: "absolute", top: "2px", left: value ? "20px" : "2px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffffff", transition: "left 0.2s" }} />
                </button>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: "13px", color: "#ef4444", margin: 0 }}>{error}</p>
          )}

        </form>

        {/* Footer */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: 500, color: "#6b7280", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#059669", fontSize: "13px", fontWeight: 500, color: "#ffffff", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
          >
            {isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            {isEdit ? "Save Changes" : "Add Variant"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default VariantFormModal