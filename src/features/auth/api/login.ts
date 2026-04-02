import { api, setToken } from "@/lib/api"
import type {
  ApiEnvelope,
  LoginApiData,
  LoginCredentials,
  LoginResult,
} from "../types"

function parseLoginPayload(json: unknown): LoginApiData {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid login response")
  }
  const root = json as Record<string, unknown>
  const raw = (root.data ?? root) as Record<string, unknown>

  const userId = raw.userId ?? raw.user_id
  const loginId = raw.loginId ?? raw.login_id
  if (userId == null || loginId == null) {
    throw new Error("Invalid login response: missing userId or loginId")
  }

  const accessToken =
    (raw.accessToken ?? raw.access_token ?? raw.token) as string | undefined
  const nextPage = (raw.nextPage ?? raw.next_page ?? "dashboard") as string
  const otp = raw.otp as string | number | undefined

  return {
    userId: String(userId),
    loginId: String(loginId),
    otp,
    accessToken,
    nextPage,
  }
}

function extractAccessToken(data: LoginApiData): string {
  return data.accessToken ?? data.access_token ?? data.token ?? ""
}

/**
 * POST `/auth/login` (public).
 * When `nextPage` is `otp`, persists the interim `data.accessToken` via `setToken`
 * so `POST /auth/validate-otp` can send `Authorization: Bearer <that token>`.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const body = await api.post<ApiEnvelope | LoginApiData>(
    "/auth/login",
    {
      loginId: credentials.email.trim(),
      password: credentials.password,
    },
    { skipAuth: true }
  )

  if (body && typeof body === "object") {
    const env = body as ApiEnvelope
    if (env.success === false) {
      throw new Error(env.message ?? "Login failed")
    }
    if (env.statusCode !== undefined && env.statusCode !== null) {
      const code = Number(env.statusCode)
      if (Number.isFinite(code) && code !== 0) {
        throw new Error(env.message ?? "Login failed")
      }
    }
  }

  const payload = parseLoginPayload(body)
  const token = extractAccessToken(payload)
  if (!token) {
    throw new Error("Invalid login response: missing access token")
  }
  setToken(token)

  const nextPage = (payload.nextPage ?? "dashboard").toLowerCase()

  return {
    userId: payload.userId,
    loginId: payload.loginId,
    nextPage,
    otp:
      payload.otp == null
        ? undefined
        : String(payload.otp).replace(/\D/g, "").slice(0, 6),
  }
}
