import { useMutation } from "@tanstack/react-query"

import { authKeys } from "../keys"
import { sendResetOtp } from "../api/sendResetOtp"
import type { SendResetOtpPayload, SendResetOtpResponse } from "../types"

export function useSendResetOtp() {
  return useMutation<SendResetOtpResponse, Error, SendResetOtpPayload>({
    mutationKey: authKeys.sendResetOtp(),
    mutationFn: sendResetOtp,
  })
}

