import { API_BASE_URL } from "./config"

const BASE_URL = API_BASE_URL

const TOKEN_KEY = "ieba_token"

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) {
      ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
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

  const contentType = response.headers.get("content-type") ?? ""

  // Binary responses — return as blob without attempting text/JSON parse
  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/vnd.") ||
    contentType.includes("application/octet-stream") ||
    contentType.startsWith("image/")
  ) {
    return (await response.blob()) as T
  }

  // For JSON and all other content types (including 304 responses where the
  // content-type header may be absent), read as text and parse as JSON.
  const bodyText = await response.text()
  if (!bodyText || bodyText.trim() === "") {
    return undefined as T
  }

  try {
    const body = JSON.parse(bodyText) as unknown
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
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Body text is not JSON — wrap in blob as fallback
      return new Blob([bodyText]) as T
    }
    throw e
  }

}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
}
