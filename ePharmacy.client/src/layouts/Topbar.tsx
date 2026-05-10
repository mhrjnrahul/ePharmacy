import { useLocation } from "react-router-dom"
import { Bell } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

const routeTitles: Record<string, string> = {
  "/dashboard":         "Dashboard",
  "/products":          "Products",
  "/categories":        "Categories",
  "/suppliers":         "Suppliers",
  "/customers":         "Customers",
  "/sales":             "Sales",
  "/purchase-orders":   "Purchase Orders",
  "/stock-adjustments": "Stock Adjustments",
  "/reports":           "Reports",
  "/users":             "User Management",
  "/logs":              "System Logs",
}

const Topbar = () => {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const title = routeTitles[pathname] ?? "ePharmacy"

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification bell — wired up later */}
        <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
          <Bell size={16} />
          {/* low stock badge — wired to real data later */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="text-right">
          <p className="text-xs font-medium text-gray-900">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
      </div>
    </header>
  )
}

export default Topbar