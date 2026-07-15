import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { useDashboardStats } from "@/hooks/useReports"
import {
  LayoutDashboard, Pill, Tags, Factory, Users, Package,
  ClipboardList, ArrowLeftRight, BarChart2, UserCog,
  LogOut, FileHeart, Truck, AlertTriangle, X, ChevronDown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { User } from "@/types"
import { cn } from "@/lib/utils"
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal"

type Role = User["role"]

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  roles: Role[]
  /** key into the badge count map, filled from live dashboard stats */
  badge?: "orders" | "prescriptions" | "alerts"
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// Grouped by workflow, not by database table
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    label: "Fulfil",
    items: [
      { label: "Orders",        path: "/admin/orders",        icon: Package,   roles: ["ADMIN", "STAFF"], badge: "orders" },
      { label: "Prescriptions", path: "/admin/prescriptions", icon: FileHeart, roles: ["ADMIN", "STAFF"], badge: "prescriptions" },
      { label: "Shipments",     path: "/admin/shipments",     icon: Truck,     roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    label: "Stock",
    items: [
      { label: "Inventory",   path: "/admin/inventory",         icon: ClipboardList,  roles: ["ADMIN", "STAFF"] },
      { label: "Alerts",      path: "/admin/alerts",            icon: AlertTriangle,  roles: ["ADMIN", "STAFF"], badge: "alerts" },
      { label: "Adjustments", path: "/admin/stock-adjustments", icon: ArrowLeftRight, roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Medicines",     path: "/admin/medicines",     icon: Pill,    roles: ["ADMIN", "STAFF"] },
      { label: "Categories",    path: "/admin/categories",    icon: Tags,    roles: ["ADMIN", "STAFF"] },
      { label: "Manufacturers", path: "/admin/manufacturers", icon: Factory, roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Customers", path: "/admin/customers", icon: Users,   roles: ["ADMIN", "STAFF"] },
      { label: "Users",     path: "/admin/users",     icon: UserCog, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Insight",
    items: [
      { label: "Reports", path: "/admin/reports", icon: BarChart2, roles: ["ADMIN", "STAFF"] },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: stats } = useDashboardStats()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (label: string) =>
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  const badgeCounts = {
    orders: stats?.orders.pending ?? 0,
    prescriptions: stats?.prescriptions.pending ?? 0,
    alerts:
      (stats?.inventory.low_stock_count ?? 0) +
      (stats?.inventory.expiring_soon_count ?? 0) +
      (stats?.inventory.expired_count ?? 0),
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const confirmLogout = () => {
    setConfirmingLogout(false)
    handleLogout()
  }

  const visibleGroups = NAV_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(item => user?.role && item.roles.includes(user.role)),
    }))
    .filter(group => group.items.length > 0)

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r bg-sidebar transition-transform duration-200 ease-out",
          "lg:sticky lg:top-0 lg:z-0 lg:w-56 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2.5 border-b px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary">
              <Pill size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-sidebar-foreground">ePharmacy</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {visibleGroups.map(group => {
            const collapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label} className="mb-3">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  {group.label}
                  <ChevronDown
                    size={12}
                    className={cn("transition-transform", collapsed && "-rotate-90")}
                  />
                </button>
                {!collapsed && (
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map(({ label, path, icon: Icon, badge }) => {
                      const count = badge ? badgeCounts[badge] : 0
                      return (
                        <li key={path}>
                          <NavLink
                            to={path}
                            end={path === "/admin"}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                                isActive
                                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )
                            }
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="flex-1">{label}</span>
                            {count > 0 && (
                              <span className="tnum rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning">
                                {count}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t p-2">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft">
              <span className="text-xs font-semibold text-accent-foreground">
                {user?.first_name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-muted-foreground">{user?.role}</p>
            </div>
            <button
              onClick={() => setConfirmingLogout(true)}
              title="Log out"
              className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </aside>

      {confirmingLogout && (
        <LogoutConfirmModal
          onConfirm={confirmLogout}
          onClose={() => setConfirmingLogout(false)}
        />
      )}
    </>
  )
}

export default Sidebar
