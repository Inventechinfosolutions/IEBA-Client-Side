import { api, setToken } from "@/lib/api"

/** Form uses “email”; backend expects `loginId` (often the same value). */
export type LoginCredentials = {
  email: string
  password: string
}

type LoginApiData = {
  userId: string
  loginId: string
  accessToken?: string
  access_token?: string
  token?: string
  nextPage?: string
  next_page?: string
}

/** Nest-style envelope from `ApiResponseDto.success(result, …)`. */
type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

export type LoginResult = {
  userId: string
  loginId: string
 /** Normalized for routing, e.g. `dashboard` | `otp` */
  nextPage: string
}

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

  return {
    userId: String(userId),
    loginId: String(loginId),
    accessToken,
    nextPage,
  }
}

function extractAccessToken(data: LoginApiData): string {
  return data.accessToken ?? data.access_token ?? data.token ?? ""
}

/**
 * POST `/auth/login` (public). Persists Bearer token when the API returns one
 * (needed for both full dashboard sessions and the OTP step).
 */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const body = await api.post<ApiEnvelope<LoginApiData> | LoginApiData>(
    "/auth/login",
    {
      loginId: credentials.email.trim(),
      password: credentials.password,
    },
    { skipAuth: true }
  )

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
  }
}
