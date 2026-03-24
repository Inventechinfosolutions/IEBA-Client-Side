import type { z } from "zod"
import { loginSchema, forgotPasswordSchema } from "./schemas"

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export type OtpLocationState = {
  email: string
  password: string
}
