import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
)
