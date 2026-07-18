import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { BarChart2 } from "lucide-react"
import { useSalesTrend, useTopSelling } from "@/hooks/useReports"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

const RANGES = [
  { days: 7,   label: "7 days"   },
  { days: 30,  label: "30 days"  },
  { days: 90,  label: "90 days"  },
  { days: 365, label: "1 year"   },
]

const formatRs = (value: number) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

const ReportsPage = () => {
  const [days, setDays] = useState(30)
  const { data: trend, isLoading: trendLoading, isError, refetch } = useSalesTrend(days)
  const { data: top, isLoading: topLoading } = useTopSelling({ days, limit: 10 })

  const totalRevenue = trend?.results.reduce((sum, p) => sum + Number(p.revenue), 0) ?? 0
  const totalOrders = trend?.results.reduce((sum, p) => sum + p.orders, 0) ?? 0
  const bestDay = trend?.results.reduce(
    (best, p) => (Number(p.revenue) > Number(best?.revenue ?? 0) ? p : best),
    trend.results[0],
  )

  if (isError) {
    return (
      <EmptyState
        icon={<BarChart2 size={24} />}
        title="Could not load reports"
        description="The reports service did not respond. Refresh to try again."
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
      <PageHeader title="Reports" description="Sales performance and best sellers" />

      {/* Range filter — one row above the charts */}
      <div className="mb-4 flex gap-1 rounded-md bg-muted p-1 w-fit">
        {RANGES.map(r => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              days === r.days ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Revenue" value={trendLoading ? "—" : formatRs(totalRevenue)} sub={`Last ${days} days`} />
        <StatTile label="Orders" value={trendLoading ? "—" : totalOrders} sub={`Last ${days} days`} />
        <StatTile
          label="Best day"
          value={trendLoading || !bestDay || Number(bestDay.revenue) === 0 ? "—" : formatRs(Number(bestDay.revenue))}
          sub={bestDay && Number(bestDay.revenue) > 0 ? formatDay(bestDay.date) : "No sales yet"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Trend */}
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Daily revenue</p>
          <div className="h-64">
            {trendLoading ? (
              <div className="h-full animate-pulse rounded-md bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend?.results ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="reportsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDay}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={48}
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
                          <p className="tnum mt-1 text-muted-foreground">
                            Revenue: <span className="font-medium text-popover-foreground">{formatRs(p.revenue)}</span>
                          </p>
                          <p className="tnum text-muted-foreground">
                            Orders: <span className="font-medium text-popover-foreground">{p.orders}</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#reportsFill)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top selling table */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Top selling</p>
            <p className="text-xs text-muted-foreground">Last {days} days</p>
          </div>
          {topLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : !top || top.results.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No sales in this period.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2">Medicine</th>
                  <th className="tnum px-4 py-2 text-right">Units</th>
                  <th className="tnum px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top.results.map(item => (
                  <tr key={item.medicine_id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">{item.medicine_name}</td>
                    <td className="tnum px-4 py-2 text-right text-muted-foreground">{item.total_quantity}</td>
                    <td className="tnum px-4 py-2 text-right text-muted-foreground">{formatRs(item.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
