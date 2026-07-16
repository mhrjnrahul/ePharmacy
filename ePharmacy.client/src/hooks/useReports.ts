import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "@/api/reports"

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: reportsApi.dashboard,
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
