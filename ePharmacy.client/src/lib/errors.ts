import { isAxiosError } from "axios"

/**
 * DRF error responses come in two shapes: field validation errors
 * `{ field: ["message", ...] }`, or business-rule errors `{ detail: "message" }`.
 * Pulls a human-readable message out of either, falling back to a generic string.
 */
export const extractErrorMessage = (err: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
    const data = err.response.data as Record<string, unknown>
    if (typeof data.detail === "string") return data.detail
    const firstValue = Object.values(data)[0]
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0]
  }
  return fallback
}
