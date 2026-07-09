import { Outlet } from "react-router-dom"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

/** Customer-facing shell — top navbar (with cart drawer) + footer, no sidebar. */
const StorefrontLayout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
)

export default StorefrontLayout
