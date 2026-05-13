import { useState, useEffect } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import {
  LayoutDashboard, Pill, Tags, Truck, Users, ShoppingCart,
  ClipboardList, ArrowLeftRight, BarChart2, UserCog, ScrollText,
  LogOut, ChevronDown, Package,
} from "lucide-react"
import type { User } from "@/types"

// ── types ─────────────────────────────────────────────────────────────────────
type Role = User["role"]

interface NavItem {
  label: string
  path:  string
  icon:  any
  roles: Role[]
}

interface NavGroup {
  key:   string
  label: string
  items: NavItem[]
}

// ── nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    key:   "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    key:   "catalog",
    label: "Catalog",
    items: [
      { label: "Medicines",      path: "/medicines",      icon: Pill,  roles: ["ADMIN", "STAFF"] },
      { label: "Categories",     path: "/categories",     icon: Tags,  roles: ["ADMIN", "STAFF"] },
      { label: "Manufacturers",  path: "/manufacturers",  icon: Truck, roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    key:   "operations",
    label: "Operations",
    items: [
      { label: "Sales",             path: "/sales",             icon: ShoppingCart,  roles: ["ADMIN", "STAFF"] },
      { label: "Inventory", path: "/purchase-orders", icon: ClipboardList, roles: ["ADMIN", "STAFF"] },
      { label: "Stock Adjustments", path: "/stock-adjustments", icon: ArrowLeftRight,roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    key:   "people",
    label: "People",
    items: [
      { label: "Customers",       path: "/customers", icon: Users,   roles: ["ADMIN", "STAFF"]             },
      { label: "User Management", path: "/users",     icon: UserCog, roles: ["ADMIN"]                      },
    ],
  },
  {
    key:   "orders",
    label: "Orders",
    items: [
      { label: "Orders", path: "/orders", icon: Package, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
    ],
  },
  {
    key:   "analytics",
    label: "Analytics",
    items: [
      { label: "Reports",     path: "/reports", icon: BarChart2,  roles: ["ADMIN", "STAFF"] },
      { label: "System Logs", path: "/logs",    icon: ScrollText, roles: ["ADMIN"]           },
    ],
  },
]

const STORAGE_KEY = "sidebar_collapsed_groups"

// ── sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // load collapsed state from localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // persist collapsed state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed))
  }, [collapsed])

  const toggleGroup = (key: string) => {
    // never collapse the group that contains the active route
    const group = NAV_GROUPS.find(g => g.key === key)
    const isActive = group?.items.some(item => pathname === item.path || pathname.startsWith(item.path + "/"))
    if (isActive) return
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // filter items by role
  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => user?.role && item.roles.includes(user.role)),
  })).filter(group => group.items.length > 0)

  return (
    <aside style={{
      width: "220px",
      backgroundColor: "#ffffff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 16px",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0,
      }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          backgroundColor: "#059669", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Pill size={14} color="#ffffff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>ePharmacy</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {visibleGroups.map((group, gi) => {
          const isGroupActive = group.items.some(
            item => pathname === item.path || pathname.startsWith(item.path + "/")
          )
          const isCollapsed = !isGroupActive && !!collapsed[group.key]

          return (
            <div key={group.key} style={{ marginBottom: gi < visibleGroups.length - 1 ? "4px" : 0 }}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  background: "none",
                  border: "none",
                  cursor: isGroupActive ? "default" : "pointer",
                  borderRadius: "6px",
                  marginBottom: "2px",
                }}
              >
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}>
                  {group.label}
                </span>
                {!isGroupActive && (
                  <ChevronDown
                    size={13}
                    color="#9ca3af"
                    style={{
                      transition: "transform 0.2s",
                      transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>

              {/* Group items */}
              {!isCollapsed && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px", marginBottom: "8px" }}>
                  {group.items.map(({ label, path, icon: Icon }) => (
                    <li key={path}>
                      <NavLink
                        to={path}
                        style={({ isActive }) => ({
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                          padding: "7px 10px",
                          borderRadius: "7px",
                          fontSize: "13px",
                          textDecoration: "none",
                          transition: "background 0.12s, color 0.12s",
                          backgroundColor: isActive ? "#ecfdf5" : "transparent",
                          color: isActive ? "#065f46" : "#4b5563",
                          fontWeight: isActive ? 500 : 400,
                        })}
                      >
                        <Icon size={14} style={{ flexShrink: 0 }} />
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "0 8px" }} />

      {/* User + Logout */}
      <div style={{ padding: "12px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            backgroundColor: "#d1fae5", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#065f46" }}>
              {user?.first_name?.[0]?.toUpperCase() ?? "A"}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            style={{ padding: "5px", borderRadius: "6px", border: "none", backgroundColor: "transparent", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af" }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar