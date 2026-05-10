import { useQuery } from "@tanstack/react-query"
import {
  fetchDashboardStats, fetchTopSelling, fetchRecentOrders,
  fetchSalesTrend, fetchExpiryAlerts, fetchReorderSuggestions, fetchStockHealth,
} from "@/api/dashboard"
import {
  TrendingUp, ShoppingCart, DollarSign,
  AlertTriangle, Clock, PackageOpen,
} from "lucide-react"
import {
  ResponsiveContainer, LineChart, Line, Tooltip as ReTooltip,
  XAxis, PieChart, Pie, Cell,
} from "recharts"

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => "Rs. " + n.toLocaleString("en-NP")

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: "#fef9c3", color: "#854d0e", label: "Pending"    },
  CONFIRMED:  { bg: "#dbeafe", color: "#1e40af", label: "Confirmed"  },
  PROCESSING: { bg: "#e0e7ff", color: "#3730a3", label: "Processing" },
  SHIPPED:    { bg: "#cffafe", color: "#155e75", label: "Shipped"    },
  DELIVERED:  { bg: "#dcfce7", color: "#166534", label: "Delivered"  },
  CANCELLED:  { bg: "#fee2e2", color: "#991b1b", label: "Cancelled"  },
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NP", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })

const expiryColor = (days: number) => {
  if (days <= 20) return { bg: "#fee2e2", color: "#991b1b" }
  if (days <= 40) return { bg: "#fef9c3", color: "#854d0e" }
  return { bg: "#ecfdf5", color: "#166534" }
}

// ── stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  sub?: string
  subColor?: string
}

const StatCard = ({ label, value, icon, iconBg, iconColor, sub, subColor }: StatCardProps) => (
  <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", alignItems: "flex-start", gap: "16px" }}>
    <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: iconColor }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "0 0 2px 0" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: subColor ?? "#6b7280", margin: 0 }}>{sub}</p>}
    </div>
  </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: "0 0 16px 0" }}>
    {children}
  </h2>
)

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", ...style }}>
    {children}
  </div>
)

// ── main ──────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { data: stats,       isLoading: statsLoading   } = useQuery({ queryKey: ["dashboard-stats"],      queryFn: fetchDashboardStats      })
  const { data: topSelling,  isLoading: topLoading     } = useQuery({ queryKey: ["top-selling"],          queryFn: fetchTopSelling          })
  const { data: recentOrders,isLoading: ordersLoading  } = useQuery({ queryKey: ["recent-orders"],        queryFn: fetchRecentOrders        })
  const { data: salesTrend,  isLoading: trendLoading   } = useQuery({ queryKey: ["sales-trend"],          queryFn: fetchSalesTrend          })
  const { data: expiry,      isLoading: expiryLoading  } = useQuery({ queryKey: ["expiry-alerts"],        queryFn: fetchExpiryAlerts        })
  const { data: reorder,     isLoading: reorderLoading } = useQuery({ queryKey: ["reorder-suggestions"],  queryFn: fetchReorderSuggestions  })
  const { data: stockHealth, isLoading: healthLoading  } = useQuery({ queryKey: ["stock-health"],         queryFn: fetchStockHealth         })

  const donutData = stockHealth ? [
    { name: "Healthy",      value: stockHealth.healthy,      color: "#059669" },
    { name: "Low Stock",    value: stockHealth.low_stock,    color: "#ca8a04" },
    { name: "Out of Stock", value: stockHealth.out_of_stock, color: "#ef4444" },
  ] : []

  const totalVariants = donutData.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── KPI cards ── */}
      {statsLoading ? (
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading stats...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <StatCard label="Total Revenue"    value={fmt(stats!.total_revenue)}           icon={<DollarSign size={18} />}    iconBg="#ecfdf5" iconColor="#059669" />
          <StatCard label="Total Orders"     value={stats!.total_orders.toLocaleString()} icon={<ShoppingCart size={18} />}  iconBg="#eff6ff" iconColor="#3b82f6" />
          <StatCard label="Total Profit"     value={fmt(stats!.total_profit)}             icon={<TrendingUp size={18} />}    iconBg="#f0fdf4" iconColor="#16a34a" />
          <StatCard label="Low Stock Items"  value={stats!.low_stock_count}               icon={<AlertTriangle size={18} />} iconBg="#fef9c3" iconColor="#ca8a04" sub="Needs restocking"     subColor="#ca8a04" />
          <StatCard label="Pending Orders"   value={stats!.pending_orders}                icon={<Clock size={18} />}         iconBg="#fef2f2" iconColor="#ef4444" sub="Awaiting confirmation" subColor="#ef4444" />
        </div>
      )}

      {/* ── Sales trend + Stock health ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>

        {/* Sales trend sparkline */}
        <Card>
          <SectionTitle>Revenue Trend — Last 7 Days</SectionTitle>
          {trendLoading ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading...</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
                {salesTrend && (
                  <>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Today</p>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
                        {fmt(salesTrend[salesTrend.length - 1].revenue)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Orders</p>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
                        {salesTrend[salesTrend.length - 1].orders}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={salesTrend}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <ReTooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    formatter={(value) => [fmt(Number(value)), "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>

        {/* Stock health donut */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <SectionTitle>Stock Health</SectionTitle>
          {healthLoading ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative", width: "140px", height: "140px" }}>
                <PieChart width={140} height={140}>
                  <Pie data={donutData} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>{totalVariants}</p>
                  <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0 }}>variants</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                {donutData.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

      </div>

      {/* ── Top selling + Recent orders ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card>
          <SectionTitle>Top Selling Products</SectionTitle>
          {topLoading ? <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading...</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Product", "Units Sold", "Revenue"].map((h) => (
                    <th key={h} style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textAlign: "left", paddingBottom: "10px", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSelling?.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: "13px", color: "#111827", padding: "10px 0", borderBottom: i < topSelling.length - 1 ? "1px solid #f9fafb" : "none" }}>{p.name}</td>
                    <td style={{ fontSize: "13px", color: "#6b7280", padding: "10px 0", borderBottom: i < topSelling.length - 1 ? "1px solid #f9fafb" : "none" }}>{p.total_sold.toLocaleString()}</td>
                    <td style={{ fontSize: "13px", color: "#059669", fontWeight: 500, padding: "10px 0", borderBottom: i < topSelling.length - 1 ? "1px solid #f9fafb" : "none" }}>{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <SectionTitle>Recent Orders</SectionTitle>
          {ordersLoading ? <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading...</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Order", "Status", "Amount", "Date"].map((h) => (
                    <th key={h} style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, textAlign: "left", paddingBottom: "10px", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((o, i) => {
                  const s = statusStyles[o.status]
                  return (
                    <tr key={o.id}>
                      <td style={{ fontSize: "13px", color: "#111827", padding: "10px 0", borderBottom: i < recentOrders.length - 1 ? "1px solid #f9fafb" : "none" }}>{o.order_number}</td>
                      <td style={{ padding: "10px 0", borderBottom: i < recentOrders.length - 1 ? "1px solid #f9fafb" : "none" }}>
                        <span style={{ fontSize: "11px", fontWeight: 500, backgroundColor: s.bg, color: s.color, padding: "2px 8px", borderRadius: "20px" }}>{s.label}</span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#059669", fontWeight: 500, padding: "10px 0", borderBottom: i < recentOrders.length - 1 ? "1px solid #f9fafb" : "none" }}>{fmt(o.total_amount)}</td>
                      <td style={{ fontSize: "12px", color: "#9ca3af", padding: "10px 0", borderBottom: i < recentOrders.length - 1 ? "1px solid #f9fafb" : "none" }}>{formatDate(o.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ── Expiry alerts + Reorder suggestions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Expiry alerts */}
        <Card>
          <SectionTitle>Expiry Alerts</SectionTitle>
          {expiryLoading ? <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {expiry?.map((e) => {
                const c = expiryColor(e.days_until_expiry)
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.product_name} — {e.variant_name}
                      </p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
                        SKU: {e.sku} · Stock: {e.stock_level} units
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 500, backgroundColor: c.bg, color: c.color, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                        {e.days_until_expiry}d left
                      </span>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0 0" }}>{e.expiry_date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Reorder suggestions */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <SectionTitle>Reorder Suggestions</SectionTitle>
          </div>
          {reorderLoading ? <p style={{ fontSize: "13px", color: "#9ca3af" }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {reorder?.map((r) => {
                const pct = Math.round((r.stock_level / r.reorder_point) * 100)
                return (
                  <div key={r.id} style={{ padding: "10px 12px", borderRadius: "8px", backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", margin: "0 0 2px 0" }}>
                          {r.product_name} — {r.variant_name}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>SKU: {r.sku}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "12px" }}>
                        <PackageOpen size={13} color="#ef4444" />
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#ef4444" }}>{r.stock_level} left</span>
                      </div>
                    </div>
                    {/* Stock bar */}
                    <div style={{ height: "4px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: pct <= 30 ? "#ef4444" : "#ca8a04", borderRadius: "4px", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>Reorder at {r.reorder_point}</span>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>{pct}% of threshold</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}

export default DashboardPage