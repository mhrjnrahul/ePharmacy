import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inventoryApi } from "@/api/inventory"
import type { CreateBatchRequest, UpdateBatchRequest, StockAdjustRequest } from "@/types/inventory"

export const BATCHES_KEY = ["batches"] as const
export const MOVEMENTS_KEY = ["movements"] as const

export const useBatches = (params?: { medicine?: string; is_active?: boolean }) =>
  useQuery({
    queryKey: [...BATCHES_KEY, params],
    queryFn: () => inventoryApi.getAllBatches(params),
  })

export const useBatchDetail = (id: string | null) =>
  useQuery({
    queryKey: ["batches", id],
    queryFn: () => inventoryApi.getBatchById(id!),
    enabled: !!id,
  })

export const useCreateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBatchRequest) => inventoryApi.createBatch(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BATCHES_KEY }),
  })
}

export const useUpdateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBatchRequest }) =>
      inventoryApi.updateBatch(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BATCHES_KEY }),
  })
}

export const useMovements = (params?: { batch?: string; movement_type?: string }) =>
  useQuery({
    queryKey: [...MOVEMENTS_KEY, params],
    queryFn: () => inventoryApi.getAllMovements(params),
  })

export const useBatchMovements = (batchId: string | null) =>
  useQuery({
    queryKey: ["movements", "batch", batchId],
    queryFn: () => inventoryApi.getBatchMovements(batchId!),
    enabled: !!batchId,
  })

export const useStockAdjust = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StockAdjustRequest) => inventoryApi.adjust(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BATCHES_KEY }),
  })
}

export const useInventorySummary = () =>
  useQuery({
    queryKey: ["inventory-summary"],
    queryFn: inventoryApi.getSummary,
  })