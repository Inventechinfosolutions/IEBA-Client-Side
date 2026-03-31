import { api, getToken } from "@/lib/api"

export type ValidateLoginOtpBody = {
  loginId: string
  otp: string
  journey: "dashboard" | "resetpassword" | "login"
  nameSpace?: string
}

export type ValidateLoginOtpResult = {
  accessToken: string
  userId: string
}

type ApiEnvelope = {
  statusCode?: number | string
  success?: boolean
  message?: string
  data?: {
    accessToken?: string
    access_token?: string
    userId?: string
    user_id?: string
  }
}

function throwIfEnvelopeFailed(res: ApiEnvelope, fallbackMessage: string): void {
  if (res.success === false) {
    throw new Error(res.message ?? fallbackMessage)
  }
  if (res.statusCode !== undefined && res.statusCode !== null) {
    const code = Number(res.statusCode)
    if (Number.isFinite(code) && code !== 0) {
      throw new Error(res.message ?? fallbackMessage)
    }
  }
}

/**
 * POST `/auth/validate-otp`.
 * Sends `Authorization: Bearer <accessToken>` from login (interim JWT with e.g. `otp:verify`).
 * Response replaces the session with the full `accessToken` + `userId` in `data`.
 */
export async function validateLoginOtp(
  body: ValidateLoginOtpBody
): Promise<ValidateLoginOtpResult> {
  const sessionToken = getToken()
  if (!sessionToken?.trim()) {
    throw new Error(
      "Missing access token. Log in again — the login accessToken must be stored before calling validate OTP."
    )
  }

  const res = await api.post<ApiEnvelope>("/auth/validate-otp", body)

  throwIfEnvelopeFailed(res, "OTP validation failed")

  const d = res.data
  if (!d || typeof d !== "object") {
    throw new Error("Invalid validate-otp response")
  }

  const accessToken = d.accessToken ?? d.access_token
  const userId = d.userId ?? d.user_id
  if (!accessToken || !userId) {
    throw new Error("Invalid validate-otp response: missing accessToken or userId")
  }

  return { accessToken, userId: String(userId) }
}
