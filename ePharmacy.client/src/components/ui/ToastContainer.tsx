import { createPortal } from "react-dom"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { useToastStore } from "@/store/toastStore"
import type { ToastType } from "@/store/toastStore"

const CONFIG: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; color: string }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", icon: <CheckCircle  size={16} color="#16a34a" /> },
  error:   { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c", icon: <AlertCircle  size={16} color="#dc2626" /> },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#92400e", icon: <AlertTriangle size={16} color="#d97706" /> },
  info:    { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af", icon: <Info          size={16} color="#2563eb" /> },
}

export const ToastContainer = () => {
  const { toasts, remove } = useToastStore()

  return createPortal(
    <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "360px", width: "calc(100vw - 40px)", pointerEvents: "none" }}>
      {toasts.map(t => {
        const cfg = CONFIG[t.type]
        return (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: "12px 14px",
              backgroundColor: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
              pointerEvents: "all",
              animation: "slideInRight 0.25s ease",
            }}
          >
            <span style={{ flexShrink: 0, marginTop: "1px" }}>{cfg.icon}</span>
            <p style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: cfg.color, margin: 0, lineHeight: 1.5 }}>
              {t.message}
            </p>
            <button
              onClick={() => remove(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "1px", display: "flex", flexShrink: 0, color: cfg.color, opacity: 0.6, borderRadius: "4px" }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>,
    document.body
  )
}
