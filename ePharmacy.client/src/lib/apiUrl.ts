// Single source of truth for the backend origin — was previously hardcoded
// to http://127.0.0.1:8000 independently in 6 different files, which meant
// deploying anywhere but localhost required hunting down and editing each
// one (and it was easy to miss one). Falls back to the local dev backend
// when VITE_API_BASE_URL isn't set.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

/** Prefixes a relative media/file path (e.g. from Django's MEDIA_URL) with the API origin. */
export const mediaUrl = (path: string | null | undefined): string | null =>
  path ? (path.startsWith("http") ? path : `${API_BASE_URL}${path}`) : null
