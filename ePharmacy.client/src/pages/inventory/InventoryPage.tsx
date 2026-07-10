import { useState } from "react"
import {
  Plus, Pencil, X, Loader2, Package, AlertTriangle,
  Clock, ArrowUpDown, Filter, Eye,
  TrendingUp, TrendingDown, RotateCcw, Wrench, Trash2,
} from "lucide-react"
import {
  useBatches, useCreateBatch, useUpdateBatch,
  useStockAdjust, useBatchMovements, useInventorySummary,
} from "@/hooks/useInventory"
import { useMedicines } from "@/hooks/useMedicines"
import type { BatchList, CreateBatchRequest, UpdateBatchRequest, StockAdjustRequest, MovementType } from "@/types/inventory"

// ── tokens ────────────────────────────────────────────────────────────────────
const green = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857" }
const gray  = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" }
const red   = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" }
const amber = { 50: "#fffbeb", 100: "#fef3c7", 600: "#d97706", 700: "#b45309" }
const blue  = { 50: "#eff6ff", 100: "#dbeafe", 600: "#2563eb", 700: "#1d4ed8" }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${gray[200]}`,
  borderRadius: "8px", fontSize: "13px", color: gray[900], outline: "none",
  boxSizing: "border-box", backgroundColor: "#ffffff",
}

// ── movement meta ─────────────────────────────────────────────────────────────
const movementMeta: Record<MovementType, { icon: React.ReactNode; color: string; bg: string }> = {
  purchase_in:  { icon: <TrendingUp size={13} />,  color: green[700], bg: green[50]  },
  sale_out:     { icon: <TrendingDown size={13} />, color: red[700],   bg: red[50]    },
  return_in:    { icon: <RotateCcw size={13} />,    color: blue[700],  bg: blue[50]   },
  adjustment:   { icon: <Wrench size={13} />,       color: amber[700], bg: amber[50]  },
  expired_out:  { icon: <Trash2 size={13} />,       color: gray[500],  bg: gray[100]  },
}

// ── summary cards ─────────────────────────────────────────────────────────────
const SummaryCards = () => {
  const { data, isLoading } = useInventorySummary()

  const cards = [
    { label: "Active Batches",   value: data?.total_active_batches  ?? "—", icon: <Package size={18} color={green[600]} />,  bg: green[50], iconBg: green[100] },
    { label: "Low Stock",        value: data?.low_stock_count        ?? "—", icon: <AlertTriangle size={18} color={amber[600]} />, bg: amber[50], iconBg: amber[100] },
    { label: "Expiring Soon",    value: data?.expiring_soon_count    ?? "—", icon: <Clock size={18} color={blue[600]} />,     bg: blue[50],  iconBg: blue[100]  },
    { label: "Expired (Active)", value: data?.expired_active_count   ?? "—", icon: <AlertTriangle size={18} color={red[600]} />,  bg: red[50],   iconBg: red[100]   },
  ]

  const summaryStyle = (
    <style>{`
      .inventory-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
      @media (max-width: 900px) { .inventory-summary-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 480px) { .inventory-summary-grid { grid-template-columns: 1fr; } }
    `}</style>
  )

  if (isLoading) return (
    <>
      {summaryStyle}
      <div className="inventory-summary-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: "80px", backgroundColor: gray[100], borderRadius: "12px" }} />
        ))}
      </div>
    </>
  )

  return (
    <>
      {summaryStyle}
      <div className="inventory-summary-grid">
      {cards.map(card => (
        <div key={card.label} style={{ backgroundColor: card.bg, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {card.icon}
          </div>
          <div>
            <p style={{ fontSize: "22px", fontWeight: 700, color: gray[900], margin: 0, lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: "12px", color: gray[500], margin: "4px 0 0 0" }}>{card.label}</p>
          </div>
        </div>
      ))}
      </div>
    </>
  )
}

// ── add batch modal ───────────────────────────────────────────────────────────
interface AddBatchModalProps {
  onClose: () => void
  medicines: { id: string; name: string; strength: string; dosage_form_display: string; is_active: boolean }[]
}

const AddBatchModal = ({ onClose, medicines }: AddBatchModalProps) => {
  const createBatch = useCreateBatch()

  const [form, setForm] = useState<CreateBatchRequest>({
    medicine: "", batch_number: "", expiry_date: "",
    purchase_price: "", selling_price: "", is_active: true, initial_quantity: 1,
  })
  const [error, setError] = useState("")

  const set = <K extends keyof CreateBatchRequest>(k: K, v: CreateBatchRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.medicine)            { setError("Medicine is required.");       return }
    if (!form.batch_number.trim()) { setError("Batch number is required.");   return }
    if (!form.expiry_date)         { setError("Expiry date is required.");    return }
    if (!form.purchase_price)      { setError("Purchase price is required."); return }
    if (!form.selling_price)       { setError("Selling price is required.");  return }
    if (form.initial_quantity < 1) { setError("Quantity must be at least 1.");return }
    setError("")
    try {
      await createBatch.mutateAsync(form)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "540px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Add Stock Batch</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Medicine *</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.medicine} onChange={e => set("medicine", e.target.value)}>
              <option value="">Select medicine</option>
              {medicines.filter(m => m.is_active).map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.strength} ({m.dosage_form_display})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Batch Number *</label>
            <input style={inputStyle} value={form.batch_number} onChange={e => set("batch_number", e.target.value)} placeholder="e.g. BATCH-2026-001" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Expiry Date *</label>
              <input type="date" style={inputStyle} value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Initial Quantity *</label>
              <input type="number" min={1} style={inputStyle} value={form.initial_quantity} onChange={e => set("initial_quantity", Number(e.target.value))} placeholder="e.g. 100" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Purchase Price (Rs.) *</label>
              <input type="number" min={0} step="0.01" style={inputStyle} value={form.purchase_price} onChange={e => set("purchase_price", e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Selling Price (Rs.) *</label>
              <input type="number" min={0} step="0.01" style={inputStyle} value={form.selling_price} onChange={e => set("selling_price", e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" id="batch_active" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: green[600] }} />
            <label htmlFor="batch_active" style={{ fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>Active</label>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}` }}>
              <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={createBatch.isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: createBatch.isPending ? "not-allowed" : "pointer", opacity: createBatch.isPending ? 0.7 : 1 }}
          >
            {createBatch.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Add Batch
          </button>
        </div>
      </div>
    </div>
  )
}

// ── edit batch modal ──────────────────────────────────────────────────────────
interface EditBatchModalProps {
  batch: BatchList
  medicineName: string
  onClose: () => void
}

const EditBatchModal = ({ batch, medicineName, onClose }: EditBatchModalProps) => {
  const updateBatch = useUpdateBatch()
  const [form, setForm] = useState<UpdateBatchRequest>({
    selling_price: batch.selling_price,
    is_active: batch.is_active,
  })
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!form.selling_price) { setError("Selling price is required."); return }
    setError("")
    try {
      await updateBatch.mutateAsync({ id: batch.id, data: form })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Edit Batch</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "12px", color: gray[400], margin: "0 0 20px 0" }}>
          {medicineName} · {batch.batch_number}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Selling Price (Rs.) *</label>
            <input
              type="number" min={0} step="0.01" style={inputStyle}
              value={form.selling_price}
              onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox" id="edit_batch_active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: green[600] }}
            />
            <label htmlFor="edit_batch_active" style={{ fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>Active</label>
          </div>

          <div style={{ padding: "12px", backgroundColor: amber[50], borderRadius: "8px", border: `1px solid ${amber[100]}` }}>
            <p style={{ fontSize: "12px", color: amber[700], margin: 0 }}>
              Only selling price and active status can be edited. Batch number, medicine, expiry date, and purchase price are permanent records.
            </p>
          </div>

          {error && (
            <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}` }}>
              <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={updateBatch.isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: updateBatch.isPending ? "not-allowed" : "pointer", opacity: updateBatch.isPending ? 0.7 : 1 }}
          >
            {updateBatch.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── adjust stock modal ────────────────────────────────────────────────────────
interface AdjustModalProps {
  batch: BatchList
  medicineName: string
  onClose: () => void
}

const AdjustModal = ({ batch, medicineName, onClose }: AdjustModalProps) => {
  const adjust = useStockAdjust()
  const [form, setForm] = useState<Omit<StockAdjustRequest, "batch">>({
    quantity: 1, direction: "in", notes: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (form.quantity < 1)    { setError("Quantity must be at least 1."); return }
    if (!form.notes.trim())   { setError("Reason/notes are required.");   return }
    setError("")
    try {
      await adjust.mutateAsync({ batch: batch.id, ...form })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Adjust Stock</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "12px", color: gray[400], margin: "0 0 20px 0" }}>
          {medicineName} · {batch.batch_number} · Current stock: <strong style={{ color: gray[700] }}>{batch.quantity_available}</strong>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Direction *</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["in", "out"] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => setForm(f => ({ ...f, direction: dir }))}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px", border: "2px solid",
                    borderColor: form.direction === dir ? (dir === "in" ? green[600] : red[600]) : gray[200],
                    backgroundColor: form.direction === dir ? (dir === "in" ? green[50] : red[50]) : "#fff",
                    color: form.direction === dir ? (dir === "in" ? green[700] : red[700]) : gray[500],
                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  {dir === "in" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  Stock {dir === "in" ? "In" : "Out"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Quantity *</label>
            <input type="number" min={1} style={inputStyle} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Reason / Notes *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Damaged during delivery, recount correction..."
            />
          </div>

          {error && (
            <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}` }}>
              <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={adjust.isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: adjust.isPending ? "not-allowed" : "pointer", opacity: adjust.isPending ? 0.7 : 1 }}
          >
            {adjust.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Apply Adjustment
          </button>
        </div>
      </div>
    </div>
  )
}

// ── movements drawer ──────────────────────────────────────────────────────────
interface MovementsDrawerProps {
  batch: BatchList
  medicineName: string
  onClose: () => void
}

const MovementsDrawer = ({ batch, medicineName, onClose }: MovementsDrawerProps) => {
  const { data: movements = [], isLoading } = useBatchMovements(batch.id)

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", backgroundColor: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${gray[200]}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Stock Movements</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
              <X size={18} />
            </button>
          </div>
          <p style={{ fontSize: "12px", color: gray[400], margin: 0 }}>
            {medicineName} · {batch.batch_number} · Current stock: <strong style={{ color: gray[700] }}>{batch.quantity_available}</strong>
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[400] }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "13px" }}>Loading movements…</span>
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: gray[400] }}>
              <ArrowUpDown size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
              <p style={{ fontSize: "13px", margin: 0 }}>No movements recorded yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {movements.map(m => {
                const meta = movementMeta[m.movement_type]
                return (
                  <div key={m.id} style={{ backgroundColor: gray[50], borderRadius: "10px", padding: "12px 14px", border: `1px solid ${gray[200]}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0 }}>
                          {meta.icon}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: meta.color }}>{m.movement_type_display}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: gray[900], margin: 0 }}>
                          {m.quantity_after < m.quantity_before ? "−" : "+"}{m.quantity}
                        </p>
                        <p style={{ fontSize: "11px", color: gray[400], margin: 0 }}>{m.quantity_before} → {m.quantity_after}</p>
                      </div>
                    </div>
                    {(m.reference || m.notes) && (
                      <p style={{ fontSize: "12px", color: gray[500], margin: "0 0 4px 0" }}>
                        {m.reference || m.notes}
                      </p>
                    )}
                    <p style={{ fontSize: "11px", color: gray[400], margin: 0 }}>
                      {m.performed_by_email || "System"} · {new Date(m.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
const InventoryPage = () => {
  const [filterMedicine, setFilterMedicine] = useState("")
  const [filterActive,   setFilterActive  ] = useState<"all" | "active" | "inactive">("all")

  const params = {
    ...(filterMedicine ? { medicine: filterMedicine } : {}),
    ...(filterActive === "active" ? { is_active: true } : filterActive === "inactive" ? { is_active: false } : {}),
  }

  const { data: batches = [], isLoading, isError } = useBatches(params)
  const { data: medicines = [] } = useMedicines()

  const [addOpen,     setAddOpen    ] = useState(false)
  const [editBatch,   setEditBatch  ] = useState<BatchList | null>(null)
  const [adjustBatch, setAdjustBatch] = useState<BatchList | null>(null)
  const [viewBatch,   setViewBatch  ] = useState<BatchList | null>(null)

  // look up medicine name from the medicines list using UUID
  const getMedicineName = (id: string) =>
    medicines.find(m => m.id === id)?.name ?? "Unknown Medicine"

  const stockColor = (qty: number) => {
    if (qty === 0) return { color: red[700],   bg: red[50]   }
    if (qty < 10)  return { color: amber[700],  bg: amber[50] }
    return             { color: green[700],  bg: green[50] }
  }

  if (isLoading) return (
    <div>
      <SummaryCards />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading batches…</span>
      </div>
    </div>
  )

  if (isError) return (
    <div>
      <SummaryCards />
      <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}` }}>
        <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load batches. Check your connection and try again.</p>
      </div>
    </div>
  )

  return (
    <div>
      <SummaryCards />

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>Inventory</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {batches.length} {batches.length === 1 ? "batch" : "batches"}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          <Plus size={14} /> Add Batch
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <Filter size={14} color={gray[400]} />
        <select
          style={{ ...inputStyle, width: "240px", maxWidth: "100%", cursor: "pointer" }}
          value={filterMedicine}
          onChange={e => setFilterMedicine(e.target.value)}
        >
          <option value="">All medicines</option>
          {medicines.map(m => (
            <option key={m.id} value={m.id}>{m.name} — {m.strength}</option>
          ))}
        </select>
        <select
          style={{ ...inputStyle, width: "140px", maxWidth: "100%", cursor: "pointer" }}
          value={filterActive}
          onChange={e => setFilterActive(e.target.value as "all" | "active" | "inactive")}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        {(filterMedicine || filterActive !== "all") && (
          <button
            onClick={() => { setFilterMedicine(""); setFilterActive("all") }}
            style={{ fontSize: "12px", color: gray[500], background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Empty state */}
      {batches.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Package size={22} color={green[600]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>No batches found</p>
          <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 20px 0" }}>
            {filterMedicine || filterActive !== "all"
              ? "No batches match your current filters."
              : "Add a stock batch to start tracking inventory."}
          </p>
          {!filterMedicine && filterActive === "all" && (
            <button onClick={() => setAddOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
              <Plus size={14} /> Add Batch
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}`, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "820px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: gray[50], borderBottom: `1px solid ${gray[200]}` }}>
                {["Medicine", "Batch No.", "Expiry", "Stock", "Selling Price", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, i) => {
                const stock = stockColor(batch.quantity_available)
                const medicineName = getMedicineName(batch.medicine)
                return (
                  <tr
                    key={batch.id}
                    style={{ borderBottom: i < batches.length - 1 ? `1px solid ${gray[100]}` : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Medicine */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: green[50], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Package size={13} color={green[700]} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: gray[900] }}>{medicineName}</span>
                      </div>
                    </td>

                    {/* Batch number */}
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontSize: "12px", color: gray[500], backgroundColor: gray[100], padding: "2px 7px", borderRadius: "4px" }}>
                        {batch.batch_number}
                      </code>
                    </td>

                    {/* Expiry */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: batch.is_expired ? red[600] : gray[500], fontWeight: batch.is_expired ? 600 : 400 }}>
                        {batch.is_expired && "⚠ "}
                        {new Date(batch.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: stock.bg, color: stock.color }}>
                        {batch.quantity_available} units
                      </span>
                    </td>

                    {/* Selling price */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", color: gray[700], fontWeight: 500 }}>Rs. {batch.selling_price}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", backgroundColor: batch.is_active ? green[50] : gray[100], color: batch.is_active ? green[700] : gray[500] }}>
                        {batch.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setViewBatch(batch)} title="View movements"
                          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = blue[50]; (e.currentTarget as HTMLButtonElement).style.color = blue[600] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setAdjustBatch(batch)} title="Adjust stock"
                          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = amber[50]; (e.currentTarget as HTMLButtonElement).style.color = amber[600] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                        >
                          <ArrowUpDown size={14} />
                        </button>
                        <button
                          onClick={() => setEditBatch(batch)} title="Edit batch"
                          style={{ padding: "6px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: gray[400], cursor: "pointer", display: "flex" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = gray[100]; (e.currentTarget as HTMLButtonElement).style.color = gray[700] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = gray[400] }}
                        >
                          <Pencil size={14} />
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

      {addOpen && (
        <AddBatchModal medicines={medicines} onClose={() => setAddOpen(false)} />
      )}
      {editBatch && (
        <EditBatchModal batch={editBatch} medicineName={getMedicineName(editBatch.medicine)} onClose={() => setEditBatch(null)} />
      )}
      {adjustBatch && (
        <AdjustModal batch={adjustBatch} medicineName={getMedicineName(adjustBatch.medicine)} onClose={() => setAdjustBatch(null)} />
      )}
      {viewBatch && (
        <MovementsDrawer batch={viewBatch} medicineName={getMedicineName(viewBatch.medicine)} onClose={() => setViewBatch(null)} />
      )}
    </div>
  )
}

export default InventoryPage