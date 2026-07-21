import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "@/api/reports"

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: reportsApi.dashboard,
    // KPIs + sidebar/topbar badges must reflect changes from ANY actor
    // (other staff, a customer placing an order, the seeder) — not only the
    // current user's own mutations. Override the global 5-min staleTime and
    // poll so the numbers stay live without a manual refresh.
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

/** Combined low-stock + expiring-soon + expired count — used by both the sidebar and topbar badges. */
export const useAlertCount = () => {
  const { data: stats } = useDashboardStats()
  return (
    (stats?.inventory.low_stock_count ?? 0) +
    (stats?.inventory.expiring_soon_count ?? 0) +
    (stats?.inventory.expired_count ?? 0)
  )
}

export const useSalesTrend = (days = 30) =>
  useQuery({
    queryKey: ["reports", "sales-trend", days],
    queryFn: () => reportsApi.salesTrend(days),
  })

export const useTopSelling = (params?: { days?: number; limit?: number }) =>
  useQuery({
    queryKey: ["reports", "top-selling", params],
    queryFn: () => reportsApi.topSelling(params),
  })
