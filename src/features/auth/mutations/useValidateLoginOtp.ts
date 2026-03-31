import { useMutation } from "@tanstack/react-query"

import {
  validateLoginOtp,
  type ValidateLoginOtpBody,
  type ValidateLoginOtpResult,
} from "../api/validateLoginOtp"
import { authKeys } from "../keys"

export function useValidateLoginOtp() {
  return useMutation<ValidateLoginOtpResult, Error, ValidateLoginOtpBody>({
    mutationKey: authKeys.validateOtp(),
    mutationFn: validateLoginOtp,
  })
}
