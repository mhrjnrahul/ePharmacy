import { useRef, useState } from "react"
import { FileHeart, Loader2, Upload, ExternalLink } from "lucide-react"
import { usePrescriptions, usePrescriptionDetail, useUploadPrescription } from "@/hooks/usePrescriptions"
import { PrescriptionStatusTag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { toast } from "@/store/toastStore"

const PAGE_SIZE = 10

const API_BASE = "http://127.0.0.1:8000"
const MAX_SIZE_MB = 10
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

const fileUrl = (path: string) => (path.startsWith("http") ? path : `${API_BASE}${path}`)

// ── Upload card ──────────────────────────────────────────────────────────────
const UploadCard = () => {
  const upload = useUploadPrescription()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Upload a JPG, PNG, WebP image or a PDF.")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large — keep it under ${MAX_SIZE_MB} MB.`)
      return
    }
    try {
      await upload.mutateAsync(file)
      toast.success("Prescription uploaded. The pharmacy will review it shortly.")
    } catch (err: any) {
      toast.error(err?.response?.data?.image?.[0] ?? "Upload failed. Try again.")
    }
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
      }}
      disabled={upload.isPending}
      className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        dragOver ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      {upload.isPending ? (
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      ) : (
        <Upload size={22} className="text-muted-foreground" />
      )}
      <p className="mt-2 text-sm font-semibold text-foreground">
        {upload.isPending ? "Uploading…" : "Upload a prescription"}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Drop a photo or PDF here, or click to choose · max {MAX_SIZE_MB} MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={e => {
          handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
    </button>
  )
}

// ── Row detail (rejection reason, approved items) ────────────────────────────
const PrescriptionRow = ({ id, status, created_at }: { id: string; status: any; created_at: string }) => {
  const [open, setOpen] = useState(false)
  const { data: detail } = usePrescriptionDetail(open ? id : null)

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="tnum text-sm font-semibold text-foreground">#{id.slice(0, 8)}</span>
            <PrescriptionStatusTag status={status} />
          </div>
          <p className="tnum mt-1 text-xs text-muted-foreground">
            Uploaded {new Date(created_at).toLocaleDateString()}
          </p>
        </div>
        <span className="text-xs font-medium text-primary">{open ? "Hide" : "Details"}</span>
      </button>

      {open && (
        <div className="border-t p-4 text-sm">
          {!detail ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-3">
              <a
                href={fileUrl(detail.image)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                View uploaded document <ExternalLink size={12} />
              </a>

              {detail.status === "rejected" && detail.rejection_reason && (
                <p className="rounded-md bg-destructive-soft p-3 text-xs text-destructive">
                  {detail.rejection_reason}
                </p>
              )}

              {detail.status === "approved" && detail.items.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    You can order
                  </p>
                  <ul className="space-y-1">
                    {detail.items.map(item => (
                      <li key={item.id} className="tnum flex justify-between rounded-md bg-muted px-3 py-1.5 text-xs">
                        <span className="font-medium text-foreground">{item.medicine_name}</span>
                        <span className={item.is_used ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                          {item.is_used ? "already used" : `up to ${item.approved_quantity} units`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    A prescription covers one order per medicine. Upload a new one to order again.
                  </p>
                </div>
              )}

              {detail.status === "pending" && (
                <p className="text-xs text-muted-foreground">
                  Waiting for the pharmacy to review — usually within a day.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const AccountPrescriptionsPage = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePrescriptions({ page })
  const prescriptions = data?.results
  const totalCount = data?.count ?? 0

  return (
    <div className="space-y-4">
      <UploadCard />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !prescriptions || prescriptions.length === 0 ? (
        <EmptyState
          icon={<FileHeart size={24} />}
          title="No prescriptions yet"
          description="Some medicines need a doctor's prescription. Upload one above and the pharmacy will approve which medicines it covers."
        />
      ) : (
        <div className="space-y-2">
          {prescriptions.map(rx => (
            <PrescriptionRow key={rx.id} id={rx.id} status={rx.status} created_at={rx.created_at} />
          ))}
          <Pagination page={page} pageSize={PAGE_SIZE} count={totalCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

export default AccountPrescriptionsPage
