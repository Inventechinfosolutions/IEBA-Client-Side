import { api } from "@/lib/api"

import { setToken } from "@/lib/api"

import type { ApiEnvelope, ForgotPasswordPayload, ForgotPasswordResponse } from "../types"

function normalizeForgotPasswordResponse(res: unknown): ForgotPasswordResponse {
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>
    const data = (r.data ?? r) as Record<string, unknown>
    const msg = r.message
    if (typeof msg === "string" && msg.trim()) {
      return {
        message: msg,
        accessToken: data.accessToken as string | undefined,
        access_token: data.access_token as string | undefined,
        token: data.token as string | undefined,
        otp: data.otp as string | number | undefined,
      }
    }
    const env = res as ApiEnvelope
    if (typeof env.message === "string" && env.message.trim()) {
      return {
        message: env.message,
        accessToken: (env.data as Record<string, unknown> | undefined)?.accessToken as string | undefined,
        access_token: (env.data as Record<string, unknown> | undefined)?.access_token as string | undefined,
        token: (env.data as Record<string, unknown> | undefined)?.token as string | undefined,
        otp: (env.data as Record<string, unknown> | undefined)?.otp as string | number | undefined,
      }
    }
  }
  return { message: "If the email exists, a reset link has been sent." }
}

/**
 * POST `/auth/forgot-password` (public).
 * Sends an email reset link / OTP depending on backend configuration.
 */
export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  const res = await api.post<unknown>(
    "/auth/forgot-password",
    { email: payload.email.trim() },
    { skipAuth: true }
  )
  const normalized = normalizeForgotPasswordResponse(res)

  const interimToken =
    normalized.accessToken ?? normalized.access_token ?? normalized.token
  if (interimToken && interimToken.trim()) {
    setToken(interimToken)
  }

  return normalized
}

