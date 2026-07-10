import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-14 text-center">
    {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
