import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import { AccountSidebar } from "@/components/account/AccountSidebar"

/** Customer account shell — sidebar nav (Overview, Orders, Prescriptions, Profile) inside the storefront. */
const AccountLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex w-full">
      <AccountSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted lg:hidden"
        >
          <Menu size={16} /> Account menu
        </button>

        <Outlet />
      </div>
    </div>
  )
}

export default AccountLayout
