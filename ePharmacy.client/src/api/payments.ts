import { api } from "./axios"
import type { PaymentInitiateResponse, PaymentRecord } from "@/types/order"

// NOTE: the backend mounts this app at /api/payment/ (singular)
export const paymentsApi = {
  initiate: (orderId: string) =>
    api.post<PaymentInitiateResponse>("/api/payment/initiate/", { order_id: orderId }).then(r => r.data),

  verify: (data: Record<string, string>) =>
    api.post<PaymentRecord>("/api/payment/verify/", data).then(r => r.data),

  getByOrder: (orderId: string) =>
    api.get<PaymentRecord>(`/api/payment/${orderId}/`).then(r => r.data),

  refund: (orderId: string, reason: string) =>
    api.post<PaymentRecord>(`/api/payment/${orderId}/refund/`, { reason }).then(r => r.data),
}

/** Submits the eSewa form fields programmatically — triggers browser redirect to eSewa. */
export const submitEsewaForm = ({ esewa_payload }: PaymentInitiateResponse) => {
  const { payment_url, ...fields } = esewa_payload

  const form = document.createElement("form")
  form.method = "POST"
  form.action = payment_url

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = key
    input.value = value
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}
