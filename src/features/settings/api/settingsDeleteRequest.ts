import { getToken } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"

/**
 * Authenticated DELETE for settings-related endpoints without sending
 * `Content-Type: application/json` (no request body). The shared `api.delete`
 * always sets that header; some gateways reject it on bodyless DELETE.
 */
export async function settingsDeleteRequest<T = void>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const rawMessage =
      (errorBody as { message?: string | string[] }).message ??
      (errorBody as { error?: string }).error
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : (rawMessage ?? response.statusText)
    throw new Error(message)
  }

  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    const body = (await response.json()) as unknown
    if (
      body &&
      typeof body === "object" &&
      "success" in body &&
      (body as { success?: unknown }).success === false
    ) {
      const raw = (body as { message?: string | string[] }).message
      const msg = Array.isArray(raw)
        ? raw.join(", ")
        : typeof raw === "string" && raw.trim() !== ""
          ? raw
          : "Request failed"
      throw new Error(msg)
    }
    return body as T
  }

  return undefined as T
}
