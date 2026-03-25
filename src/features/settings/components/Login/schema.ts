import { z } from "zod"

export const loginSettingsSchema = z.object({
  twoFactorAuthentication: z.boolean().default(false),
  otpValidationTimerSeconds: z.coerce
    .number()
    .int()
    .min(1, "OTP Validation Timer is required")
    .max(9999, "OTP Validation Timer is too large"),
})

