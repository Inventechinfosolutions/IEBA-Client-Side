import { lazy, type ComponentType, type LazyExoticComponent } from "react"

const RELOAD_KEY = "chunk-load-reload"

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message)
  )
}

/**
 * Like React.lazy, but after a deploy the old hashed chunk may 404.
 * Reloads once so the browser picks up the new index.html + asset map.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory()
      sessionStorage.removeItem(RELOAD_KEY)
      return module
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1")
        window.location.reload()
        // Never resolves; page is reloading
        return new Promise(() => {})
      }
      throw error
    }
  })
}
