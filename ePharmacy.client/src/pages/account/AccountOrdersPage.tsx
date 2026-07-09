import { Link } from "react-router-dom"
import { ChevronRight, Package } from "lucide-react"
import { useOrders } from "@/hooks/useOrders"
import { OrderStatusTag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"

const AccountOrdersPage = () => {
  const { data: orders, isLoading } = useOrders()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={24} />}
        title="No orders yet"
        description="Medicines you order will show up here with live delivery status."
        action={
          <Link
            to="/shop"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Browse the shop
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      {orders.map(order => (
        <Link
          key={order.id}
          to={`/account/orders/${order.id}`}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tnum text-sm font-semibold text-foreground">#{order.id.slice(0, 8)}</span>
              <OrderStatusTag status={order.status} />
            </div>
            <p className="tnum mt-1 truncate text-xs text-muted-foreground">
              Placed {new Date(order.created_at).toLocaleDateString()} · {order.delivery_address}
            </p>
          </div>
          <span className="tnum shrink-0 text-sm font-bold text-foreground">Rs. {order.total_amount}</span>
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  )
}

export default AccountOrdersPage
