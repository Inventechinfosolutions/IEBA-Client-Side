import { useMutation } from "@tanstack/react-query"

import { validateLoginOtp } from "../api/validateLoginOtp"
import type { ValidateLoginOtpBody, ValidateLoginOtpResult } from "../types"
import { authKeys } from "../keys"

export function useValidateLoginOtp() {
  return useMutation<ValidateLoginOtpResult, Error, ValidateLoginOtpBody>({
    mutationKey: authKeys.validateOtp(),
    mutationFn: validateLoginOtp,
  })
}
