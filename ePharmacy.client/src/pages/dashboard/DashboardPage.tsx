import { Link } from "react-router-dom"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  AlertTriangle, CalendarClock, FileHeart, PackageX, CheckCircle2,
  Banknote, Package, Users, Clock,
} from "lucide-react"
import { useDashboardStats, useSalesTrend, useTopSelling } from "@/hooks/useReports"
import { StatTile } from "@/components/ui/stat-tile"
import { Tag } from "@/components/ui/tag"
import { EmptyState } from "@/components/ui/empty-state"

const formatRs = (value: number) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

// ── Needs-attention strip ────────────────────────────────────────────────────
const AttentionStrip = () => {
  const { data: stats } = useDashboardStats()
  if (!stats) return null

  const items = [
    {
      count: stats.inventory.low_stock_count,
      label: "low stock",
      icon: <AlertTriangle size={12} />,
      tone: "warning" as const,
      to: "/admin/alerts",
    },
    {
      count: stats.inventory.expiring_soon_count,
      label: "expiring soon",
      icon: <CalendarClock size={12} />,
      tone: "warning" as const,
      to: "/admin/alerts",
    },
    {
      count: stats.inventory.expired_count,
      label: "expired",
      icon: <PackageX size={12} />,
      tone: "danger" as const,
      to: "/admin/alerts",
    },
    {
      count: stats.prescriptions.pending,
      label: "prescriptions pending",
      icon: <FileHeart size={12} />,
      tone: "info" as const,
      to: "/admin/prescriptions",
    },
  ].filter(item => item.count > 0)

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Needs attention
      </span>
      {items.length === 0 ? (
        <Tag tone="success" icon={<CheckCircle2 size={12} />}>All clear</Tag>
      ) : (
        items.map(({ count, label, icon, tone, to }) => (
          <Link key={label} to={to} className="transition-opacity hover:opacity-75">
            <Tag tone={tone} icon={icon}>
              {count} {label}
            </Tag>
          </Link>
        ))
      )}
    </div>
  )
}

// ── Sales trend chart (single emerald series; orders live in the tooltip) ───
const SalesTrendCard = () => {
  const { data, isLoading } = useSalesTrend(30)

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Sales, last 30 days</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Confirmed and later orders — cancelled orders are excluded
      </p>
      <div className="h-56">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-md bg-muted" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.results ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload
                  return (
                    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-popover-foreground">{formatDay(p.date)}</p>
                      <p className="tnum mt-1 text-muted-foreground">Revenue: <span className="font-medium text-popover-foreground">{formatRs(p.revenue)}</span></p>
                      <p className="tnum text-muted-foreground">Orders: <span className="font-medium text-popover-foreground">{p.orders}</span></p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#revFill)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Top selling (ranked list, inline magnitude bars in the same hue) ─────────
const TopSellingCard = () => {
  const { data, isLoading } = useTopSelling({ days: 30, limit: 5 })
  const items = data?.results ?? []
  const max = Math.max(...items.map(i => i.total_quantity), 1)

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Top selling</p>
      <p className="mb-3 text-xs text-muted-foreground">By units sold, last 30 days</p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No sales in this period yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map(item => (
            <li key={item.medicine_id}>
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="truncate font-medium text-foreground">{item.medicine_name}</span>
                <span className="tnum shrink-0 text-muted-foreground">
                  {item.total_quantity} sold · {formatRs(item.total_revenue)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.total_quantity / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats()

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={24} />}
        title="Could not load the dashboard"
        description="The reports service did not respond. Check that the backend is running, then refresh."
        action={
          <button onClick={() => refetch()} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div>
      <AttentionStrip />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Revenue today"
          icon={<Banknote size={15} />}
          value={isLoading ? "—" : formatRs(stats!.revenue.today)}
          sub={isLoading ? undefined : `${formatRs(stats!.revenue.this_month)} this month`}
        />
        <StatTile
          label="Orders today"
          icon={<Package size={15} />}
          value={isLoading ? "—" : stats!.orders.today}
          sub={isLoading ? undefined : `${stats!.orders.total} all time`}
        />
        <StatTile
          label="Pending orders"
          icon={<Clock size={15} />}
          value={isLoading ? "—" : stats!.orders.pending}
          sub="Awaiting confirmation"
        />
        <StatTile
          label="Customers"
          icon={<Users size={15} />}
          value={isLoading ? "—" : stats!.customers.total}
          sub={isLoading ? undefined : `${stats!.customers.new_this_month} new this month`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SalesTrendCard />
        <TopSellingCard />
      </div>
    </div>
  )
}

export default DashboardPage
