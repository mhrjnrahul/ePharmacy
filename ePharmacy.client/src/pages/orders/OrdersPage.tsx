import { useState, useEffect } from "react"
import {
  X, Loader2, ShoppingCart,  ChevronRight,
  Clock, CheckCircle, Package, Truck, Star, XCircle,
} from "lucide-react"
import { useOrders, useOrderDetail, useUpdateOrderStatus, useCancelOrder } from "@/hooks/useOrders"
import { Pagination } from "@/components/ui/pagination"
import type { OrderList, OrderStatus } from "@/types/order"

const PAGE_SIZE = 10

// ── tokens ────────────────────────────────────────────────────────────────────
const green  = { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857" }
const gray   = { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 700: "#374151", 900: "#111827" }
const red    = { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c" }
const amber  = { 50: "#fffbeb", 100: "#fef3c7", 600: "#d97706", 700: "#b45309" }
const blue   = { 50: "#eff6ff", 100: "#dbeafe", 600: "#2563eb", 700: "#1d4ed8" }
const purple = { 50: "#faf5ff", 100: "#ede9fe", 700: "#6d28d9" }
const teal   = { 50: "#f0fdfa", 100: "#ccfbf1", 700: "#0f766e" }

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${gray[200]}`,
  borderRadius: "8px", fontSize: "13px", color: gray[900], outline: "none",
  boxSizing: "border-box", backgroundColor: "#ffffff",
}

// ── status meta ───────────────────────────────────────────────────────────────
const statusMeta: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    color: amber[700],  bg: amber[50],  icon: <Clock size={12} />       },
  confirmed:  { label: "Confirmed",  color: blue[700],   bg: blue[50],   icon: <CheckCircle size={12} /> },
  processing: { label: "Processing", color: purple[700], bg: purple[50], icon: <Package size={12} />     },
  shipped:    { label: "Shipped",    color: teal[700],   bg: teal[50],   icon: <Truck size={12} />       },
  delivered:  { label: "Delivered",  color: green[700],  bg: green[50],  icon: <Star size={12} />        },
  cancelled:  { label: "Cancelled",  color: red[700],    bg: red[50],    icon: <XCircle size={12} />     },
}

// next valid status transitions for staff
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:    "confirmed",
  confirmed:  "processing",
  processing: "shipped",
  shipped:    "delivered",
}

const STATUS_FILTER_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "",           label: "All statuses" },
  { value: "pending",    label: "Pending"      },
  { value: "confirmed",  label: "Confirmed"    },
  { value: "processing", label: "Processing"   },
  { value: "shipped",    label: "Shipped"      },
  { value: "delivered",  label: "Delivered"    },
  { value: "cancelled",  label: "Cancelled"    },
]

// ── cancel modal ──────────────────────────────────────────────────────────────
interface CancelModalProps {
  orderId: string
  orderStatus: OrderStatus
  onClose: () => void
  onCancelled: () => void
}

const CancelModal = ({ orderId, onClose, onCancelled }: CancelModalProps) => {
  const cancel = useCancelOrder()
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    try {
      await cancel.mutateAsync({ id: orderId, reason: reason || undefined })
      onCancelled()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to cancel order.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Cancel Order</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "13px", color: gray[500], margin: "0 0 16px 0", lineHeight: 1.6 }}>
          Are you sure you want to cancel this order? If stock was already deducted, it will be restored automatically.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: gray[700] }}>Reason (optional)</label>
          <textarea
            style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation..."
          />
        </div>

        {error && (
          <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}`, marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: red[700], margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "13px", fontWeight: 500, color: gray[700], cursor: "pointer" }}>
            Keep Order
          </button>
          <button
            onClick={handleSubmit} disabled={cancel.isPending}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: red[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: cancel.isPending ? "not-allowed" : "pointer", opacity: cancel.isPending ? 0.7 : 1 }}
          >
            {cancel.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  )
}

// ── order detail drawer ───────────────────────────────────────────────────────
interface OrderDrawerProps {
  orderId: string
  onClose: () => void
}

const OrderDrawer = ({ orderId, onClose }: OrderDrawerProps) => {
  const { data: order, isLoading } = useOrderDetail(orderId)
  const updateStatus = useUpdateOrderStatus()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [statusError, setStatusError] = useState("")

  const handleAdvanceStatus = async () => {
    if (!order) return
    const next = nextStatus[order.status]
    if (!next) return
    setStatusError("")
    try {
      await updateStatus.mutateAsync({ id: order.id, status: next })
    } catch (err: any) {
      setStatusError(err?.response?.data?.detail ?? "Failed to update status.")
    }
  }

  const canCancel = order && order.status !== "delivered" && order.status !== "cancelled"
  const canAdvance = order && !!nextStatus[order.status]

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)", backgroundColor: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${gray[200]}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: gray[900], margin: 0 }}>Order Details</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: gray[400], display: "flex", padding: "4px" }}>
              <X size={18} />
            </button>
          </div>
          {order && (
            <p style={{ fontSize: "12px", color: gray[400], margin: "4px 0 0 0" }}>
              {order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[400] }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "13px" }}>Loading order…</span>
            </div>
          ) : !order ? null : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Status + actions */}
              <div style={{ backgroundColor: gray[50], borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: canAdvance || canCancel ? "12px" : "0" }}>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: gray[400], textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" }}>Status</p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", backgroundColor: statusMeta[order.status].bg }}>
                      <span style={{ color: statusMeta[order.status].color }}>{statusMeta[order.status].icon}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: statusMeta[order.status].color }}>{statusMeta[order.status].label}</span>
                    </div>
                  </div>
                </div>

                {/* Status progress */}
                <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: canAdvance || canCancel ? "12px" : "0" }}>
                  {(["pending", "confirmed", "processing", "shipped", "delivered"] as OrderStatus[]).map((s, idx, arr) => {
                    const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"]
                    const currentIdx = statuses.indexOf(order.status)
                    const stepIdx = statuses.indexOf(s)
                    const isDone = order.status === "cancelled" ? false : stepIdx <= currentIdx
                    const isActive = s === order.status && order.status !== "cancelled"
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", flex: idx < arr.length - 1 ? 1 : 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            backgroundColor: isDone ? green[600] : gray[200],
                            border: isActive ? `2px solid ${green[600]}` : "none",
                            flexShrink: 0,
                          }}>
                            {isDone && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                          </div>
                          <span style={{ fontSize: "9px", color: isDone ? green[700] : gray[400], fontWeight: isDone ? 600 : 400, whiteSpace: "nowrap", textTransform: "capitalize" }}>{s}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div style={{ flex: 1, height: "2px", backgroundColor: stepIdx < (order.status === "cancelled" ? -1 : statuses.indexOf(order.status)) ? green[600] : gray[200], margin: "0 4px", marginBottom: "16px" }} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Action buttons */}
                {(canAdvance || canCancel) && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    {canAdvance && (
                      <button
                        onClick={handleAdvanceStatus} disabled={updateStatus.isPending}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 12px", borderRadius: "8px", border: "none", backgroundColor: green[600], fontSize: "13px", fontWeight: 600, color: "#fff", cursor: updateStatus.isPending ? "not-allowed" : "pointer", opacity: updateStatus.isPending ? 0.7 : 1 }}
                      >
                        {updateStatus.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                        Mark as {statusMeta[nextStatus[order.status]!].label}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => setCancelOpen(true)}
                        style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${red[100]}`, backgroundColor: red[50], fontSize: "13px", fontWeight: 500, color: red[600], cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                {statusError && (
                  <div style={{ padding: "8px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}`, marginTop: "8px" }}>
                    <p style={{ fontSize: "12px", color: red[700], margin: 0 }}>{statusError}</p>
                  </div>
                )}

                {order.status === "cancelled" && order.cancellation_reason && (
                  <div style={{ padding: "10px 12px", backgroundColor: red[50], borderRadius: "8px", border: `1px solid ${red[100]}`, marginTop: "8px" }}>
                    <p style={{ fontSize: "12px", color: red[700], margin: 0 }}>
                      <strong>Cancellation reason:</strong> {order.cancellation_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer + delivery */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: gray[50], borderRadius: "10px", padding: "14px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: gray[400], textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" }}>Customer</p>
                  <p style={{ fontSize: "13px", color: gray[900], margin: 0 }}>{order.customer_email}</p>
                </div>
                <div style={{ backgroundColor: gray[50], borderRadius: "10px", padding: "14px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: gray[400], textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" }}>Delivery Address</p>
                  <p style={{ fontSize: "13px", color: gray[900], margin: 0 }}>{order.delivery_address || "—"}</p>
                </div>
              </div>

              {/* Order items */}
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: gray[700], margin: "0 0 10px 0" }}>Items</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", backgroundColor: gray[50], borderRadius: "10px", border: `1px solid ${gray[200]}` }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: gray[900], margin: "0 0 2px 0" }}>{item.medicine_name}</p>
                        <p style={{ fontSize: "11px", color: gray[400], margin: 0 }}>
                          Batch: {item.batch_number} · Qty: {item.quantity} × Rs. {item.unit_price}
                        </p>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: gray[900], margin: 0 }}>Rs. {item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", backgroundColor: green[50], borderRadius: "10px", border: `1px solid ${green[100]}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: gray[700] }}>Total Amount</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: green[700] }}>Rs. {order.total_amount}</span>
              </div>

            </div>
          )}
        </div>
      </div>

      {cancelOpen && order && (
        <CancelModal
          orderId={order.id}
          orderStatus={order.status}
          onClose={() => setCancelOpen(false)}
          onCancelled={onClose}
        />
      )}
    </>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
const OrdersPage = () => {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const params = { ...(filterStatus ? { status: filterStatus } : {}), page }
  const { data, isLoading, isError } = useOrders(params)
  const orders = data?.results ?? []
  const totalCount = data?.count ?? 0

  useEffect(() => {
    setPage(1)
  }, [filterStatus])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: gray[500] }}>
      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: "14px" }}>Loading orders…</span>
    </div>
  )

  if (isError) return (
    <div style={{ padding: "20px 24px", backgroundColor: red[50], borderRadius: "12px", border: `1px solid ${red[100]}` }}>
      <p style={{ fontSize: "14px", color: red[700], margin: 0 }}>Failed to load orders. Check your connection and try again.</p>
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: gray[900], margin: "0 0 4px 0" }}>Orders</h1>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {totalCount} {totalCount === 1 ? "order" : "orders"}
            {filterStatus && ` · filtered by ${statusMeta[filterStatus].label}`}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {STATUS_FILTER_OPTIONS.map(opt => {
          const isActive = filterStatus === opt.value
          const meta = opt.value ? statusMeta[opt.value] : null
          return (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "6px 14px", borderRadius: "20px", border: "1px solid",
                borderColor: isActive ? (meta ? meta.color : gray[700]) : gray[200],
                backgroundColor: isActive ? (meta ? meta.bg : gray[100]) : "#fff",
                color: isActive ? (meta ? meta.color : gray[700]) : gray[500],
                fontSize: "12px", fontWeight: isActive ? 600 : 400, cursor: "pointer",
              }}
            >
              {meta && <span>{meta.icon}</span>}
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}` }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: blue[50], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShoppingCart size={22} color={blue[600]} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: gray[900], margin: "0 0 6px 0" }}>No orders found</p>
          <p style={{ fontSize: "13px", color: gray[500], margin: 0 }}>
            {filterStatus ? `No ${statusMeta[filterStatus].label.toLowerCase()} orders.` : "Orders will appear here once customers start placing them."}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: `1px solid ${gray[200]}`, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: gray[50], borderBottom: `1px solid ${gray[200]}` }}>
                {["Order ID", "Status", "Amount", "Delivery Address", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: gray[500], textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order: OrderList, i) => {
                const meta = statusMeta[order.status]
                return (
                  <tr
                    key={order.id}
                    style={{ borderBottom: i < orders.length - 1 ? `1px solid ${gray[100]}` : "none", transition: "background 0.1s", cursor: "pointer" }}
                    onClick={() => setSelectedOrderId(order.id)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = gray[50])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Order ID */}
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontSize: "12px", color: gray[700], backgroundColor: gray[100], padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </code>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", backgroundColor: meta.bg }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: meta.color }}>{meta.label}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: gray[900] }}>Rs. {order.total_amount}</span>
                    </td>

                    {/* Delivery address */}
                    <td style={{ padding: "12px 16px", maxWidth: "200px" }}>
                      <span style={{ fontSize: "13px", color: gray[500], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {order.delivery_address || "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: gray[400] }}>{formatDate(order.created_at)}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedOrderId(order.id) }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${gray[200]}`, backgroundColor: "#fff", fontSize: "12px", color: gray[500], cursor: "pointer" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = gray[50] }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff" }}
                        >
                          View <ChevronRight size={12} />
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

      {selectedOrderId && (
        <OrderDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

export default OrdersPage