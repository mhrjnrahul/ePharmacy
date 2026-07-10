import { Link, useLocation } from "react-router-dom"
import { Bell, Menu } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useDashboardStats } from "@/hooks/useReports"

const routeTitles: Record<string, string> = {
  "/admin":                   "Dashboard",
  "/admin/orders":            "Orders",
  "/admin/prescriptions":     "Prescriptions",
  "/admin/shipments":         "Shipments",
  "/admin/inventory":         "Inventory",
  "/admin/alerts":            "Stock Alerts",
  "/admin/stock-adjustments": "Stock Adjustments",
  "/admin/medicines":         "Medicines",
  "/admin/categories":        "Categories",
  "/admin/manufacturers":     "Manufacturers",
  "/admin/customers":         "Customers",
  "/admin/users":             "User Management",
  "/admin/reports":           "Reports",
}

interface TopbarProps {
  onMenuClick: () => void
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { data: stats } = useDashboardStats()

  const title = routeTitles[pathname] ?? "ePharmacy"
  const alertCount =
    (stats?.inventory.low_stock_count ?? 0) +
    (stats?.inventory.expiring_soon_count ?? 0) +
    (stats?.inventory.expired_count ?? 0)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="-ml-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu size={18} />
        </button>
        <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/admin/alerts"
          title={alertCount > 0 ? `${alertCount} stock alerts` : "Stock alerts"}
          className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell size={16} />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold leading-4 text-white">
              {alertCount}
            </span>
          )}
        </Link>

        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium text-foreground">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </header>
  )
}

export default Topbar
