import { api } from "./axios"
import type {
  BatchList, BatchDetail, CreateBatchRequest,
  UpdateBatchRequest, StockMovement, StockAdjustRequest
} from "@/types/inventory"

export const inventoryApi = {
  // Batches
  getAllBatches: (params?: { medicine?: string; is_active?: boolean }) =>
    api.get<BatchList[]>("/api/inventory/batches/", { params }).then(r => r.data),

  getBatchById: (id: string) =>
    api.get<BatchDetail>(`/api/inventory/batches/${id}/`).then(r => r.data),

  createBatch: (data: CreateBatchRequest) =>
    api.post<BatchDetail>("/api/inventory/batches/", data).then(r => r.data),

  updateBatch: (id: string, data: UpdateBatchRequest) =>
    api.put<BatchDetail>(`/api/inventory/batches/${id}/`, data).then(r => r.data),

  // Movements
  getAllMovements: (params?: { batch?: string; movement_type?: string }) =>
    api.get<StockMovement[]>("/api/inventory/movements/", { params }).then(r => r.data),

  getBatchMovements: (batchId: string) =>
    api.get<StockMovement[]>(`/api/inventory/batches/${batchId}/movements/`).then(r => r.data),

  // Adjust
  adjust: (data: StockAdjustRequest) =>
    api.post("/api/inventory/adjust/", data).then(r => r.data),

  // Summary
  getSummary: () =>
    api.get("/api/inventory/summary/").then(r => r.data),
}