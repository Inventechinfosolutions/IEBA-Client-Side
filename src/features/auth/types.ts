import type { z } from "zod"

import { forgotPasswordSchema, loginSchema, otpSchema } from "./schemas"

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type OtpFormValues = z.infer<typeof otpSchema>

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResponse = {
  message: string
}

export type OtpPayload = {
  otp: string
}

export type OtpResponse = {
  verified: boolean
}

export type ResendOtpPayload = {
  email: string
}

export type ResendOtpResponse = {
  message: string
}

/** Tenant key from global namespace API (`nameSpace`); sent when completing OTP county step. */
export type GlobalNamespaceItem = {
  nameSpace: string
  countyName: string
}

export type OtpLocationState = {
  email: string
  password: string
  otp?: string
}

