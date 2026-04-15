import { useMutation } from "@tanstack/react-query"

import { authKeys } from "../keys"
import { forgotPassword } from "../api/forgotPassword"
import type { ForgotPasswordPayload, ForgotPasswordResponse } from "../types"

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordPayload>({
    mutationKey: authKeys.forgotPassword(),
    mutationFn: forgotPassword,
  })
}

