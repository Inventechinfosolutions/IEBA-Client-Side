import { API_BASE_URL } from "@/lib/config"
import { setToken } from "@/lib/api"
import type { ApiEnvelope } from "../types"

export type RefreshSessionData = {
  accessToken: string
  userId: string
  loginId: string
}

function parseRefreshPayload(json: unknown): RefreshSessionData {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid refresh response")
  }
  const root = json as Record<string, unknown>
  const raw = (root.data ?? root) as Record<string, unknown>

  const accessToken = (raw.accessToken ?? raw.access_token) as string | undefined
  const userId = raw.userId ?? raw.user_id
  const loginId = raw.loginId ?? raw.login_id

  if (!accessToken || userId == null || loginId == null) {
    throw new Error("Invalid refresh response: missing token or user")
  }

  return {
    accessToken: String(accessToken),
    userId: String(userId),
    loginId: String(loginId),
  }
}

/**
 * GET `/auth/refresh` — uses httpOnly `refreshToken` cookie; returns new access token in JSON.
 */
export async function refreshSession(): Promise<RefreshSessionData> {
  const url = `${API_BASE_URL}/auth/refresh`
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
  if (json && typeof json === "object") {
    const env = json as ApiEnvelope
    if (env.success === false) {
      throw new Error(env.message ?? "Session expired")
    }
  }

  const data = parseRefreshPayload(json)
  setToken(data.accessToken)
  return data
}
