import { API_BASE_URL } from "./config"
import { refreshSession } from "@/features/auth/api/refresh"
import { isSigningOut } from "@/features/auth/utils/signOutState"

const BASE_URL = API_BASE_URL

const TOKEN_KEY = "ieba_token"

/** Public auth routes — do not attempt token refresh on 401. */
const NO_REFRESH_ON_401 = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/refresh",
  "/auth/me",
  "/auth/send-otp",
  "/auth/validate-otp",
  "/auth/forgot-password",
])

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
  /** Internal: set when retrying after refresh. */
  _retryAfterRefresh?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (isSigningOut()) return null
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((data) => data.accessToken)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`
}

function shouldAttemptRefresh(path: string, skipAuth: boolean): boolean {
  if (skipAuth) return false
  return !NO_REFRESH_ON_401.has(normalizePath(path))
}

function notifySessionExpired(path: string): void {
  const isPublicPath =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/reset-password" ||
      window.location.pathname === "/forgot-password" ||
      window.location.pathname === "/otp")
  const isLogoutRequest = path.includes("logout")
  if (isPublicPath || isLogoutRequest) return

  if (typeof window !== "undefined" && (window as Window & { showSessionExpired?: () => void }).showSessionExpired) {
    const win = window as Window & {
      showSessionExpired?: () => void
      isSessionExpiredOpen?: boolean
    }
    const isOpen = win.isSessionExpiredOpen
    const isLoggedIn = !!sessionStorage.getItem("ieba_user")
    if (!isOpen && isLoggedIn) {
      win.showSessionExpired?.()
    }
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    _retryAfterRefresh = false,
    body,
    ...fetchOptions
  } = options

  const normalizedPath = normalizePath(path)
  const url = `${BASE_URL}${normalizedPath}`

  const isFormData = body instanceof FormData
  const headers: HeadersInit = {
    ...(!isFormData && { "Content-Type": "application/json" }),
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
    credentials: "include",
    headers,
    body: isFormData ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && shouldAttemptRefresh(normalizedPath, skipAuth) && !_retryAfterRefresh) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequest<T>(path, { ...options, _retryAfterRefresh: true })
    }
    notifySessionExpired(normalizedPath)
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifySessionExpired(normalizedPath)
    }
    const errorBody = await response.json().catch(() => ({}))
    const rawMessage =
      (errorBody as { message?: string | string[] }).message ??
      (errorBody as { error?: string }).error
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : (rawMessage ?? response.statusText)
    throw new Error(message)
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase()

  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/vnd.") ||
    contentType.includes("application/octet-stream") ||
    contentType.startsWith("image/")
  ) {
    return (await response.blob()) as T
  }

  const bodyText = await response.text()
  if (!bodyText || bodyText.trim() === "") {
    return undefined as T
  }

  try {
    const parsed = JSON.parse(bodyText) as unknown
    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as { success?: unknown }).success === false
    ) {
      const raw = (parsed as { message?: string | string[] }).message
      const msg = Array.isArray(raw)
        ? raw.join(", ")
        : typeof raw === "string" && raw.trim() !== ""
          ? raw
          : "Request failed"
      throw new Error(msg)
    }
    return parsed as T
  } catch (e) {
    if (e instanceof SyntaxError) {
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
      body: body as BodyInit | undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body as BodyInit | undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body as BodyInit | undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
}
