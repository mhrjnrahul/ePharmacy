import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createProduct, updateProduct, fetchCategories } from "@/api/products"
import { X, Loader2 } from "lucide-react"
import type { Product } from "@/types"

interface Props {
  product?: Product
  onClose: () => void
}

const ProductFormModal = ({ product, onClose }: Props) => {
  const queryClient = useQueryClient()
  const isEdit = !!product

  const [name, setName]               = useState(product?.name ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [isActive, setIsActive]       = useState(product?.is_active ?? true)
  const [categoryIds, setCategoryIds] = useState<number[]>(product?.categories.map(c => c.id) ?? [])
  const [error, setError]             = useState("")

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof createProduct>[0]) =>
      isEdit ? updateProduct(product!.id, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      onClose()
    },
    onError: () => setError("Something went wrong. Please try again."),
  })

  const toggleCategory = (id: number) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name.trim()) { setError("Medicine name is required."); return }
    if (categoryIds.length === 0) { setError("Select at least one category."); return }
    mutate({ name: name.trim(), description: description.trim(), is_active: isActive, category_ids: categoryIds })
  }

  // close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      onClick={handleBackdrop}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}
    >
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
              {isEdit ? "Edit Medicine" : "Add Medicine"}
            </h2>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>
              {isEdit ? `Editing ${product!.name}` : "Add a new medicine to inventory"}
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
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
              Medicine Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Paracetamol"
              disabled={isPending}
              style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#111827", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the medicine..."
              disabled={isPending}
              rows={3}
              style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#111827", outline: "none", resize: "vertical", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* Categories */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
              Categories <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {categories?.map(c => {
                const selected = categoryIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
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
                    {c.name}
                  </button>
                )
              })}
            </div>
            {categoryIds.length > 0 && (
              <p style={{ fontSize: "11px", color: "#059669", margin: 0 }}>
                {categoryIds.length} selected
              </p>
            )}
          </div>

          {/* Status toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151", margin: 0 }}>Active</p>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0 0" }}>
                Inactive medicines won't appear in sales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(prev => !prev)}
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                border: "none",
                cursor: "pointer",
                backgroundColor: isActive ? "#059669" : "#d1d5db",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: isActive ? "20px" : "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  transition: "left 0.2s",
                }}
              />
            </button>
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
            {isEdit ? "Save Changes" : "Add Medicine"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ProductFormModal