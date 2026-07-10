import { NavLink, Outlet } from "react-router-dom"
import { Package, FileHeart, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "My orders",        path: "/account/orders",        icon: Package },
  { label: "My prescriptions", path: "/account/prescriptions", icon: FileHeart },
  { label: "Profile",          path: "/account/profile",       icon: UserRound },
]

/** Customer account shell — slim horizontal tab nav inside the storefront. */
const AccountLayout = () => (
  <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
    <h1 className="text-xl font-bold tracking-tight text-foreground">My account</h1>

    <nav className="mt-4 flex gap-1 overflow-x-auto border-b">
      {TABS.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            cn(
              "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )
          }
        >
          <Icon size={14} />
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="py-6">
      <Outlet />
    </div>
  </div>
)

export default AccountLayout
