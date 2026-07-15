import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom"
import { AlertTriangle } from "lucide-react"

/**
 * Catches uncaught render/loader/action errors anywhere in the route tree
 * (wired as the root route's errorElement in router/index.tsx). Without this,
 * any uncaught exception unmounts the whole app to a blank white screen.
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred."

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive-soft">
        <AlertTriangle size={26} className="text-destructive" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground">Something went wrong</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-2.5">
        <button
          onClick={() => window.location.reload()}
          className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Reload page
        </button>
        <Link
          to="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
