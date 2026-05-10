import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import type { User } from "@/types"

interface Props {
  roles?: User["role"][]
}

const ProtectedRoute = ({ roles }: Props) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute