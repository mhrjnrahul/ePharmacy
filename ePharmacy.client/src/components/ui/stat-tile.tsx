import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  className?: string
}

/** Dashboard stat card. Values render with tabular numerals. */
export const StatTile = ({ label, value, sub, icon, className }: StatTileProps) => (
  <div className={cn("rounded-lg border bg-card p-4 rise-in", className)}>
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {icon && <span className="text-muted-foreground">{icon}</span>}
    </div>
    <p className="tnum mt-2 text-2xl font-bold text-foreground">{value}</p>
    {sub && <p className="tnum mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
)
