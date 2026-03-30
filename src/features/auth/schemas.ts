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
