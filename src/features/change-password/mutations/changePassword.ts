import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { delay, MOCK_NETWORK_DELAY_MS } from "../mock"
import { changePasswordKeys } from "../keys"
import type { ChangePasswordPayload, ChangePasswordResponse } from "../types"

async function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
  // If backend endpoint differs, update this path only.
  // Keeping a small delay so UI matches the rest of the app’s “save” feel.
  if (import.meta.env.DEV) {
    await delay(MOCK_NETWORK_DELAY_MS)
  }
  return api.post<ChangePasswordResponse>("/user/change-password", payload)
}

export function useChangePassword() {
  return useMutation({
    mutationKey: changePasswordKeys.all,
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  })
}

