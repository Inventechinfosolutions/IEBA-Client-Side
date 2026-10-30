import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/sonner"
import "./index.css"
import "./theme-overrides.css"
import { createAppRouter } from "./routes"
import { SessionExpiredError } from "@/lib/api"

/**
 * Do not retry queries or mutations when the session has expired.
 * The session-expired dialog handles the UX; retrying would spam the
 * backend and potentially show confusing error toasts.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof SessionExpiredError) return false
  return failureCount < 3
}

/** Shared client for mutations/pages (`@/main`). Passed into `createAppRouter` so `routes.tsx` never imports this file. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: shouldRetry,
    },
    mutations: {
      retry: shouldRetry,
    },
  },
})

export const router = createAppRouter(queryClient)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
