import { useState } from "react"
import { Plus, Pencil, Trash2, X, Loader2, Pill } from "lucide-react"
import { useMedicines, useCreateMedicine, useUpdateMedicine, useDeleteMedicine, useMedicineDetail } from "@/hooks/useMedicines"
import { useCategories } from "@/hooks/useCategories"
import { useManufacturers } from "@/hooks/useManufacturers"
import type { MedicineListItem, Medicine, CreateMedicineRequest, DosageForm } from "@/types/medicine"

// ── design tokens ─────────────────────────────────────────────────────────────
const green = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857" }
const gray  = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" }
const red   = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" }
const amber = { 50: "#fffbeb", 700: "#b45309" }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${gray[200]}`,
  borderRadius: "8px", fontSize: "13px", color: gray[900], outline: "none",
  boxSizing: "border-box", backgroundColor: "#ffffff",
}

const DOSAGE_FORMS: { value: DosageForm; label: string }[] = [
  { value: "tablet",    label: "Tablet"    },
  { value: "capsule",   label: "Capsule"   },
  { value: "syrup",     label: "Syrup"     },
  { value: "injection", label: "Injection" },
  { value: "cream",     label: "Cream"     },
  { value: "drops",     label: "Drops"     },
  { value: "inhaler",   label: "Inhaler"   },
]

const dosageBadgeColor = (form: DosageForm) => {
  const map: Record<DosageForm, { bg: string; color: string }> = {
    tablet:    { bg: "#eff6ff", color: "#1d4ed8" },
    capsule:   { bg: "#f5f3ff", color: "#6d28d9" },
    syrup:     { bg: "#ecfdf5", color: "#047857" },
    injection: { bg: "#fff1f2", color: "#be123c" },
    cream:     { bg: "#fdf4ff", color: "#7e22ce" },
    drops:     { bg: "#f0f9ff", color: "#0369a1" },
    inhaler:   { bg: "#fff7ed", color: "#c2410c" },
  }
  return map[form] ?? { bg: gray[100], color: gray[500] }
}

// ── medicine modal ────────────────────────────────────────────────────────────
interface ModalProps {
  editing: Medicine | null
  onClose: () => void
}

const MedicineModal = ({ editing, onClose }: ModalProps) => {
  const create = useCreateMedicine()
  const update = useUpdateMedicine()
  const { data: categories = [] } = useCategories()
  const { data: manufacturers = [] } = useManufacturers()
  const isPending = create.isPending || update.isPending

  const [form, setForm] = useState<CreateMedicineRequest>({
    name:                  editing?.name                  ?? "",
    description:           editing?.description           ?? "",
    category:              editing?.category              ?? "",
    manufacturer:          editing?.manufacturer          ?? "",
    requires_prescription: editing?.requires_prescription ?? false,
    dosage_form:           editing?.dosage_form           ?? "tablet",
    strength:              editing?.strength              ?? "",
    is_active:             editing?.is_active             ?? true,
  })
  const [error, setError] = useState("")

  const set = <K extends keyof CreateMedicineRequest>(k: K, v: CreateMedicineRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim())     { setError("Name is required.");         return }
    if (!form.strength.trim()) { setError("Strength is required.");     return }
    if (!form.category)        { setError("Category is required.");     return }
    if (!form.manufacturer)    { setError("Manufacturer is required."); return }
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "540px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>
            {editing ? "Edit Medicine" : "Add Medicine"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Paracetamol" />
          </div>

          {/* Strength */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Strength *</label>
            <input style={inputStyle} value={form.strength} onChange={e => set("strength", e.target.value)} placeholder="e.g. 500mg" />
          </div>

          {/* Dosage form + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Dosage Form *</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.dosage_form} onChange={e => set("dosage_form", e.target.value as DosageForm)}>
                {DOSAGE_FORMS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Category *</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.category} onChange={e => set("category", e.target.value)}>
                <option value="">Select category</option>
                {categories.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Manufacturer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Manufacturer *</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)}>
              <option value="">Select manufacturer</option>
              {manufacturers.filter(m => m.is_active).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Brief description of this medicine"
            />
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="requires_prescription" checked={form.requires_prescription} onChange={e => set("requires_prescription", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: green[600] }} />
              <label htmlFor="requires_prescription" style={{ fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>Requires Prescription</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="med_is_active" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: green[600] }} />
              <label htmlFor="med_is_active" style={{ fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>Active</label>
            </div>
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
            {editing ? "Save Changes" : "Add Medicine"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── delete modal ──────────────────────────────────────────────────────────────
interface DeleteModalProps {
  medicine: MedicineListItem
  onConfirm: () => void
  onClose: () => void
  isDeleting: boolean
  error: string
}

const DeleteModal = ({ medicine, onConfirm, onClose, isDeleting, error }: DeleteModalProps) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Delete Medicine</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 16px 0", lineHeight: 1.6 }}>
        Are you sure you want to delete <strong style={{ color: gray[900] }}>{medicine.name} {medicine.strength}</strong>? This action cannot be undone.
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

// ── edit loading overlay ──────────────────────────────────────────────────────
const EditLoadingModal = () => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px 40px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <Loader2 size={18} color={green[600]} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px", color: gray[700] }}>Loading medicine…</span>
    </div>
  </div>
)

// ── page ──────────────────────────────────────────────────────────────────────
const MedicinesPage = () => {
  const { data: medicines = [], isLoading, isError } = useMedicines()
  const deleteMedicine = useDeleteMedicine()

  // prefetch for modal dropdowns
  useCategories()
  useManufacturers()

  const [modalOpen,    setModalOpen   ] = useState(false)
  const [editingId,    setEditingId   ] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MedicineListItem | null>(null)
  const [isDeleting,   setIsDeleting  ] = useState(false)
  const [deleteError,  setDeleteError ] = useState("")

  // fetch detail only when editing
  const { data: medicineDetail, isLoading: isLoadingDetail } = useMedicineDetail(editingId)

  const openAdd = () => { setEditingId(null); setModalOpen(true) }

  const openEdit = (id: string) => {
    setEditingId(id)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditingId(null) }

  const openDelete = (m: MedicineListItem) => { setDeleteTarget(m); setDeleteError("") }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError("")
    try {
      await deleteMedicine.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.detail ?? "Cannot delete this medicine. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px" }}>Loading medicines…</span>
    </div>
  )

  if (isError) return (
    <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}` }}>
      <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load medicines. Check your connection and try again.</p>
    </div>
  )

  // show loading overlay while fetching detail for edit
  const showEditLoader = modalOpen && !!editingId && isLoadingDetail

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>Medicines</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          <Plus size={14} /> Add Medicine
        </button>
      </div>

      {/* Empty state */}
      {medicines.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Pill size={22} color={green[600]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>No medicines yet</p>
          <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 20px 0" }}>Add your first medicine to get started.</p>
          <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}`, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: gray[50], borderBottom: `1px solid ${gray[200]}` }}>
                {["Medicine", "Dosage Form", "Category", "Manufacturer", "Rx", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, i) => {
                const badge = dosageBadgeColor(med.dosage_form)
                return (
                  <tr
                    key={med.id}
                    style={{ borderBottom: i < medicines.length - 1 ? `1px solid ${gray[100]}` : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Name + strength */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Pill size={14} color={green[700]} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: gray[900], margin: 0 }}>{med.name}</p>
                          <p style={{ fontSize: "11px", color: gray[400], margin: 0 }}>{med.strength}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dosage form */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: badge.bg, color: badge.color }}>
                        {med.dosage_form_display}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", color: gray[500] }}>{med.category_name}</span>
                    </td>

                    {/* Manufacturer */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", color: gray[500] }}>{med.manufacturer_name}</span>
                    </td>

                    {/* Rx */}
                    <td style={{ padding: "12px 16px" }}>
                      {med.requires_prescription
                        ? <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", backgroundColor: amber[50], color: amber[700] }}>Rx</span>
                        : <span style={{ fontSize: "12px", color: gray[400] }}>OTC</span>
                      }
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: med.is_active ? green[50] : gray[100], color: med.is_active ? green[700] : gray[500] }}>
                        {med.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => openEdit(med.id)} title="Edit"
                          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = gray[100]; (e.currentTarget as HTMLButtonElement).style.color = gray[700] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => openDelete(med)} title="Delete"
                          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = red[50]; (e.currentTarget as HTMLButtonElement).style.color = red[600] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit loading overlay — shown while fetching detail */}
      {showEditLoader && <EditLoadingModal />}

      {/* Add / Edit modal — only shown once detail is ready (or adding new) */}
      {modalOpen && !showEditLoader && (
        <MedicineModal
          editing={editingId ? (medicineDetail ?? null) : null}
          onClose={closeModal}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          medicine={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}
    </div>
  )
}

export default MedicinesPage