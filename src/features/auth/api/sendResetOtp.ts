import { api, setToken } from "@/lib/api"

import type { ApiEnvelope, SendResetOtpPayload, SendResetOtpResponse } from "../types"

function normalizeSendResetOtpResponse(res: unknown): SendResetOtpResponse {
  if (res && typeof res === "object") {
    const root = res as Record<string, unknown>
    const env = res as ApiEnvelope
    const data = (root.data ?? root) as Record<string, unknown>

    const message =
      (typeof root.message === "string" && root.message.trim()
        ? root.message
        : typeof env.message === "string" && env.message.trim()
          ? env.message
          : "OTP sent successfully") as string

    const otpRaw = data.otp as string | number | undefined
    const otp = otpRaw == null ? undefined : String(otpRaw).replace(/\D/g, "").slice(0, 6)

    const loginIdRaw = (data.loginId ?? root.loginId) as string | undefined
    const loginId = typeof loginIdRaw === "string" && loginIdRaw.trim() ? loginIdRaw : ""

    return { message, loginId, otp }
  }
  return { message: "OTP sent successfully", loginId: "" }
}


export async function sendResetOtp(payload: SendResetOtpPayload): Promise<SendResetOtpResponse> {
  const res = await api.post<unknown>(
    "/auth/send-otp",
    {
      loginId: payload.loginId.trim(),
    },
    { skipAuth: true }
  )

  // If backend returns an interim token, store it so `/auth/validate-otp` can run.
  if (res && typeof res === "object") {
    const root = res as Record<string, unknown>
    const data = (root.data ?? root) as Record<string, unknown>
    const token = (data.access_token ?? root.access_token) as string | undefined
    if (token && token.trim()) {
      setToken(token)
    }
  }

  return normalizeSendResetOtpResponse(res)
}

