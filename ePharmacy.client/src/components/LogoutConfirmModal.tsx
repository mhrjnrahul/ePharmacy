import { LogOut, X } from "lucide-react"

interface LogoutConfirmModalProps {
  onConfirm: () => void
  onClose: () => void
}

export const LogoutConfirmModal = ({ onConfirm, onClose }: LogoutConfirmModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Log Out</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        Are you sure you want to log out? You'll need to sign in again to access your account.
      </p>

      <div className="flex justify-end gap-2.5">
        <button
          onClick={onClose}
          className="rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <LogOut size={14} />
          Log Out
        </button>
      </div>
    </div>
  </div>
)
