import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { prescriptionsApi } from "@/api/prescriptions"
import type { PrescriptionStatus } from "@/types/prescription"

export const PRESCRIPTIONS_KEY = ["prescriptions"] as const

export const usePrescriptions = (params?: { status?: PrescriptionStatus }) =>
  useQuery({
    queryKey: [...PRESCRIPTIONS_KEY, params],
    queryFn: () => prescriptionsApi.getAll(params),
  })

export const usePrescriptionDetail = (id: string | null) =>
  useQuery({
    queryKey: [...PRESCRIPTIONS_KEY, id],
    queryFn: () => prescriptionsApi.getById(id!),
    enabled: !!id,
  })

export const useUploadPrescription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => prescriptionsApi.upload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY }),
  })
}

export const useApprovePrescription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, items, notes }: {
      id: string
      items?: { medicine: string; approved_quantity: number }[]
      notes?: string
    }) => prescriptionsApi.approve(id, { items, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY }),
  })
}

export const useRejectPrescription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
      prescriptionsApi.reject(id, { reason, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY }),
  })
}
