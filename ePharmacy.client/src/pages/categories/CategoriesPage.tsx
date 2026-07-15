import { useState } from "react"
import { Plus, Pencil, Trash2, X, Loader2, Tag } from "lucide-react"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories"
import { Pagination } from "@/components/ui/pagination"
import type { Category, CreateCategoryRequest } from "@/types/category"

const PAGE_SIZE = 10

// ── design tokens ─────────────────────────────────────────────────────────────
const green = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857", 800: "#065f46" }
const gray  = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" }
const red   = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" }

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: `1px solid ${gray[200]}`,
  borderRadius: "8px",
  fontSize: "13px",
  color: gray[900],
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
}

// ── modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  editing: Category | null
  onClose: () => void
}

const CategoryModal = ({ editing, onClose }: ModalProps) => {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const isPending = create.isPending || update.isPending

  const [form, setForm] = useState<CreateCategoryRequest>({
    name:        editing?.name        ?? "",
    description: editing?.description ?? "",
    is_active:   editing?.is_active   ?? true,
  })
  const [error, setError] = useState("")

  const set = (k: keyof CreateCategoryRequest, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required."); return }
    setError("")
    try {
      if (editing) await update.mutateAsync({ id: editing.id, data: form })
      else         await create.mutateAsync(form)
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px", padding: "28px",
        width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>
            {editing ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Antibiotics" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Brief description of this category"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox" id="is_active"
              checked={form.is_active}
              onChange={e => set("is_active", e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: green[600] }}
            />
            <label htmlFor="is_active" style={{ fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>Active</label>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}` }}>
              <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
          >
            {isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            {editing ? "Save Changes" : "Add Category"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── delete confirm modal ──────────────────────────────────────────────────────
interface DeleteModalProps {
  category: Category
  onConfirm: () => void
  onClose: () => void
  isDeleting: boolean
  error: string
}

const DeleteModal = ({ category, onConfirm, onClose, isDeleting, error }: DeleteModalProps) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Delete Category</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 16px 0", lineHeight: 1.6 }}>
        Are you sure you want to delete <strong style={{ color: gray[900] }}>{category.name}</strong>? This action cannot be undone.
      </p>

      {error && (
        <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}`, marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
          Cancel
        </button>
        <button
          onClick={onConfirm} disabled={isDeleting}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: red[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.7 : 1 }}
        >
          {isDeleting && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
          Delete
        </button>
      </div>
    </div>
  </div>
)

// ── page ──────────────────────────────────────────────────────────────────────
const CategoriesPage = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useCategories({ page })
  const categories = data?.results ?? []
  const totalCount = data?.count ?? 0
  const deleteCategory = useDeleteCategory()

  const [modalOpen,    setModalOpen   ] = useState(false)
  const [editing,      setEditing     ] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [isDeleting,   setIsDeleting  ] = useState(false)
  const [deleteError,  setDeleteError ] = useState("")

  const openAdd    = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (c: Category) => { setEditing(c); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }
  const openDelete = (c: Category) => { setDeleteTarget(c); setDeleteError("") }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError("")
    try {
      await deleteCategory.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.detail ?? "Cannot delete this category. It may still have medicines assigned to it."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px" }}>Loading categories…</span>
    </div>
  )

  if (isError) return (
    <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}` }}>
      <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load categories. Check your connection and try again.</p>
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>Categories</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {totalCount} {totalCount === 1 ? "category" : "categories"}
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Tag size={22} color={green[600]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>No categories yet</p>
          <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 20px 0" }}>Add your first category to organise medicines.</p>
          <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={14} /> Add Category
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}`, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: gray[50], borderBottom: `1px solid ${gray[200]}` }}>
                {["Name", "Status", "Description", "Created", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  style={{ borderBottom: i < categories.length - 1 ? `1px solid ${gray[100]}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Tag size={13} color={green[700]} />
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: gray[900] }}>{cat.name}</span>
                    </div>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: cat.is_active ? green[50] : gray[100], color: cat.is_active ? green[700] : gray[500] }}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px", maxWidth: "300px" }}>
                    <span style={{ fontSize: "13px", color: gray[500], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {cat.description || <span style={{ color: gray[400] }}>—</span>}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "12px", color: gray[400] }}>
                      {new Date(cat.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openEdit(cat)} title="Edit"
                        style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = gray[100]; (e.currentTarget as HTMLButtonElement).style.color = gray[700] }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => openDelete(cat)} title="Delete"
                        style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = red[50]; (e.currentTarget as HTMLButtonElement).style.color = red[600] }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />

      {modalOpen && <CategoryModal editing={editing} onClose={closeModal} />}

      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}
    </div>
  )
}

export default CategoriesPage