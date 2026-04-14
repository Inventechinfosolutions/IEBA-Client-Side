import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Please input your Email Id!").email("Invalid email address"),
  password: z.string().min(1, "Please input your Password!"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Please input your Email Id!").email("Invalid email address"),
})

export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "Please Enter OTP")
    .regex(/^\d{1,6}$/, "OTP must be numeric"),
})

const resetPasswordPolicyMessage =
  "Password should be 7–40 characters with at least one uppercase letter, one number, and one special character."

const resetPasswordPolicy = z
  .string()
  .min(7, resetPasswordPolicyMessage)
  .max(40, resetPasswordPolicyMessage)
  .regex(/[A-Z]/, resetPasswordPolicyMessage)
  .regex(/\d/, resetPasswordPolicyMessage)
  .regex(/[^A-Za-z0-9]/, resetPasswordPolicyMessage)

export const resetPasswordSchema = z
  .object({
    newPassword: resetPasswordPolicy,
    confirmPassword: z.string().min(1, "Please re-enter New Password"),
  })
  .refine((val) => val.newPassword === val.confirmPassword, {
    message: "New password and confirm password should match",
    path: ["confirmPassword"],
  })
