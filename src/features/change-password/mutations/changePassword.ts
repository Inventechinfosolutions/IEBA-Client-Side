import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { delay, MOCK_NETWORK_DELAY_MS } from "../mock"
import { changePasswordKeys } from "../keys"
import type { ChangePasswordPayload, ChangePasswordResponse } from "../types"

function normalizeChangePasswordResponse(res: unknown): ChangePasswordResponse {
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>
    if (typeof r.message === "string" && r.message.trim()) {
      return { message: r.message }
    }
  }
  return { message: "Password changed successfully." }
}

async function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
  // Keeping a small delay so UI matches the rest of the app’s “save” feel.
  if (import.meta.env.DEV) {
    await delay(MOCK_NETWORK_DELAY_MS)
  }

  const res = await api.post<unknown>("/auth/change-password", {
    oldPassword: payload.oldPassword,
    newPassword: payload.newPassword,
  })
  return normalizeChangePasswordResponse(res)
}

export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordPayload>({
    mutationKey: changePasswordKeys.all,
    mutationFn: changePassword,
  })
}

