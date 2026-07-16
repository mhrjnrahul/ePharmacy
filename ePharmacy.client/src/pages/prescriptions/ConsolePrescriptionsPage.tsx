import { useState, useEffect } from "react"
import { FileHeart, Loader2, Plus, Trash2, X, ExternalLink } from "lucide-react"
import {
  usePrescriptions, usePrescriptionDetail,
  useApprovePrescription, useRejectPrescription,
} from "@/hooks/usePrescriptions"
import { useAllMedicines } from "@/hooks/useMedicines"
import { PageHeader } from "@/components/ui/page-header"
import { PrescriptionStatusTag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/store/toastStore"
import { cn } from "@/lib/utils"
import { mediaUrl as imageUrl } from "@/lib/apiUrl"
import type { PrescriptionStatus } from "@/types/prescription"

const PAGE_SIZE = 10

const STATUS_FILTERS: { value: PrescriptionStatus | ""; label: string }[] = [
  { value: "pending",  label: "Pending"  },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "",         label: "All"      },
]

interface ApprovalItem {
  medicine: string
  approved_quantity: number
}

// Reads DRF field-level errors (e.g. {"items": ["Duplicate medicines…"]} or
// {"items": [{"medicine": ["..."]}, ...]} from a list serializer) instead of
// only ever falling back to a generic message.
const extractErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data.detail === "string") return data.detail
  if (Array.isArray(data.items)) {
    for (const entry of data.items) {
      if (typeof entry === "string") return entry
      if (entry && typeof entry === "object") {
        const firstField = Object.values(entry)[0]
        if (Array.isArray(firstField) && firstField.length) return String(firstField[0])
      }
    }
  }
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) return String(data.non_field_errors[0])
  return fallback
}

// ── Review pane ──────────────────────────────────────────────────────────────
const ReviewPane = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const { data: rx, isLoading } = usePrescriptionDetail(id)
  const { data: medicines } = useAllMedicines()
  const approve = useApprovePrescription()
  const reject = useRejectPrescription()

  const [items, setItems] = useState<ApprovalItem[]>([{ medicine: "", approved_quantity: 1 }])
  const [notes, setNotes] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [mode, setMode] = useState<"approve" | "reject">("approve")

  const activeMedicines = medicines?.filter(m => m.is_active) ?? []

  const setItem = (index: number, patch: Partial<ApprovalItem>) =>
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  const handleApprove = async () => {
    const validItems = items.filter(i => i.medicine && i.approved_quantity > 0)
    if (validItems.length === 0) {
      toast.error("Add at least one medicine this prescription covers.")
      return
    }
    const medicineIds = validItems.map(i => i.medicine)
    if (new Set(medicineIds).size !== medicineIds.length) {
      toast.error("The same medicine is selected more than once — combine it into a single row.")
      return
    }
    try {
      await approve.mutateAsync({ id, items: validItems, notes: notes || undefined })
      toast.success("Prescription approved. The customer can now order these medicines.")
      onClose()
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Could not approve the prescription."))
    }
  }

  const handleReject = async () => {
    if (rejectReason.trim().length < 5) {
      toast.error("Give the customer a reason (at least 5 characters).")
      return
    }
    try {
      await reject.mutateAsync({ id, reason: rejectReason, notes: notes || undefined })
      toast.success("Prescription rejected. The customer will see your reason.")
      onClose()
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Could not reject the prescription."))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Review prescription</h2>
            {rx && <PrescriptionStatusTag status={rx.status} />}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {isLoading || !rx ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-2">
            {/* Left: the uploaded prescription */}
            <div className="border-b bg-muted/40 p-4 md:border-b-0 md:border-r">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Uploaded document
              </p>
              <p className="mb-3 text-sm text-foreground">{rx.customer_email}</p>
              {rx.image.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={imageUrl(rx.image) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open PDF prescription <ExternalLink size={13} />
                </a>
              ) : (
                <a href={imageUrl(rx.image) ?? undefined} target="_blank" rel="noreferrer" title="Open full size">
                  <img
                    src={imageUrl(rx.image) ?? undefined}
                    alt={`Prescription from ${rx.customer_email}`}
                    className="max-h-[55vh] w-full rounded-md border object-contain"
                  />
                </a>
              )}
              <p className="tnum mt-2 text-xs text-muted-foreground">
                Submitted {new Date(rx.created_at).toLocaleString()}
              </p>
            </div>

            {/* Right: decision */}
            <div className="p-4">
              {rx.status !== "pending" ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Reviewed by <span className="font-medium text-foreground">{rx.reviewed_by_email ?? "—"}</span>
                    {rx.reviewed_at && <> on <span className="tnum">{new Date(rx.reviewed_at).toLocaleString()}</span></>}
                  </p>
                  {rx.rejection_reason && (
                    <p className="rounded-md bg-destructive-soft p-3 text-destructive">{rx.rejection_reason}</p>
                  )}
                  {rx.items.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved medicines</p>
                      <ul className="space-y-1">
                        {rx.items.map(item => (
                          <li key={item.id} className="tnum flex justify-between rounded-md bg-muted px-3 py-1.5">
                            <span>{item.medicine_name}</span>
                            <span className="text-muted-foreground">
                              {item.is_used ? "used" : `max ${item.approved_quantity}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Mode toggle */}
                  <div className="mb-4 flex gap-1 rounded-md bg-muted p-1">
                    {(["approve", "reject"] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                          "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                          mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {mode === "approve" ? (
                    <>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Transcribe the prescription: list each medicine it covers and the maximum
                        quantity the customer may order.
                      </p>
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <select
                              value={item.medicine}
                              onChange={e => setItem(i, { medicine: e.target.value })}
                              className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Select medicine…</option>
                              {activeMedicines.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} {m.strength}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={item.approved_quantity}
                              onChange={e => setItem(i, { approved_quantity: Math.max(1, Number(e.target.value) || 1) })}
                              className="tnum w-16 rounded-md border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                              title="Maximum quantity"
                            />
                            <button
                              onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                              disabled={items.length === 1}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive-soft hover:text-destructive disabled:opacity-40"
                              title="Remove row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setItems(prev => [...prev, { medicine: "", approved_quantity: 1 }])}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <Plus size={13} /> Add medicine
                      </button>
                    </>
                  ) : (
                    <label className="block text-xs font-medium text-foreground">
                      Reason shown to the customer
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="e.g. The prescription has expired — please upload one issued within the last 6 months."
                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                  )}

                  <label className="mt-3 block text-xs font-medium text-foreground">
                    Internal notes (not shown to the customer)
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={onClose}
                      className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    {mode === "approve" ? (
                      <button
                        onClick={handleApprove}
                        disabled={approve.isPending}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                      >
                        {approve.isPending && <Loader2 size={13} className="animate-spin" />}
                        Approve prescription
                      </button>
                    ) : (
                      <button
                        onClick={handleReject}
                        disabled={reject.isPending}
                        className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {reject.isPending && <Loader2 size={13} className="animate-spin" />}
                        Reject prescription
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const ConsolePrescriptionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | "">("pending")
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePrescriptions({ ...(statusFilter ? { status: statusFilter } : {}), page })
  const prescriptions = data?.results
  const totalCount = data?.count ?? 0
  const [reviewId, setReviewId] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Review uploaded prescriptions and record which medicines they authorise"
        actions={
          <div className="flex gap-1 rounded-md bg-muted p-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === f.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !prescriptions || prescriptions.length === 0 ? (
        <EmptyState
          icon={<FileHeart size={24} />}
          title={statusFilter ? `No ${statusFilter} prescriptions` : "No prescriptions yet"}
          description="Customer uploads appear here for review."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Submitted</th>
                <th className="px-4 py-2.5">Reviewed</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(rx => (
                <tr key={rx.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-2.5 font-medium text-foreground">{rx.customer_email}</td>
                  <td className="px-4 py-2.5"><PrescriptionStatusTag status={rx.status} /></td>
                  <td className="tnum px-4 py-2.5 text-muted-foreground">
                    {new Date(rx.created_at).toLocaleDateString()}
                  </td>
                  <td className="tnum px-4 py-2.5 text-muted-foreground">
                    {rx.reviewed_at ? new Date(rx.reviewed_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setReviewId(rx.id)}
                      className="rounded-md border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      {rx.status === "pending" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />

      {reviewId && <ReviewPane id={reviewId} onClose={() => setReviewId(null)} />}
    </div>
  )
}

export default ConsolePrescriptionsPage
