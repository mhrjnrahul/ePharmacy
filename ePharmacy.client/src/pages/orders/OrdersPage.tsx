import { useState, useEffect } from "react"
import { Loader2, ShoppingCart, ChevronRight, X } from "lucide-react"
import { useOrders, useOrderDetail, useUpdateOrderStatus, useCancelOrder } from "@/hooks/useOrders"
import { usePaymentByOrder, useRefundPayment } from "@/hooks/usePayments"
import { PageHeader } from "@/components/ui/page-header"
import { OrderStatusTag, Tag, type TagTone } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/store/toastStore"
import { cn } from "@/lib/utils"
import type { OrderList, OrderStatus, PaymentStatus } from "@/types/order"

const PAGE_SIZE = 10

const STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"]

// next valid status transitions for staff
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:    "confirmed",
  confirmed:  "processing",
  processing: "shipped",
  shipped:    "delivered",
}

const STATUS_FILTERS: { value: OrderStatus | ""; label: string }[] = [
  { value: "",           label: "All"        },
  { value: "pending",    label: "Pending"    },
  { value: "confirmed",  label: "Confirmed"  },
  { value: "processing", label: "Processing" },
  { value: "shipped",    label: "Shipped"    },
  { value: "delivered",  label: "Delivered"  },
  { value: "cancelled",  label: "Cancelled"  },
]

const PAYMENT_STATUS_TONE: Record<PaymentStatus, TagTone> = {
  pending:   "warning",
  completed: "success",
  failed:    "danger",
  refunded:  "neutral",
}

// ── Cancel dialog ────────────────────────────────────────────────────────────
const CancelDialog = ({ orderId, onClose, onCancelled }: { orderId: string; onClose: () => void; onCancelled: () => void }) => {
  const cancel = useCancelOrder()
  const [reason, setReason] = useState("")

  const handleConfirm = async () => {
    try {
      await cancel.mutateAsync({ id: orderId, reason: reason || undefined })
      toast.success("Order cancelled. Any deducted stock has been restored.")
      onCancelled()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Failed to cancel order.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Cancel order</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel this order? If stock was already deducted, it will be restored automatically.
        </p>

        <label className="mt-4 block text-xs font-medium text-foreground">
          Reason (optional)
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Customer requested cancellation…"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Keep order
          </button>
          <button
            onClick={handleConfirm}
            disabled={cancel.isPending}
            className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {cancel.isPending && <Loader2 size={13} className="animate-spin" />}
            Cancel order
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Advance-status confirm dialog ────────────────────────────────────────────
const AdvanceDialog = ({
  orderId, next, onClose, onAdvanced,
}: { orderId: string; next: OrderStatus; onClose: () => void; onAdvanced: () => void }) => {
  const updateStatus = useUpdateOrderStatus()

  const handleConfirm = async () => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: next })
      toast.success(`Order marked ${next}.`)
      onAdvanced()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Failed to update status.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold capitalize text-foreground">Mark as {next}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {next === "confirmed"
            ? "Confirming this order deducts the reserved stock from inventory. This can only be undone by cancelling the order."
            : `This will move the order to "${next}". The customer will see this status update.`}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Not yet
          </button>
          <button
            onClick={handleConfirm}
            disabled={updateStatus.isPending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {updateStatus.isPending && <Loader2 size={13} className="animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Refund dialog ─────────────────────────────────────────────────────────────
const RefundDialog = ({ orderId, onClose }: { orderId: string; onClose: () => void }) => {
  const refund = useRefundPayment()
  const [reason, setReason] = useState("")
  const tooShort = reason.trim().length > 0 && reason.trim().length < 5

  const handleConfirm = async () => {
    if (reason.trim().length < 5) return
    try {
      await refund.mutateAsync({ orderId, reason: reason.trim() })
      toast.success("Payment marked as refunded.")
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? err?.response?.data?.reason?.[0] ?? "Could not process the refund.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Refund payment</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          This marks the payment as refunded in our records. eSewa refunds must still be issued separately
          through the merchant portal — this action only updates our books.
        </p>

        <label className="mt-4 block text-xs font-medium text-foreground">
          Reason
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Order cancelled after payment; refund issued to customer"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {tooShort && <span className="mt-1 block text-xs text-destructive">At least 5 characters.</span>}
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={refund.isPending || reason.trim().length < 5}
            className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {refund.isPending && <Loader2 size={13} className="animate-spin" />}
            Refund payment
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Payment section (inside drawer) ──────────────────────────────────────────
const PaymentSection = ({ orderId }: { orderId: string }) => {
  const { data: payment, isLoading } = usePaymentByOrder(orderId)
  const [refundOpen, setRefundOpen] = useState(false)

  if (isLoading) return <div className="h-20 animate-pulse rounded-lg bg-muted" />

  if (!payment) {
    return (
      <div className="rounded-lg bg-muted/30 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
        <p className="mt-1.5 text-sm text-muted-foreground">No payment has been initiated for this order yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-muted/30 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
        <Tag tone={PAYMENT_STATUS_TONE[payment.status]}>{payment.status}</Tag>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Gateway</span>
        <span className="text-right uppercase text-foreground">{payment.gateway}</span>

        <span className="text-muted-foreground">Amount</span>
        <span className="tnum text-right font-medium text-foreground">Rs. {payment.amount}</span>

        {payment.transaction_id && (
          <>
            <span className="text-muted-foreground">Transaction</span>
            <span className="tnum text-right text-foreground">{payment.transaction_id}</span>
          </>
        )}
        {payment.paid_at && (
          <>
            <span className="text-muted-foreground">Paid</span>
            <span className="tnum text-right text-foreground">{new Date(payment.paid_at).toLocaleString()}</span>
          </>
        )}
        {payment.refunded_at && (
          <>
            <span className="text-muted-foreground">Refunded</span>
            <span className="tnum text-right text-foreground">{new Date(payment.refunded_at).toLocaleString()}</span>
          </>
        )}
      </div>

      {payment.status === "completed" && (
        <button
          onClick={() => setRefundOpen(true)}
          className="mt-3 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive-soft"
        >
          Refund payment
        </button>
      )}

      {refundOpen && <RefundDialog orderId={orderId} onClose={() => setRefundOpen(false)} />}
    </div>
  )
}

// ── order detail drawer ───────────────────────────────────────────────────────
const OrderDrawer = ({ orderId, onClose }: { orderId: string; onClose: () => void }) => {
  const { data: order, isLoading, refetch } = useOrderDetail(orderId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [advanceTarget, setAdvanceTarget] = useState<OrderStatus | null>(null)

  const canCancel = order && order.status !== "delivered" && order.status !== "cancelled"
  const next = order ? nextStatus[order.status] : undefined

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col bg-card shadow-2xl">

        <div className="flex-shrink-0 border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Order details</h2>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
              <X size={18} />
            </button>
          </div>
          {order && (
            <p className="tnum mt-1 text-xs text-muted-foreground">
              #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading order…</span>
            </div>
          ) : !order ? null : (
            <div className="space-y-5">

              {/* Status + progress */}
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                  <OrderStatusTag status={order.status} />
                </div>

                <div className="mt-3 flex items-center">
                  {STATUSES.map((s, idx) => {
                    const currentIdx = STATUSES.indexOf(order.status)
                    const stepIdx = STATUSES.indexOf(s)
                    const isDone = order.status !== "cancelled" && stepIdx <= currentIdx
                    return (
                      <div key={s} className={cn("flex items-center", idx < STATUSES.length - 1 ? "flex-1" : "")}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-white",
                            isDone ? "bg-primary" : "bg-muted text-muted-foreground",
                          )}>
                            {isDone && "✓"}
                          </div>
                          <span className={cn(
                            "whitespace-nowrap text-[9px] capitalize",
                            isDone ? "font-semibold text-foreground" : "text-muted-foreground",
                          )}>
                            {s}
                          </span>
                        </div>
                        {idx < STATUSES.length - 1 && (
                          <div className={cn(
                            "mx-1 mb-4 h-0.5 flex-1",
                            stepIdx < currentIdx && order.status !== "cancelled" ? "bg-primary" : "bg-muted",
                          )} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {(next || canCancel) && (
                  <div className="mt-3 flex gap-2">
                    {next && (
                      <button
                        onClick={() => setAdvanceTarget(next)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold capitalize text-primary-foreground hover:opacity-90"
                      >
                        Mark as {next}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => setCancelOpen(true)}
                        className="rounded-md border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive-soft"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}

                {order.status === "cancelled" && order.cancellation_reason && (
                  <div className="mt-3 rounded-md border border-destructive/30 bg-destructive-soft p-2.5 text-xs text-destructive">
                    <strong>Cancellation reason:</strong> {order.cancellation_reason}
                  </div>
                )}
              </div>

              {/* Payment */}
              <PaymentSection orderId={order.id} />

              {/* Customer + delivery */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
                  <p className="mt-1.5 text-sm text-foreground">{order.customer_email}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery address</p>
                  <p className="mt-1.5 text-sm text-foreground">{order.delivery_address || "—"}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Items</p>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3.5 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.medicine_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Batch: {item.batch_number} · Qty: {item.quantity} × Rs. {item.unit_price}
                        </p>
                      </div>
                      <p className="tnum text-sm font-semibold text-foreground">Rs. {item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary-soft px-4 py-3.5">
                <span className="text-sm font-semibold text-foreground">Total amount</span>
                <span className="tnum text-lg font-bold text-foreground">Rs. {order.total_amount}</span>
              </div>

            </div>
          )}
        </div>
      </div>

      {cancelOpen && order && (
        <CancelDialog orderId={order.id} onClose={() => setCancelOpen(false)} onCancelled={() => refetch()} />
      )}
      {advanceTarget && order && (
        <AdvanceDialog
          orderId={order.id}
          next={advanceTarget}
          onClose={() => setAdvanceTarget(null)}
          onAdvanced={() => refetch()}
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
  const { data, isLoading, isError, refetch } = useOrders(params)
  const orders = data?.results ?? []
  const totalCount = data?.count ?? 0

  useEffect(() => {
    setPage(1)
  }, [filterStatus])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${totalCount} ${totalCount === 1 ? "order" : "orders"}${filterStatus ? ` · filtered by ${filterStatus}` : ""}`}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-md bg-muted p-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setFilterStatus(f.value)}
            className={cn(
              "whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              filterStatus === f.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<ShoppingCart size={24} />}
          title="Could not load orders"
          description="Check your connection and try again."
          action={
            <button onClick={() => refetch()} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
              Retry
            </button>
          }
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={24} />}
          title="No orders found"
          description={filterStatus ? `No ${filterStatus} orders.` : "Orders will appear here once customers start placing them."}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Delivery address</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: OrderList) => (
                <tr
                  key={order.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </code>
                  </td>
                  <td className="px-4 py-2.5"><OrderStatusTag status={order.status} /></td>
                  <td className="tnum px-4 py-2.5 font-semibold text-foreground">Rs. {order.total_amount}</td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-muted-foreground">{order.delivery_address || "—"}</td>
                  <td className="tnum px-4 py-2.5 text-muted-foreground">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedOrderId(order.id) }}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      View <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />

      {selectedOrderId && (
        <OrderDrawer orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  )
}

export default OrdersPage
