import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, Package, FileHeart, UserRound, LogOut, X } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useLogout } from "@/hooks/useLogout"
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Overview",         path: "/account",              icon: LayoutDashboard, end: true },
  { label: "My Orders",        path: "/account/orders",        icon: Package },
  { label: "My Prescriptions", path: "/account/prescriptions", icon: FileHeart },
  { label: "Profile",          path: "/account/profile",       icon: UserRound },
]

interface AccountSidebarProps {
  open: boolean
  onClose: () => void
}

export const AccountSidebar = ({ open, onClose }: AccountSidebarProps) => {
  const user = useAuthStore(s => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const confirmLogout = () => {
    setConfirmingLogout(false)
    handleLogout()
  }

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
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r bg-card transition-transform duration-200 ease-out",
          "lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:w-56 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile header */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2.5 border-b px-4 lg:hidden">
          <span className="text-sm font-bold text-foreground">My Account</span>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, path, icon: Icon, end }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary-soft font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t p-2">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft">
              <span className="text-xs font-semibold text-accent-foreground">
                {user?.first_name?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
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
