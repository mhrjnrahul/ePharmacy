import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft, Check, CreditCard, Loader2, Package, Truck, X,
} from "lucide-react"
import { useOrderDetail, useCancelOrder } from "@/hooks/useOrders"
import { useOrderShipment } from "@/hooks/useShipments"
import { paymentsApi, submitEsewaForm } from "@/api/payments"
import { OrderStatusTag, ShipmentStatusTag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "@/store/toastStore"
import type { ShipmentStatus } from "@/types/shipment"
import { cn } from "@/lib/utils"

// ── Delivery progress ────────────────────────────────────────────────────────
const TRACK_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "preparing",        label: "Preparing"        },
  { status: "dispatched",       label: "Dispatched"       },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered",        label: "Delivered"        },
]

const TrackingCard = ({ orderId }: { orderId: string }) => {
  const { data: shipment, isLoading, isError } = useOrderShipment(orderId)

  if (isLoading) return <div className="h-24 animate-pulse rounded-lg bg-muted" />

  if (isError || !shipment) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Truck size={14} /> Delivery
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Not shipped yet — tracking appears here once the pharmacy dispatches your order.
        </p>
      </div>
    )
  }

  const currentIndex = TRACK_STEPS.findIndex(s => s.status === shipment.status)

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Truck size={14} /> Delivery
        </p>
        <ShipmentStatusTag status={shipment.status} />
      </div>

      {shipment.status === "failed" ? (
        <p className="mt-3 text-sm text-destructive">
          Delivery failed. The pharmacy will contact you to rearrange it.
        </p>
      ) : (
        <ol className="mt-4 flex items-center">
          {TRACK_STEPS.map((step, i) => {
            const reached = i <= currentIndex
            return (
              <li key={step.status} className={cn("flex items-center", i < TRACK_STEPS.length - 1 && "flex-1")}>
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                      reached
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {reached ? <Check size={12} /> : i + 1}
                  </span>
                  <span className={cn("mt-1 whitespace-nowrap text-[10px]", reached ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
                {i < TRACK_STEPS.length - 1 && (
                  <div className={cn("mx-1 mb-4 h-0.5 flex-1", i < currentIndex ? "bg-primary" : "bg-border")} />
                )}
              </li>
            )
          })}
        </ol>
      )}

      {(shipment.carrier || shipment.tracking_number) && (
        <p className="tnum mt-3 text-xs text-muted-foreground">
          {shipment.carrier}
          {shipment.tracking_number && <> · Tracking {shipment.tracking_number}</>}
        </p>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const AccountOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrderDetail(id ?? null)
  const cancel = useCancelOrder()
  const [paying, setPaying] = useState(false)

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-muted" />

  if (isError || !order) {
    return (
      <EmptyState
        icon={<Package size={24} />}
        title="Order not found"
        action={
          <Link to="/account/orders" className="text-sm font-semibold text-primary hover:underline">
            Back to my orders
          </Link>
        }
      />
    )
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      const payload = await paymentsApi.initiate(order.id)
      submitEsewaForm(payload) // redirects to eSewa
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Could not start the payment.")
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync({ id: order.id })
      toast.success("Order cancelled.")
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Could not cancel the order.")
    }
  }

  return (
    <div className="space-y-4">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> All orders
      </Link>

      {/* Summary */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="tnum text-base font-bold text-foreground">Order #{order.id.slice(0, 8)}</h2>
            <OrderStatusTag status={order.status} />
          </div>
          <div className="flex gap-2">
            {order.status === "pending" && (
              <>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {paying ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                  Pay with eSewa
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancel.isPending}
                  className="flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive-soft disabled:opacity-60"
                >
                  <X size={12} /> Cancel order
                </button>
              </>
            )}
          </div>
        </div>
        <p className="tnum mt-1 text-xs text-muted-foreground">
          Placed {new Date(order.created_at).toLocaleString()} · Deliver to {order.delivery_address}
        </p>
        {order.status === "cancelled" && order.cancellation_reason && (
          <p className="mt-2 rounded-md bg-destructive-soft p-2 text-xs text-destructive">
            Cancelled: {order.cancellation_reason}
          </p>
        )}
      </div>

      {/* Tracking */}
      {order.status !== "pending" && order.status !== "cancelled" && <TrackingCard orderId={order.id} />}

      {/* Items */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5">Medicine</th>
              <th className="tnum px-4 py-2.5 text-right">Qty</th>
              <th className="tnum px-4 py-2.5 text-right">Unit price</th>
              <th className="tnum px-4 py-2.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{item.medicine_name}</td>
                <td className="tnum px-4 py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                <td className="tnum px-4 py-2.5 text-right text-muted-foreground">Rs. {item.unit_price}</td>
                <td className="tnum px-4 py-2.5 text-right font-medium text-foreground">Rs. {item.subtotal}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-semibold text-foreground">Total</td>
              <td className="tnum px-4 py-2.5 text-right text-sm font-bold text-foreground">Rs. {order.total_amount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default AccountOrderDetailPage
