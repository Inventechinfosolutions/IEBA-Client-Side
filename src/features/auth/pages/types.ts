import type { z } from "zod"
import { forgotPasswordSchema, loginSchema, otpSchema } from "./schemas"

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type OtpFormValues = z.infer<typeof otpSchema>

export type OtpLocationState = {
  email: string
  password: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  email: string
}

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

export type CompleteSignInPayload = {
  email: string
  county: string
}

export type CompleteSignInResponse = {
  success: boolean
}
