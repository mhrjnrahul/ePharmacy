import { useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, CalendarClock, PackageX, CheckCircle2, Loader2, X } from "lucide-react"
import { useInventorySummary, useWriteOffBatch } from "@/hooks/useInventory"
import { PageHeader } from "@/components/ui/page-header"
import { Tag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "@/store/toastStore"
import type { ExpiredBatchAlert } from "@/types/inventory"

// ── Write-off confirmation dialog ────────────────────────────────────────────
const WriteOffDialog = ({ batch, onClose }: { batch: ExpiredBatchAlert; onClose: () => void }) => {
  const writeOff = useWriteOffBatch()
  const [notes, setNotes] = useState("")

  const handleConfirm = async () => {
    try {
      const result = await writeOff.mutateAsync({ batchId: batch.batch_id, notes })
      toast.success(`${result.detail} ${result.quantity_written_off} units removed from stock.`)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Could not write off this batch.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="rise-in w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Write off expired batch</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Batch <span className="font-medium text-foreground">{batch.batch_number}</span> of{" "}
          <span className="font-medium text-foreground">{batch.medicine}</span> expired on{" "}
          <span className="tnum font-medium text-foreground">{batch.expiry_date}</span>. Writing it
          off records the loss in the stock ledger and removes the batch from active inventory.
          This cannot be undone.
        </p>

        <label className="mt-4 block text-xs font-medium text-foreground">
          Disposal notes (optional)
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Disposed per pharmacy policy"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Keep batch
          </button>
          <button
            onClick={handleConfirm}
            disabled={writeOff.isPending}
            className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {writeOff.isPending && <Loader2 size={13} className="animate-spin" />}
            Write off batch
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({
  title, sub, children,
}: { title: string; sub: string; children: React.ReactNode }) => (
  <div className="rounded-lg border bg-card">
    <div className="border-b px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
)

const AlertsPage = () => {
  const [threshold, setThreshold] = useState(10)
  const [expiryDays, setExpiryDays] = useState(30)
  const { data, isLoading, isError, refetch } = useInventorySummary({
    low_stock_threshold: threshold,
    expiry_days: expiryDays,
  })
  const [writeOffTarget, setWriteOffTarget] = useState<ExpiredBatchAlert | null>(null)

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={24} />}
        title="Could not load stock alerts"
        description="The inventory service did not respond. Refresh to try again."
        action={
          <button onClick={() => refetch()} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
            Retry
          </button>
        }
      />
    )
  }

  const allClear =
    !isLoading &&
    data &&
    data.low_stock_count === 0 &&
    data.expiring_soon_count === 0 &&
    data.expired_active_count === 0

  return (
    <div>
      <PageHeader
        title="Stock alerts"
        description="Low stock, expiring, and expired batches that need action"
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-1.5">
              Low stock below
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={e => setThreshold(Math.max(1, Number(e.target.value) || 10))}
                className="tnum w-16 rounded-md border bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex items-center gap-1.5">
              Expiring within
              <input
                type="number"
                min={1}
                value={expiryDays}
                onChange={e => setExpiryDays(Math.max(1, Number(e.target.value) || 30))}
                className="tnum w-16 rounded-md border bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              days
            </label>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : allClear ? (
        <EmptyState
          icon={<CheckCircle2 size={24} />}
          title="All clear"
          description={`No batches below ${threshold} units, and nothing expiring within ${expiryDays} days.`}
        />
      ) : (
        <div className="space-y-4">
          {/* Expired — most urgent, has the write-off action */}
          {data!.expired_active_count > 0 && (
            <SectionCard
              title={`Expired batches (${data!.expired_active_count})`}
              sub="Still counted as active stock — write them off to record the loss"
            >
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {data!.expired_batches.map(b => (
                    <tr key={b.batch_id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{b.medicine}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{b.batch_number}</td>
                      <td className="px-4 py-2.5">
                        <Tag tone="danger" icon={<PackageX size={12} />}>
                          expired {b.expiry_date}
                        </Tag>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setWriteOffTarget(b)}
                          className="rounded-md border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive-soft"
                        >
                          Write off
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {/* Expiring soon */}
          {data!.expiring_soon_count > 0 && (
            <SectionCard
              title={`Expiring within ${data!.expiry_days} days (${data!.expiring_soon_count})`}
              sub="Sell these first — checkout already picks earliest expiry"
            >
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {data!.expiring_soon_batches.map(b => (
                    <tr key={b.batch_id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{b.medicine}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{b.batch_number}</td>
                      <td className="tnum px-4 py-2.5 text-muted-foreground">{b.quantity_available} units</td>
                      <td className="px-4 py-2.5 text-right">
                        <Tag tone="warning" icon={<CalendarClock size={12} />}>
                          expires {b.expiry_date}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          {/* Low stock */}
          {data!.low_stock_count > 0 && (
            <SectionCard
              title={`Low stock (${data!.low_stock_count})`}
              sub={`Below ${data!.low_stock_threshold} units — restock from Inventory`}
            >
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {data!.low_stock_batches.map(b => (
                    <tr key={b.batch_id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{b.medicine}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{b.batch_number}</td>
                      <td className="px-4 py-2.5">
                        <Tag tone="warning" icon={<AlertTriangle size={12} />}>
                          {b.quantity_available} left
                        </Tag>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          to="/admin/inventory"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </div>
      )}

      {writeOffTarget && (
        <WriteOffDialog batch={writeOffTarget} onClose={() => setWriteOffTarget(null)} />
      )}
    </div>
  )
}

export default AlertsPage
