import { useMutation } from "@tanstack/react-query"

import { authKeys } from "../keys"
import { resetPassword } from "../api/resetPassword"
import type { ResetPasswordPayload, ResetPasswordResponse } from "../types"

export function useResetPassword() {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordPayload>({
    mutationKey: authKeys.resetPassword(),
    mutationFn: resetPassword,
  })
}

