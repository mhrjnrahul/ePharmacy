import { useState, useEffect } from "react"
import { Truck, Loader2, X, Plus } from "lucide-react"
import { useShipments, useCreateShipment, useUpdateShipmentStatus } from "@/hooks/useShipments"
import { useAllOrders } from "@/hooks/useOrders"
import { PageHeader } from "@/components/ui/page-header"
import { ShipmentStatusTag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/store/toastStore"
import { cn } from "@/lib/utils"
import type { Shipment, ShipmentStatus } from "@/types/shipment"

const PAGE_SIZE = 10

// Valid transitions mirror the backend state machine
const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus[]>> = {
  preparing:        ["dispatched"],
  dispatched:       ["out_for_delivery", "failed"],
  out_for_delivery: ["delivered", "failed"],
}

const STATUS_FILTERS: { value: ShipmentStatus | ""; label: string }[] = [
  { value: "",                 label: "All"       },
  { value: "preparing",        label: "Preparing" },
  { value: "dispatched",       label: "Dispatched" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered",        label: "Delivered" },
  { value: "failed",           label: "Failed"    },
]

// ── Create shipment dialog ───────────────────────────────────────────────────
const CreateShipmentDialog = ({ onClose }: { onClose: () => void }) => {
  // Only PROCESSING orders can be shipped — the backend enforces this too
  const { data: processingOrders } = useAllOrders({ status: "processing" })
  const create = useCreateShipment()

  const [order, setOrder] = useState("")
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")

  const handleCreate = async () => {
    if (!order) {
      toast.error("Pick the order to ship.")
      return
    }
    try {
      await create.mutateAsync({
        order,
        carrier: carrier || undefined,
        tracking_number: trackingNumber || undefined,
      })
      toast.success("Shipment created. It starts in Preparing.")
      onClose()
    } catch (err: any) {
      const data = err?.response?.data
      toast.error(data?.order?.[0] ?? data?.detail ?? "Could not create the shipment.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Create shipment</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-foreground">
            Order (processing only)
            <select
              value={order}
              onChange={e => setOrder(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select an order…</option>
              {(processingOrders ?? []).map(o => (
                <option key={o.id} value={o.id}>
                  #{o.id.slice(0, 8)} — Rs. {o.total_amount} — {o.delivery_address.slice(0, 40)}
                </option>
              ))}
            </select>
            {processingOrders?.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No orders in Processing. Move a confirmed order to Processing first.
              </p>
            )}
          </label>

          <label className="block text-xs font-medium text-foreground">
            Carrier (optional)
            <input
              value={carrier}
              onChange={e => setCarrier(e.target.value)}
              placeholder="e.g. Sajilo Delivery"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="block text-xs font-medium text-foreground">
            Tracking number (optional)
            <input
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={create.isPending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {create.isPending && <Loader2 size={13} className="animate-spin" />}
            Create shipment
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm-failure dialog ───────────────────────────────────────────────────
const ConfirmFailureDialog = ({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) => {
  const update = useUpdateShipmentStatus()

  const handleConfirm = async () => {
    try {
      await update.mutateAsync({ id: shipment.id, status: "failed" })
      toast.success("Shipment marked failed.")
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Could not update the shipment.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Mark shipment as failed?</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Order #{shipment.order.slice(0, 8)} will be recorded as a failed delivery. This currently has
          no retry path in the console — the shipment stays "failed" until handled manually.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Not yet
          </button>
          <button
            onClick={handleConfirm}
            disabled={update.isPending}
            className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {update.isPending && <Loader2 size={13} className="animate-spin" />}
            Mark failed
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Advance status buttons ───────────────────────────────────────────────────
const AdvanceButtons = ({ shipment }: { shipment: Shipment }) => {
  const update = useUpdateShipmentStatus()
  const targets = NEXT_STATUS[shipment.status] ?? []
  const [confirmFailure, setConfirmFailure] = useState(false)

  if (targets.length === 0) return <span className="text-xs text-muted-foreground">—</span>

  const advance = async (status: ShipmentStatus) => {
    try {
      await update.mutateAsync({ id: shipment.id, status })
      toast.success(`Shipment marked ${status.replace(/_/g, " ")}.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Could not update the shipment.")
    }
  }

  return (
    <>
      <div className="flex justify-end gap-1.5">
        {targets.map(target => (
          <button
            key={target}
            onClick={() => (target === "failed" ? setConfirmFailure(true) : advance(target))}
            disabled={update.isPending}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-semibold capitalize disabled:opacity-60",
              target === "failed"
                ? "border-destructive/40 text-destructive hover:bg-destructive-soft"
                : "text-foreground hover:bg-muted",
            )}
          >
            {target.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      {confirmFailure && <ConfirmFailureDialog shipment={shipment} onClose={() => setConfirmFailure(false)} />}
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const ShipmentsPage = () => {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">("")
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useShipments({ ...(statusFilter ? { status: statusFilter } : {}), page })
  const shipments = data?.results
  const totalCount = data?.count ?? 0
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Dispatch processing orders and move them through delivery"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus size={14} /> Create shipment
          </button>
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-md bg-muted p-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === f.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
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
          icon={<Truck size={24} />}
          title="Could not load shipments"
          description="Check your connection and try again."
          action={
            <button onClick={() => refetch()} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
              Retry
            </button>
          }
        />
      ) : !shipments || shipments.length === 0 ? (
        <EmptyState
          icon={<Truck size={24} />}
          title="No shipments here"
          description='Create a shipment for an order in Processing with "Create shipment".'
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Carrier / tracking</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5 text-right">Advance</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="tnum px-4 py-2.5 font-medium text-foreground">#{s.order.slice(0, 8)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.customer_email}</td>
                  <td className="px-4 py-2.5"><ShipmentStatusTag status={s.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {s.carrier || "—"}
                    {s.tracking_number && <span className="tnum text-xs"> · {s.tracking_number}</span>}
                  </td>
                  <td className="tnum px-4 py-2.5 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5"><AdvanceButtons shipment={s} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />

      {createOpen && <CreateShipmentDialog onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

export default ShipmentsPage
