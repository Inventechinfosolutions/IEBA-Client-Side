import { API_BASE_URL } from "@/lib/config"
import type { ApiEnvelope } from "../types"

export type AuthMeData = {
  valid: boolean
  userId: string
  loginId: string
  tenantId: string
}

/**
 * GET `/auth/me` — validates refresh cookie without rotating tokens.
 */
export async function authMe(): Promise<AuthMeData> {
  const url = `${API_BASE_URL}/auth/me`
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  })

  const bodyText = await response.text()
  if (!response.ok) {
    let message = response.statusText
    try {
      const err = JSON.parse(bodyText) as ApiEnvelope
      message = err.message ?? message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const json = bodyText ? (JSON.parse(bodyText) as unknown) : null
  if (!json || typeof json !== "object") {
    throw new Error("Invalid auth/me response")
  }
  const root = json as Record<string, unknown>
  if (root.success === false) {
    throw new Error((root.message as string) ?? "Not authenticated")
  }
  const raw = (root.data ?? root) as Record<string, unknown>
  const userId = raw.userId ?? raw.user_id
  const loginId = raw.loginId ?? raw.login_id
  const tenantId = raw.tenantId ?? raw.tenant_id
  if (userId == null || loginId == null) {
    throw new Error("Invalid auth/me response")
  }
  return {
    valid: raw.valid !== false,
    userId: String(userId),
    loginId: String(loginId),
    tenantId: tenantId != null ? String(tenantId) : "",
  }
}
