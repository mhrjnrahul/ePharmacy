import { useNavigate } from "react-router-dom"
import { ShieldOff } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

const UnauthorizedPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const home = user?.role === "CUSTOMER" ? "/orders" : "/dashboard"

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
      <div style={{ textAlign: "center", maxWidth: "400px", padding: "24px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <ShieldOff size={24} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>
          Access Denied
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px 0" }}>
          You don't have permission to view this page. Contact your administrator if you think this is a mistake.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", fontSize: "13px", fontWeight: 500, color: "#6b7280", cursor: "pointer" }}
          >
            Go Back
          </button>
          <button
            onClick={() => navigate(home)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#059669", fontSize: "13px", fontWeight: 500, color: "#ffffff", cursor: "pointer" }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage