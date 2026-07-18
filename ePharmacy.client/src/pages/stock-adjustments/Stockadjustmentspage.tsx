import { useState, useEffect } from "react"
import {
  Loader2, ArrowUpDown, TrendingUp, TrendingDown,
  RotateCcw, Wrench, Trash2, Filter, Plus,
} from "lucide-react"
import { useMovements } from "@/hooks/useInventory"
import { Pagination } from "@/components/ui/pagination"
import { AdjustStockForm } from "@/components/inventory/AdjustStockForm"
import { gray, green, red, amber, blue, adminInputStyle as inputStyle } from "@/lib/adminTokens"
import type { MovementType } from "@/types/inventory"

const PAGE_SIZE = 10

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

// ── page ──────────────────────────────────────────────────────────────────────
const StockAdjustmentsPage = () => {
  const [filterType,    setFilterType   ] = useState<MovementType | "">("")
  const [adjustOpen,    setAdjustOpen   ] = useState(false)
  const [page,          setPage         ] = useState(1)

  const params = { ...(filterType ? { movement_type: filterType } : {}), page }
  const { data, isLoading, isError } = useMovements(params)
  const movements = data?.results ?? []
  const totalCount = data?.count ?? 0

  useEffect(() => {
    setPage(1)
  }, [filterType])

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
            Full stock movement ledger — {totalCount} {totalCount === 1 ? "entry" : "entries"}
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

      <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />

      {adjustOpen && <AdjustStockForm batch={null} onClose={() => setAdjustOpen(false)} />}
    </div>
  )
}

export default StockAdjustmentsPage