import { api } from "./axios"
import type {
  PrescriptionList,
  PrescriptionDetail,
  PrescriptionItem,
  PrescriptionStatus,
} from "@/types/prescription"
import type { Paginated } from "@/types/pagination"
import { fetchAllPages } from "./pagination"

export const prescriptionsApi = {
  // Customer: own prescriptions. Staff: all, filterable by status.
  getAll: (params?: { status?: PrescriptionStatus; page?: number }) =>
    api.get<Paginated<PrescriptionList>>("/api/prescriptions/", { params }).then(r => r.data),

  // Fetches every page — for the account overview stats (pending count across full history).
  getAllUnpaginated: (params?: { status?: PrescriptionStatus }) =>
    fetchAllPages(page => prescriptionsApi.getAll({ ...params, page })),

  getById: (id: string) =>
    api.get<PrescriptionDetail>(`/api/prescriptions/${id}/`).then(r => r.data),

  // Customer uploads an image or PDF — multipart, not JSON. Content-Type must
  // stay unset so the browser appends its own boundary parameter — an
  // explicit "multipart/form-data" value overrides that and Django can't
  // parse the body.
  upload: (file: File) => {
    const form = new FormData()
    form.append("image", file)
    return api
      .post<PrescriptionDetail>("/api/prescriptions/", form, {
        headers: { "Content-Type": undefined },
      })
      .then(r => r.data)
  },

  approve: (id: string, data: { items?: { medicine: string; approved_quantity: number }[]; notes?: string }) =>
    api.post<PrescriptionDetail>(`/api/prescriptions/${id}/approve/`, data).then(r => r.data),

  reject: (id: string, data: { reason: string; notes?: string }) =>
    api.post<PrescriptionDetail>(`/api/prescriptions/${id}/reject/`, data).then(r => r.data),

  getItems: (id: string, params?: { page?: number }) =>
    api.get<Paginated<PrescriptionItem>>(`/api/prescriptions/${id}/items/`, { params }).then(r => r.data),
}
