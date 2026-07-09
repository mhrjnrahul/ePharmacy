import { api } from "./axios"
import type {
  PrescriptionList,
  PrescriptionDetail,
  PrescriptionItem,
  PrescriptionStatus,
} from "@/types/prescription"

export const prescriptionsApi = {
  // Customer: own prescriptions. Staff: all, filterable by status.
  getAll: (params?: { status?: PrescriptionStatus }) =>
    api.get<PrescriptionList[]>("/api/prescriptions/", { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<PrescriptionDetail>(`/api/prescriptions/${id}/`).then(r => r.data),

  // Customer uploads an image or PDF — multipart, not JSON
  upload: (file: File) => {
    const form = new FormData()
    form.append("image", file)
    return api
      .post<PrescriptionDetail>("/api/prescriptions/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(r => r.data)
  },

  approve: (id: string, data: { items?: { medicine: string; approved_quantity: number }[]; notes?: string }) =>
    api.post<PrescriptionDetail>(`/api/prescriptions/${id}/approve/`, data).then(r => r.data),

  reject: (id: string, data: { reason: string; notes?: string }) =>
    api.post<PrescriptionDetail>(`/api/prescriptions/${id}/reject/`, data).then(r => r.data),

  getItems: (id: string) =>
    api.get<PrescriptionItem[]>(`/api/prescriptions/${id}/items/`).then(r => r.data),
}
