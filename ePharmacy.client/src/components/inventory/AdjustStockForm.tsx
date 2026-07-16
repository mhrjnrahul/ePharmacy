import { useState } from "react"
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { useStockAdjust, useAllBatches } from "@/hooks/useInventory"
import { useAllMedicines } from "@/hooks/useMedicines"
import type { BatchList, StockAdjustRequest } from "@/types/inventory"

const green = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857" }
const gray  = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" }
const red   = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" }
const amber = { 50: "#fffbeb", 100: "#fef3c7", 700: "#b45309" }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${gray[200]}`,
  borderRadius: "8px", fontSize: "13px", color: gray[900], outline: "none",
  boxSizing: "border-box", backgroundColor: "#ffffff",
}

interface AdjustStockFormProps {
  /** Pre-selected batch (Inventory row action). Pass null to let the user pick medicine → batch inline (Stock Adjustments page). */
  batch: BatchList | null
  medicineName?: string
  onClose: () => void
}

export const AdjustStockForm = ({ batch, medicineName, onClose }: AdjustStockFormProps) => {
  const adjust = useStockAdjust()
  const { data: medicines = [] } = useAllMedicines()
  const [selectedMedicine, setSelectedMedicine] = useState("")
  const { data: pickedBatches = [] } = useAllBatches(
    selectedMedicine ? { medicine: selectedMedicine } : undefined,
    !batch && !!selectedMedicine,
  )

  const [form, setForm] = useState<Omit<StockAdjustRequest, "batch">>({
    quantity: 1, direction: "in", notes: "",
  })
  const [pickedBatchId, setPickedBatchId] = useState("")
  const [error, setError] = useState("")

  const selectedBatch = batch ?? pickedBatches.find(b => b.id === pickedBatchId) ?? null
  const maxOut = form.direction === "out" ? selectedBatch?.quantity_available : undefined

  const handleSubmit = async () => {
    const batchId = batch ? batch.id : pickedBatchId
    if (!batchId)             { setError("Please select a batch.");        return }
    if (form.quantity < 1)    { setError("Quantity must be at least 1.");  return }
    if (typeof maxOut === "number" && form.quantity > maxOut) {
      setError(`Only ${maxOut} available in this batch.`)
      return
    }
    if (!form.notes.trim())   { setError("Reason / notes are required."); return }
    setError("")
    try {
      await adjust.mutateAsync({ batch: batchId, ...form })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: batch ? "420px" : "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: batch ? "8px" : "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>
            {batch ? "Adjust Stock" : "Manual Stock Adjustment"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        {batch && (
          <p style={{ fontSize: "12px", color: gray[400], margin: "0 0 20px 0" }}>
            {medicineName} · {batch.batch_number} · Current stock: <strong style={{ color: gray[700] }}>{batch.quantity_available}</strong>
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {!batch && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Medicine</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={selectedMedicine}
                  onChange={e => { setSelectedMedicine(e.target.value); setPickedBatchId("") }}
                >
                  <option value="">Select medicine to filter batches</option>
                  {medicines.filter(m => m.is_active).map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.strength}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Batch *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={pickedBatchId}
                  onChange={e => setPickedBatchId(e.target.value)}
                  disabled={!selectedMedicine}
                >
                  <option value="">
                    {selectedMedicine ? (pickedBatches.length === 0 ? "No active batches found" : "Select batch") : "Select a medicine first"}
                  </option>
                  {pickedBatches.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {b.quantity_available} units · Rs. {b.selling_price} · Exp: {new Date(b.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>
              Quantity *{typeof maxOut === "number" && <span style={{ fontWeight: 400, color: gray[400] }}> (max {maxOut} available)</span>}
            </label>
            <input
              type="number" min={1} max={maxOut ?? 1000000} style={inputStyle}
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Reason / Notes *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Damaged during delivery, recount correction, write-off..."
            />
          </div>

          {!batch && (
            <div style={{ padding: "10px 12px", backgroundColor: amber[50], borderRadius: "8px", border: `1px solid ${amber[100]}` }}>
              <p style={{ fontSize: "12px", color: amber[700], margin: 0 }}>
                Use this only for manual corrections — damaged goods, recounts, or write-offs. Sales and purchases are tracked automatically.
              </p>
            </div>
          )}

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
