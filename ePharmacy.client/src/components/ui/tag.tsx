import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types/order"
import type { PrescriptionStatus } from "@/types/prescription"
import type { ShipmentStatus } from "@/types/shipment"

/**
 * Dispensary tag — the one label component for the whole app.
 * Carries the domain vocabulary: order/prescription/shipment status,
 * Rx-required, stock levels, expiry. Styled like the small printed
 * labels on pharmacy shelving.
 */

export type TagTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral"

const TONE_CLASSES: Record<TagTone, string> = {
  primary: "bg-primary-soft text-accent-foreground",
  success: "bg-primary-soft text-accent-foreground",
  warning: "bg-warning-soft text-warning",
  danger:  "bg-destructive-soft text-destructive",
  info:    "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
}

interface TagProps {
  tone?: TagTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export const Tag = ({ tone = "neutral", icon, className, children }: TagProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap",
      TONE_CLASSES[tone],
      className,
    )}
  >
    {icon}
    {children}
  </span>
)

// ── Status → tone maps (single source of truth) ──────────────────────────────

export const ORDER_STATUS_TONE: Record<OrderStatus, TagTone> = {
  pending:    "warning",
  confirmed:  "info",
  processing: "info",
  shipped:    "primary",
  delivered:  "success",
  cancelled:  "danger",
}

export const PRESCRIPTION_STATUS_TONE: Record<PrescriptionStatus, TagTone> = {
  pending:  "warning",
  approved: "success",
  rejected: "danger",
}

export const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, TagTone> = {
  preparing:        "warning",
  dispatched:       "info",
  out_for_delivery: "primary",
  delivered:        "success",
  failed:           "danger",
}

export const OrderStatusTag = ({ status }: { status: OrderStatus }) => (
  <Tag tone={ORDER_STATUS_TONE[status]}>{status}</Tag>
)

export const PrescriptionStatusTag = ({ status }: { status: PrescriptionStatus }) => (
  <Tag tone={PRESCRIPTION_STATUS_TONE[status]}>{status}</Tag>
)

export const ShipmentStatusTag = ({ status }: { status: ShipmentStatus }) => (
  <Tag tone={SHIPMENT_STATUS_TONE[status]}>{status.replace(/_/g, " ")}</Tag>
)

export const RxTag = () => <Tag tone="info">Rx required</Tag>

export const StockTag = ({ available }: { available: number }) => {
  if (available <= 0) return <Tag tone="danger">Out of stock</Tag>
  if (available < 10) return <Tag tone="warning">Low stock · {available} left</Tag>
  return <Tag tone="success">In stock</Tag>
}
