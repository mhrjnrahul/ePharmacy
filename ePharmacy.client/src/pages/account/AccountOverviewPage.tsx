import { Link } from "react-router-dom"
import { ChevronRight, FileHeart, Package, Receipt, ShoppingBag } from "lucide-react"
import { useAllOrders } from "@/hooks/useOrders"
import { useAllPrescriptions } from "@/hooks/usePrescriptions"
import { StatTile } from "@/components/ui/stat-tile"
import { OrderStatusTag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"

const formatRs = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

const AccountOverviewPage = () => {
  const { data: orders, isLoading: ordersLoading } = useAllOrders()
  const { data: prescriptions, isLoading: rxLoading } = useAllPrescriptions()

  const totalOrders = orders?.length ?? 0
  const pendingOrders = orders?.filter(o => o.status === "pending").length ?? 0
  const totalSpent = orders
    ?.filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0
  const pendingRx = prescriptions?.filter(p => p.status === "pending").length ?? 0
  const recentOrders = orders?.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">A quick look at your orders and prescriptions</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total orders" icon={<Package size={15} />} value={ordersLoading ? "—" : totalOrders} />
        <StatTile label="Pending orders" icon={<ShoppingBag size={15} />} value={ordersLoading ? "—" : pendingOrders} />
        <StatTile label="Total spent" icon={<Receipt size={15} />} value={ordersLoading ? "—" : formatRs(totalSpent)} />
        <StatTile label="Pending prescriptions" icon={<FileHeart size={15} />} value={rxLoading ? "—" : pendingRx} />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Recent orders</p>
          <Link to="/account/orders" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            View all <ChevronRight size={13} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon={<Package size={22} />}
            title="No orders yet"
            description="Medicines you order will show up here."
            action={
              <Link to="/shop" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Browse the shop
              </Link>
            }
          />
        ) : (
          <div className="divide-y">
            {recentOrders.map(order => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
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
        )}
      </div>
    </div>
  )
}

export default AccountOverviewPage
