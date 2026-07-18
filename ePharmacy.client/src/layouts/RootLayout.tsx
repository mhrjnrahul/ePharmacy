import { Outlet } from "react-router-dom"
import { ToastContainer } from "@/components/ui/ToastContainer"

const RootLayout = () => (
  <>
    <Outlet />
    <ToastContainer />
  </>
)

export default RootLayout
