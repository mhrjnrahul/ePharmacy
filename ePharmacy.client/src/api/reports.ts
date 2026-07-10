import { api } from "./axios"
import type {
  DashboardStats,
  SalesTrendResponse,
  TopSellingResponse,
} from "@/types/reports"

export const reportsApi = {
  dashboard: () =>
    api.get<DashboardStats>("/api/reports/dashboard/").then(r => r.data),

  salesTrend: (days = 30) =>
    api.get<SalesTrendResponse>("/api/reports/sales-trend/", { params: { days } }).then(r => r.data),

  topSelling: (params?: { days?: number; limit?: number }) =>
    api.get<TopSellingResponse>("/api/reports/top-selling/", { params }).then(r => r.data),
}
