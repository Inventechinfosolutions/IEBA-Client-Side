import { api } from "@/lib/api"
import type { LogoutApiEnvelope } from "../types"

/**
 * POST `/auth/logout`.
 * Expects a success-style payload, e.g. `{ "statusCode": 0, "message": "Success" }`
 * or the same wrapped inside a `data` property.
 */
export async function logout(): Promise<void> {
  const body = await api.post<LogoutApiEnvelope | LogoutApiEnvelope>("/auth/logout")

  let statusCode: number | undefined
  let message: string | undefined

  if (body && typeof body === "object") {
    const root = body as LogoutApiEnvelope
    const source = (root.data && typeof root.data === "object"
      ? (root.data as LogoutApiEnvelope)
      : root) as LogoutApiEnvelope

    if (source.statusCode !== undefined && source.statusCode !== null) {
      const numeric = Number(source.statusCode)
      if (Number.isFinite(numeric)) {
        statusCode = numeric
      }
    }
    message = source.message

    if (source.success === false) {
      throw new Error(message ?? "Logout failed")
    }
  }

  // If backend follows the `{ statusCode: 0, message: "Success" }` contract, treat 0 as success.
  if (statusCode !== undefined && statusCode !== 0) {
    throw new Error(message ?? "Logout failed")
  }
}

