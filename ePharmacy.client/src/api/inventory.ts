import { api } from "./axios"
import type {
  BatchList, BatchDetail, CreateBatchRequest,
  UpdateBatchRequest, StockMovement, StockAdjustRequest,
  InventorySummary, WriteOffResponse,
} from "@/types/inventory"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const inventoryApi = {
  // Batches
  getAllBatches: (params?: { medicine?: string; is_active?: boolean; page?: number }) =>
    api.get<Paginated<BatchList>>("/api/inventory/batches/", { params }).then(r => r.data),

  // Fetches every page — for populating dropdowns (e.g. batch picker in stock adjustment).
  getAllBatchesUnpaginated: (params?: { medicine?: string; is_active?: boolean }) =>
    fetchAllPages(page => inventoryApi.getAllBatches({ ...params, page })),

  getBatchById: (id: string) =>
    api.get<BatchDetail>(`/api/inventory/batches/${id}/`).then(r => r.data),

  createBatch: (data: CreateBatchRequest) =>
    api.post<BatchDetail>("/api/inventory/batches/", data).then(r => r.data),

  updateBatch: (id: string, data: UpdateBatchRequest) =>
    api.put<BatchDetail>(`/api/inventory/batches/${id}/`, data).then(r => r.data),

  // Movements
  getAllMovements: (params?: { batch?: string; movement_type?: string; page?: number }) =>
    api.get<Paginated<StockMovement>>("/api/inventory/movements/", { params }).then(r => r.data),

  getBatchMovements: (batchId: string, params?: { page?: number }) =>
    api.get<Paginated<StockMovement>>(`/api/inventory/batches/${batchId}/movements/`, { params }).then(r => r.data),

  // Adjust
  adjust: (data: StockAdjustRequest) =>
    api.post("/api/inventory/adjust/", data).then(r => r.data),

  // Write off an expired batch: records EXPIRED_OUT and deactivates it.
  // Backend rejects batches that have not expired yet.
  writeOff: (batchId: string, notes?: string) =>
    api.post<WriteOffResponse>(`/api/inventory/batches/${batchId}/write-off/`, { notes: notes ?? "" }).then(r => r.data),

  // Summary — thresholds are tunable per request
  getSummary: (params?: { low_stock_threshold?: number; expiry_days?: number }) =>
    api.get<InventorySummary>("/api/inventory/summary/", { params }).then(r => r.data),
}