import { api } from "@/lib/api"

import type { ResetPasswordPayload, ResetPasswordResponse } from "../types"

function normalizeResetPasswordResponse(res: unknown): ResetPasswordResponse {
  if (res && typeof res === "object") {
    const root = res as Record<string, unknown>
    const message = root.message
    if (typeof message === "string" && message.trim()) {
      return { message }
    }
  }
  return { message: "Password updated successfully." }
}

/**
 * POST `/auth/reset-password` (authorized).
 * Assumes an interim token is already stored (from OTP validation).
 */
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const res = await api.post<unknown>("/auth/reset-password", {
    userId: payload.userId,
    password: payload.password,
  })
  return normalizeResetPasswordResponse(res)
}

