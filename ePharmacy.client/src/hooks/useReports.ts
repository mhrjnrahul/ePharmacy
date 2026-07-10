import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "@/api/reports"

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: reportsApi.dashboard,
  })

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
