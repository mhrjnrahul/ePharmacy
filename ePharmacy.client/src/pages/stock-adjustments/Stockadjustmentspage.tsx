import { useState } from "react"
import {
  X, Loader2, ArrowUpDown, TrendingUp, TrendingDown,
  RotateCcw, Wrench, Trash2, Filter, Plus,
} from "lucide-react"
import { useMovements, useStockAdjust, useBatches } from "@/hooks/useInventory"
import { useMedicines } from "@/hooks/useMedicines"
import type { StockAdjustRequest, MovementType } from "@/types/inventory"

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
const movementMeta: Record<MovementType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  purchase_in:  { icon: <TrendingUp size={13} />,  label: "Purchase In",  color: green[700],  bg: green[50]  },
  sale_out:     { icon: <TrendingDown size={13} />, label: "Sale Out",     color: red[700],    bg: red[50]    },
  return_in:    { icon: <RotateCcw size={13} />,    label: "Return In",    color: blue[700],   bg: blue[50]   },
  adjustment:   { icon: <Wrench size={13} />,       label: "Adjustment",   color: amber[700],  bg: amber[50]  },
  expired_out:  { icon: <Trash2 size={13} />,       color: gray[500],      bg: gray[100], label: "Expired Out" },
}

const MOVEMENT_TYPE_OPTIONS: { value: MovementType | ""; label: string }[] = [
  { value: "",             label: "All types"     },
  { value: "purchase_in",  label: "Purchase In"   },
  { value: "sale_out",     label: "Sale Out"      },
  { value: "return_in",    label: "Return In"     },
  { value: "adjustment",   label: "Adjustment"    },
  { value: "expired_out",  label: "Expired Out"   },
]

// ── adjust modal ──────────────────────────────────────────────────────────────
interface AdjustModalProps { onClose: () => void }

const AdjustModal = ({ onClose }: AdjustModalProps) => {
  const adjust = useStockAdjust()
  const { data: medicines = [] } = useMedicines()
  const [selectedMedicine, setSelectedMedicine] = useState("")
  const { data: batches = [] } = useBatches(
    selectedMedicine ? { medicine: selectedMedicine } : undefined
  )

  const [form, setForm] = useState<StockAdjustRequest>({
    batch: "", quantity: 1, direction: "in", notes: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!form.batch)          { setError("Please select a batch.");       return }
    if (form.quantity < 1)    { setError("Quantity must be at least 1."); return }
    if (!form.notes.trim())   { setError("Reason is required.");          return }
    setError("")
    try {
      await adjust.mutateAsync(form)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Manual Stock Adjustment</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Step 1 — pick medicine to filter batches */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Medicine</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={selectedMedicine}
              onChange={e => { setSelectedMedicine(e.target.value); setForm(f => ({ ...f, batch: "" })) }}
            >
              <option value="">Select medicine to filter batches</option>
              {medicines.filter(m => m.is_active).map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.strength}</option>
              ))}
            </select>
          </div>

          {/* Step 2 — pick batch */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Batch *</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.batch}
              onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
              disabled={!selectedMedicine}
            >
              <option value="">
                {selectedMedicine ? (batches.length === 0 ? "No active batches found" : "Select batch") : "Select a medicine first"}
              </option>
              {batches.filter(b => b.is_active).map(b => (
                <option key={b.id} value={b.id}>
                  {b.batch_number} — {b.quantity_available} units · Rs. {b.selling_price} · Exp: {new Date(b.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </option>
              ))}
            </select>
          </div>

          {/* Direction */}
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

          {/* Quantity */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Quantity *</label>
            <input
              type="number" min={1} style={inputStyle}
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
            />
          </div>

          {/* Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Reason *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Damaged during delivery, recount correction, write-off..."
            />
          </div>

          {/* Info note */}
          <div style={{ padding: "10px 12px", backgroundColor: amber[50], borderRadius: "8px", border: `1px solid ${amber[100]}` }}>
            <p style={{ fontSize: "12px", color: amber[700], margin: 0 }}>
              Use this only for manual corrections — damaged goods, recounts, or write-offs. Sales and purchases are tracked automatically.
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

// ── page ──────────────────────────────────────────────────────────────────────
const StockAdjustmentsPage = () => {
  const [filterType,    setFilterType   ] = useState<MovementType | "">("")
  const [adjustOpen,    setAdjustOpen   ] = useState(false)

  const params = filterType ? { movement_type: filterType } : {}
  const { data: movements = [], isLoading, isError } = useMovements(params)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px" }}>Loading movements…</span>
    </div>
  )

  if (isError) return (
    <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}` }}>
      <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load stock movements. Check your connection and try again.</p>
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>Stock Adjustments</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            Full stock movement ledger — {movements.length} {movements.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          onClick={() => setAdjustOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          <Plus size={14} /> New Adjustment
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
        <Filter size={14} color={gray[400]} />
        <select
          style={{ ...inputStyle, width: "180px", cursor: "pointer" }}
          value={filterType}
          onChange={e => setFilterType(e.target.value as MovementType | "")}
        >
          {MOVEMENT_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {filterType && (
          <button
            onClick={() => setFilterType("")}
            style={{ fontSize: "12px", color: gray[500], background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Empty state */}
      {movements.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: amber[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ArrowUpDown size={22} color={amber[600]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>No movements found</p>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {filterType ? "No movements match the selected filter." : "Stock movements will appear here as orders are processed."}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}`, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "980px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: gray[50], borderBottom: `1px solid ${gray[200]}` }}>
                {["Type", "Medicine", "Batch", "Change", "Before → After", "Performed By", "Reference / Notes", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => {
                const meta = movementMeta[m.movement_type]
                const isIncrease = m.quantity_after > m.quantity_before
                return (
                  <tr
                    key={m.id}
                    style={{ borderBottom: i < movements.length - 1 ? `1px solid ${gray[100]}` : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Type */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0 }}>
                          {meta.icon}
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: meta.color, whiteSpace: "nowrap" }}>{meta.label}</span>
                      </div>
                    </td>

                    {/* Medicine */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: gray[900] }}>{m.medicine_name}</span>
                    </td>

                    {/* Batch */}
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontSize: "11px", color: gray[500], backgroundColor: gray[100], padding: "2px 6px", borderRadius: "4px" }}>
                        {m.batch.slice(0, 8)}…
                      </code>
                    </td>

                    {/* Change */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: isIncrease ? green[700] : red[600] }}>
                        {isIncrease ? "+" : "−"}{m.quantity}
                      </span>
                    </td>

                    {/* Before → After */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: gray[500] }}>
                        <span style={{ color: gray[700], fontWeight: 500 }}>{m.quantity_before}</span>
                        {" → "}
                        <span style={{ color: gray[700], fontWeight: 500 }}>{m.quantity_after}</span>
                      </span>
                    </td>

                    {/* Performed by */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", color: gray[500] }}>
                        {m.performed_by_email || "System"}
                      </span>
                    </td>

                    {/* Reference / Notes */}
                    <td style={{ padding: "12px 16px", maxWidth: "200px" }}>
                      <span style={{ fontSize: "12px", color: gray[500], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {m.reference || m.notes || <span style={{ color: gray[400] }}>—</span>}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: gray[400] }}>{formatDate(m.created_at)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {adjustOpen && <AdjustModal onClose={() => setAdjustOpen(false)} />}
    </div>
  )
}

export default StockAdjustmentsPage