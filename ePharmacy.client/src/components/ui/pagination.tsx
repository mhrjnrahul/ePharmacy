import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  pageSize: number
  count: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ page, pageSize, count, onPageChange }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  if (totalPages <= 1) return null

  const start = count === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="tnum text-xs text-muted-foreground">
        Showing {start}–{end} of {count}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <span className="tnum px-2 text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
