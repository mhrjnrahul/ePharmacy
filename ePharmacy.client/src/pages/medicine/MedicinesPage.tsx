import { useState, useEffect, useRef } from "react"
import { Plus, Pencil, Trash2, X, Loader2, Pill, Search, Filter, Upload, RefreshCcw, Link2 } from "lucide-react"
import {
  useMedicines, useCreateMedicine, useUpdateMedicine, useDeleteMedicine, useMedicineDetail,
  useRebuildRecommendations, useAllMedicines,
} from "@/hooks/useMedicines"
import { useAllCategories } from "@/hooks/useCategories"
import { useAllManufacturers } from "@/hooks/useManufacturers"
import { useMedicineRelations, useCreateRelation, useUpdateRelation, useDeleteRelation } from "@/hooks/useRelations"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/store/toastStore"
import { mediaUrl } from "@/lib/apiUrl"
import type { MedicineListItem, Medicine, CreateMedicineRequest, DosageForm, MedicineListParams } from "@/types/medicine"
import type { RelationType, MedicineRelation } from "@/types/relation"
import { gray, green, red, amber, adminInputStyle as inputStyle } from "@/lib/adminTokens"

const PAGE_SIZE = 10

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
  const { data: categories = [] } = useAllCategories()
  const { data: manufacturers = [] } = useAllManufacturers()
  const isPending = create.isPending || update.isPending
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<CreateMedicineRequest>({
    name:                  editing?.name                  ?? "",
    description:           editing?.description           ?? "",
    category:              editing?.category              ?? "",
    manufacturer:          editing?.manufacturer          ?? "",
    requires_prescription: editing?.requires_prescription ?? false,
    dosage_form:           editing?.dosage_form           ?? "tablet",
    strength:              editing?.strength              ?? "",
    composition:           editing?.composition           ?? "",
    is_active:             editing?.is_active             ?? true,
    image:                 null,
  })
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(mediaUrl(editing?.image))

  useEffect(() => {
    if (!form.image) return
    const objectUrl = URL.createObjectURL(form.image)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [form.image])

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

          {/* Image */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Photo</label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "10px", backgroundColor: gray[50], border: `1px solid ${gray[200]}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {previewUrl
                  ? <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Pill size={20} color={gray[400]} />}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => set("image", e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "12px", fontWeight: 500, color: gray[700], cursor: "pointer" }}
              >
                <Upload size={13} /> {previewUrl ? "Change photo" : "Upload photo"}
              </button>
            </div>
          </div>

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

          {/* Composition */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Composition</label>
            <input style={inputStyle} value={form.composition} onChange={e => set("composition", e.target.value)} placeholder="e.g. Paracetamol (comma-separated for multiple ingredients)" />
            <p style={{ fontSize: "11px", color: gray[400], margin: 0, lineHeight: 1.5 }}>
              Drives the substitute/recommendation engine — medicines sharing an active ingredient are
              suggested to customers when this one is out of stock. Use the same spelling consistently
              across medicines (e.g. always "Paracetamol", not "Acetaminophen" on one and "Paracetamol" on another).
            </p>
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

// ── deactivate modal ──────────────────────────────────────────────────────────
interface DeactivateModalProps {
  medicine: MedicineListItem
  onConfirm: () => void
  onClose: () => void
  isDeleting: boolean
  error: string
}

const DeactivateModal = ({ medicine, onConfirm, onClose, isDeleting, error }: DeactivateModalProps) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Deactivate Medicine</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 16px 0", lineHeight: 1.6 }}>
        Are you sure you want to deactivate <strong style={{ color: gray[900] }}>{medicine.name} {medicine.strength}</strong>?
        It will be hidden from the customer shop but kept in the catalog — you can reactivate it later
        by editing it and checking "Active" again.
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
          Deactivate
        </button>
      </div>
    </div>
  </div>
)

// ── relations modal ───────────────────────────────────────────────────────────
const RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: "side_effect_companion",      label: "Side effect companion"      },
  { value: "frequently_bought_together", label: "Frequently bought together" },
]

const RelationsModal = ({ medicine, onClose }: { medicine: MedicineListItem; onClose: () => void }) => {
  const { data: relations = [], isLoading } = useMedicineRelations(medicine.id)
  const { data: allMedicines = [] } = useAllMedicines()
  const createRelation = useCreateRelation(medicine.id)
  const updateRelation = useUpdateRelation(medicine.id)
  const deleteRelation = useDeleteRelation(medicine.id)

  const [toMedicine, setToMedicine] = useState("")
  const [relationType, setRelationType] = useState<RelationType>("frequently_bought_together")
  const [weight, setWeight] = useState(1)
  const [error, setError] = useState("")

  const candidateMedicines = allMedicines.filter(m => m.id !== medicine.id)

  const handleAdd = async () => {
    if (!toMedicine) { setError("Pick a medicine."); return }
    setError("")
    try {
      // from_medicine is required by the serializer's own validation even
      // though the backend also injects it from the URL on save.
      await createRelation.mutateAsync({ from_medicine: medicine.id, to_medicine: toMedicine, relation_type: relationType, weight })
      setToMedicine("")
      setWeight(1)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.response?.data?.non_field_errors?.[0] ?? "Could not add this relation.")
    }
  }

  const handleWeightChange = async (rel: MedicineRelation, newWeight: number) => {
    try {
      // A partial PATCH with only {weight} 500s server-side (the serializer's
      // validate() unconditionally compares from_medicine/to_medicine), so
      // this sends the full record instead.
      await updateRelation.mutateAsync({
        id: rel.id,
        data: { from_medicine: rel.from_medicine, to_medicine: rel.to_medicine, relation_type: rel.relation_type, weight: newWeight },
      })
    } catch {
      toast.error("Could not save that weight. Please try again.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRelation.mutateAsync(id)
    } catch {
      toast.error("Could not remove that relation. Please try again.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>
            Relations for {medicine.name} {medicine.strength}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: "12px", color: gray[400], margin: "0 0 20px 0", lineHeight: 1.5 }}>
          Feeds the recommendation engine directly — "frequently bought together" pairs are usually
          rebuilt automatically from order history, but you can seed or correct one here. "Side effect
          companion" is always set manually (e.g. omeprazole alongside ibuprofen).
        </p>

        {/* Existing relations */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: gray[400], fontSize: "13px", padding: "12px 0" }}>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
          </div>
        ) : relations.length === 0 ? (
          <p style={{ fontSize: "13px", color: gray[400], margin: "0 0 16px 0" }}>No relations recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {relations.map(rel => (
              <div key={rel.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", backgroundColor: gray[50], borderRadius: "8px", border: `1px solid ${gray[200]}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: gray[900], margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    → {rel.to_medicine_name}
                  </p>
                  <p style={{ fontSize: "11px", color: gray[400], margin: 0 }}>
                    {RELATION_TYPES.find(t => t.value === rel.relation_type)?.label ?? rel.relation_type}
                  </p>
                </div>
                <input
                  // Keying on the server-persisted weight forces this
                  // uncontrolled input to remount (and pick up the new
                  // defaultValue) whenever the list refetches with a
                  // different value — otherwise a failed/concurrent update
                  // would leave it silently showing stale local input.
                  key={`${rel.id}-${rel.weight}`}
                  type="number" min={0} max={1} step={0.05}
                  defaultValue={rel.weight}
                  onBlur={e => {
                    const v = Math.max(0, Math.min(1, Number(e.target.value) || 0))
                    if (v !== rel.weight) handleWeightChange(rel, v)
                  }}
                  title="Weight (0.0 – 1.0)"
                  style={{ width: "64px", padding: "5px 8px", border: `1px solid ${gray[200]}`, borderRadius: "6px", fontSize: "12px", color: gray[900] }}
                />
                <button
                  onClick={() => handleDelete(rel.id)}
                  disabled={deleteRelation.isPending}
                  title="Remove relation"
                  style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new relation */}
        <div style={{ borderTop: `1px solid ${gray[200]}`, paddingTop: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: gray[700], margin: "0 0 10px 0" }}>Add relation</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select style={{ ...inputStyle, flex: "1 1 200px", cursor: "pointer" }} value={toMedicine} onChange={e => setToMedicine(e.target.value)}>
              <option value="">Select medicine…</option>
              {candidateMedicines.map(m => <option key={m.id} value={m.id}>{m.name} — {m.strength}</option>)}
            </select>
            <select style={{ ...inputStyle, flex: "1 1 180px", cursor: "pointer" }} value={relationType} onChange={e => setRelationType(e.target.value as RelationType)}>
              {RELATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              type="number" min={0} max={1} step={0.05}
              style={{ ...inputStyle, width: "72px" }}
              value={weight}
              onChange={e => setWeight(Math.max(0, Math.min(1, Number(e.target.value) || 0)))}
              title="Weight (0.0 – 1.0)"
            />
            <button
              onClick={handleAdd}
              disabled={createRelation.isPending}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: createRelation.isPending ? "not-allowed" : "pointer", opacity: createRelation.isPending ? 0.7 : 1 }}
            >
              {createRelation.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              Add
            </button>
          </div>
          {error && (
            <p style={{ fontSize: "12px", color: red[700], margin: "10px 0 0 0" }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── edit loading overlay ──────────────────────────────────────────────────────
const EditLoadingModal = ({ onCancel }: { onCancel: () => void }) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Loader2 size={18} color={green[600]} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "14px", color: gray[700] }}>Loading medicine…</span>
      </div>
      <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], fontSize: "12px" }}>
        Cancel
      </button>
    </div>
  </div>
)

// ── edit error overlay ────────────────────────────────────────────────────────
const EditErrorModal = ({ onClose }: { onClose: () => void }) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "360px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
      <p style={{ fontSize: "14px", color: red[700], margin: "0 0 16px 0" }}>
        Couldn't load this medicine's details. Check your connection and try again.
      </p>
      <button
        onClick={onClose}
        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
      >
        Close
      </button>
    </div>
  </div>
)

// ── page ──────────────────────────────────────────────────────────────────────
const MedicinesPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [manufacturerFilter, setManufacturerFilter] = useState("")
  const [dosageFilter, setDosageFilter] = useState<DosageForm | "">("")
  const [rxFilter, setRxFilter] = useState<"all" | "rx" | "otc">("all")

  const { data: categories = [] } = useAllCategories()
  const { data: manufacturers = [] } = useAllManufacturers()

  const params: MedicineListParams = {
    ...(search ? { search } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(manufacturerFilter ? { manufacturer: manufacturerFilter } : {}),
    ...(dosageFilter ? { dosage_form: dosageFilter } : {}),
    ...(rxFilter !== "all" ? { requires_prescription: rxFilter === "rx" } : {}),
    page,
  }
  const { data, isLoading, isError, refetch } = useMedicines(params)
  const medicines = data?.results ?? []
  const totalCount = data?.count ?? 0
  const deleteMedicine = useDeleteMedicine()
  const rebuild = useRebuildRecommendations()

  const hasFilters = !!(search || categoryFilter || manufacturerFilter || dosageFilter || rxFilter !== "all")

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, manufacturerFilter, dosageFilter, rxFilter])

  const [modalOpen,      setModalOpen     ] = useState(false)
  const [editingId,      setEditingId     ] = useState<string | null>(null)
  const [deleteTarget,   setDeleteTarget  ] = useState<MedicineListItem | null>(null)
  const [isDeleting,     setIsDeleting    ] = useState(false)
  const [deleteError,    setDeleteError   ] = useState("")
  const [relationsTarget, setRelationsTarget] = useState<MedicineListItem | null>(null)

  // fetch detail only when editing
  const { data: medicineDetail, isLoading: isLoadingDetail, isError: isDetailError } = useMedicineDetail(editingId)

  const openAdd = () => { setEditingId(null); setModalOpen(true) }

  const openEdit = (id: string) => {
    setEditingId(id)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditingId(null) }

  const openDelete = (m: MedicineListItem) => { setDeleteTarget(m); setDeleteError("") }

  const clearFilters = () => {
    setSearch(""); setCategoryFilter(""); setManufacturerFilter(""); setDosageFilter(""); setRxFilter("all")
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError("")
    try {
      await deleteMedicine.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.detail ?? "Cannot deactivate this medicine. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRebuild = async () => {
    try {
      const result = await rebuild.mutateAsync()
      toast.success(
        `Recommendation weights rebuilt from order history — ${result.created} created, ${result.updated} updated.`,
      )
    } catch {
      toast.error("Could not rebuild recommendations.")
    }
  }

  if (isError) return (
    <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load medicines. Check your connection and try again.</p>
      <button
        onClick={() => refetch()}
        style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${red[100]}`, backgroundColor: "#fff", fontSize: "12px", fontWeight: 600, color: red[700], cursor: "pointer" }}
      >
        Retry
      </button>
    </div>
  )

  // show loading overlay while fetching detail for edit
  const showEditLoader = modalOpen && !!editingId && isLoadingDetail
  const showEditError = modalOpen && !!editingId && isDetailError

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>Medicines</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {totalCount} {totalCount === 1 ? "medicine" : "medicines"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleRebuild}
            disabled={rebuild.isPending}
            title="Recompute 'frequently bought together' from the latest order history"
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 14px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: rebuild.isPending ? "not-allowed" : "pointer", opacity: rebuild.isPending ? 0.7 : 1 }}
          >
            {rebuild.isPending
              ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              : <RefreshCcw size={14} />}
            Rebuild recommendations
          </button>
          <button
            onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: "220px", maxWidth: "100%" }}>
          <Search size={14} color={gray[400]} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            style={{ ...inputStyle, paddingLeft: "30px" }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines…"
          />
        </div>
        <Filter size={14} color={gray[400]} />
        <select style={{ ...inputStyle, width: "160px", maxWidth: "100%", cursor: "pointer" }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "170px", maxWidth: "100%", cursor: "pointer" }} value={manufacturerFilter} onChange={e => setManufacturerFilter(e.target.value)}>
          <option value="">All manufacturers</option>
          {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "140px", maxWidth: "100%", cursor: "pointer" }} value={dosageFilter} onChange={e => setDosageFilter(e.target.value as DosageForm | "")}>
          <option value="">All forms</option>
          {DOSAGE_FORMS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select style={{ ...inputStyle, width: "120px", maxWidth: "100%", cursor: "pointer" }} value={rxFilter} onChange={e => setRxFilter(e.target.value as "all" | "rx" | "otc")}>
          <option value="all">Rx & OTC</option>
          <option value="rx">Rx only</option>
          <option value="otc">OTC only</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{ fontSize: "12px", color: gray[500], background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "14px" }}>Loading medicines…</span>
        </div>
      ) : medicines.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Pill size={22} color={green[600]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>
            {hasFilters ? "No medicines match your filters" : "No medicines yet"}
          </p>
          <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 20px 0" }}>
            {hasFilters ? "Try clearing a filter or searching for something else." : "Add your first medicine to get started."}
          </p>
          {hasFilters
            ? <button onClick={clearFilters} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 600, color: gray[700], cursor: "pointer" }}>Clear filters</button>
            : <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                <Plus size={14} /> Add Medicine
              </button>}
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
                const imgUrl = mediaUrl(med.image)
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
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {imgUrl
                            ? <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <Pill size={14} color={green[700]} />}
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
                          onClick={() => setRelationsTarget(med)} title="Manage relations"
                          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = gray[100]; (e.currentTarget as HTMLButtonElement).style.color = gray[700] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                        >
                          <Link2 size={14} />
                        </button>
                        <button
                          onClick={() => openDelete(med)} title="Deactivate"
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

      <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />

      {/* Edit loading overlay — shown while fetching detail */}
      {showEditLoader && <EditLoadingModal onCancel={closeModal} />}

      {/* Edit error overlay — shown if the detail fetch failed, instead of
          silently falling through to a blank "Add Medicine" form */}
      {showEditError && <EditErrorModal onClose={closeModal} />}

      {/* Add / Edit modal — only shown once detail is ready (or adding new) */}
      {modalOpen && !showEditLoader && !showEditError && (
        <MedicineModal
          editing={editingId ? (medicineDetail ?? null) : null}
          onClose={closeModal}
        />
      )}

      {/* Deactivate confirm modal */}
      {deleteTarget && (
        <DeactivateModal
          medicine={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}

      {/* Relations modal */}
      {relationsTarget && (
        <RelationsModal medicine={relationsTarget} onClose={() => setRelationsTarget(null)} />
      )}
    </div>
  )
}

export default MedicinesPage
