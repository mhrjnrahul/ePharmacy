import { api } from "./axios"
import type { PaymentInitiateResponse, PaymentRecord } from "@/types/order"

export const ESEWA_GATEWAY_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"

export const paymentsApi = {
  initiate: (orderId: string) =>
    api.post<PaymentInitiateResponse>("/api/payments/initiate/", { order: orderId }).then(r => r.data),

  verify: (data: Record<string, string>) =>
    api.post<PaymentRecord>("/api/payments/verify/", data).then(r => r.data),

  getByOrder: (orderId: string) =>
    api.get<PaymentRecord>(`/api/payments/${orderId}/`).then(r => r.data),
}

/** Submits the eSewa form fields programmatically — triggers browser redirect to eSewa. */
export const submitEsewaForm = (payload: PaymentInitiateResponse) => {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = ESEWA_GATEWAY_URL

  Object.entries(payload).forEach(([key, value]) => {
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
