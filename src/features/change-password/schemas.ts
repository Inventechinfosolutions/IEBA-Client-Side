import { z } from "zod"

const passwordPolicyMessage =
  "Password must be at least 11 characters long with at least one capital letter and one symbol!"

const passwordPolicy = z
  .string()
  .min(11, passwordPolicyMessage)
  .regex(/[a-z]/, passwordPolicyMessage)
  .regex(/[A-Z]/, passwordPolicyMessage)
  .regex(/\d/, passwordPolicyMessage)
  .regex(/[^A-Za-z0-9]/, passwordPolicyMessage)

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Please enter Old Password"),
    newPassword: passwordPolicy,
    confirmPassword: z.string().min(1, "Please re-enter New Password"),
  })
  .refine((val) => val.newPassword === val.confirmPassword, {
    message: "New password and confirm password should match",
    path: ["confirmPassword"],
  })