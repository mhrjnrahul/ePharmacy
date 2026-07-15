import { X, PackageX } from "lucide-react"

interface CancelOrderConfirmModalProps {
  orderId: string
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}

export const CancelOrderConfirmModal = ({ orderId, onConfirm, onClose, isPending }: CancelOrderConfirmModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Cancel Order</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        Are you sure you want to cancel order <span className="tnum font-medium text-foreground">#{orderId.slice(0, 8)}</span>?
        This cannot be undone — you'll need to place a new order if you change your mind.
      </p>

      <div className="flex justify-end gap-2.5">
        <button
          onClick={onClose}
          className="rounded-md border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Keep order
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <PackageX size={14} />
          {isPending ? "Cancelling…" : "Cancel order"}
        </button>
      </div>
    </div>
  </div>
)
