import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inventoryApi } from "@/api/inventory"
import type { CreateBatchRequest, UpdateBatchRequest, StockAdjustRequest } from "@/types/inventory"

export const BATCHES_KEY = ["batches"] as const
export const MOVEMENTS_KEY = ["movements"] as const

export const useBatches = (params?: { medicine?: string; is_active?: boolean; page?: number }) =>
  useQuery({
    queryKey: [...BATCHES_KEY, params],
    queryFn: () => inventoryApi.getAllBatches(params),
  })

/** All matching batches, unpaginated — for dropdowns/selects, not the inventory list page. */
export const useAllBatches = (params?: { medicine?: string; is_active?: boolean }, enabled = true) =>
  useQuery({
    queryKey: [...BATCHES_KEY, "all", params],
    queryFn: () => inventoryApi.getAllBatchesUnpaginated(params),
    enabled,
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
    onSuccess: () => {
      // Creating a batch also records an initial purchase movement and
      // shifts the summary counts (active batches, low stock, etc.)
      qc.invalidateQueries({ queryKey: BATCHES_KEY })
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY })
      qc.invalidateQueries({ queryKey: ["inventory-summary"] })
      qc.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export const useUpdateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBatchRequest }) =>
      inventoryApi.updateBatch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BATCHES_KEY })
      qc.invalidateQueries({ queryKey: ["inventory-summary"] })
      qc.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export const useMovements = (params?: { batch?: string; movement_type?: string; page?: number }) =>
  useQuery({
    queryKey: [...MOVEMENTS_KEY, params],
    queryFn: () => inventoryApi.getAllMovements(params),
  })

export const useBatchMovements = (batchId: string | null, params?: { page?: number }) =>
  useQuery({
    queryKey: ["movements", "batch", batchId, params],
    queryFn: () => inventoryApi.getBatchMovements(batchId!, params),
    enabled: !!batchId,
  })

export const useStockAdjust = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StockAdjustRequest) => inventoryApi.adjust(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BATCHES_KEY })
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY })
      qc.invalidateQueries({ queryKey: ["inventory-summary"] })
      qc.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}

export const useInventorySummary = (params?: { low_stock_threshold?: number; expiry_days?: number }) =>
  useQuery({
    queryKey: ["inventory-summary", params],
    queryFn: () => inventoryApi.getSummary(params),
  })

export const useWriteOffBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ batchId, notes }: { batchId: string; notes?: string }) =>
      inventoryApi.writeOff(batchId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BATCHES_KEY })
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY })
      qc.invalidateQueries({ queryKey: ["inventory-summary"] })
      qc.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}