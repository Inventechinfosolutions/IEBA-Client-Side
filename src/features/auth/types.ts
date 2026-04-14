import type { z } from "zod"

import {
  forgotPasswordSchema,
  loginSchema,
  otpSchema,
  resetPasswordSchema,
} from "./schemas"
import type { AuthJourney, AuthNextPage } from "./enums/auth.enum"

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type OtpFormValues = z.infer<typeof otpSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResponse = {
  message: string
  /**
   * Some backends return an interim token (similar to login->otp flow) that must be used
   * as `Authorization: Bearer <token>` when calling `/auth/validate-otp`.
   */
  accessToken?: string
  access_token?: string
  token?: string
  otp?: string | number
}

export type SendResetOtpPayload = {
  loginId: string
}

export type SendResetOtpResponse = {
  message: string
  loginId: string
  otp?: string
}

export type OtpPayload = {
  otp: string
}

export type OtpResponse = {
  verified: boolean
}

/** Tenant key from global namespace API (`nameSpace`); sent when completing OTP county step. */
export type GlobalNamespaceItem = {
  nameSpace: string
  countyName: string
}

export type OtpLocationState = {
  email: string
  /**
   * Present for login OTP journey (used for "Resend OTP" via login API).
   * Omitted for forgot-password OTP journey (resend uses forgot-password API instead).
   */
  password?: string
  otp?: string
  journey?: AuthJourney
}

export type ChangeCountyBody = {
  loginId: string
  nameSpace: string
}

export type ChangeCountyResult = {
  accessToken: string
  /** Normalized namespace returned by the API (falls back to requested `nameSpace`). */
  namespace?: string
  /** Human‑readable county label if backend provides it. */
  countyName?: string
}

export type ApiEnvelope = {
  statusCode?: number | string
  success?: boolean
  message?: string
  data?: Record<string, unknown>
}

export type ResetPasswordPayload = {
  userId: string
  password: string
}

export type ResetPasswordResponse = {
  message: string
}

export type ResetPasswordLocationState = {
  email?: string
  userId?: string
}

// Login API types (kept separate from form types)
export type LoginApiData = {
  userId: string
  loginId: string
  otp?: string | number
  accessToken?: string
  access_token?: string
  token?: string
  nextPage?: AuthNextPage | string
  next_page?: AuthNextPage | string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type LoginResult = {
  userId: string
  loginId: string
  /** Normalized for routing, e.g. `dashboard` | `otp` */
  nextPage: string
  accessToken: string
  otp?: string
}

// Logout API types
export type LogoutApiEnvelope = {
  statusCode?: number | string
  message?: string
  success?: boolean
  data?: unknown
}

// Validate Login OTP API types
export type ValidateLoginOtpBody = {
  loginId: string
  otp: string
  journey: AuthJourney
  nameSpace?: string
}

export type ValidateLoginOtpResult = {
  accessToken: string
  userId: string
}

export type ValidateLoginOtpEnvelope = {
  statusCode?: number | string
  success?: boolean
  message?: string
  data?: {
    accessToken?: string
    access_token?: string
    userId?: string | number
    user_id?: string | number
  }
}

export type ChangeCountyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// User details API response types (used by Auth/OTP flow)

export type UserDetailsUser = {
  loginId: string
}

export type UserDetailsDepartment = {
  id: number
  code?: string
  name: string
}

export type UserDetailsRole = {
  id: number
  name: string
}

export type UserDetailsDepartmentsRole = {
  id: number
  departmentId: number
  roleId: number
  department: {
    id: number
    name: string
  }
  role: {
    id: number
    name: string
  }
  permissions: string[]
}

export type UserDetails = {
  id: string
  positionName?: string
  employeeId?: string
  firstName?: string
  lastName?: string
  name?: string
  status?: string
  tsmins?: number
  user?: UserDetailsUser
  emergencyContact?: {
    id: number
    firstName: string
    lastName: string
    phone: string
    relationship: string
  }
  contacts: unknown[]
  isPasswordChangeRequired?: Record<string, never>
  documents: unknown[]
  addresses: unknown[]
  departments: UserDetailsDepartment[]
  roles: UserDetailsRole[]
  departmentsRoles: UserDetailsDepartmentsRole[]
  allpermissions: string[]
  allowMultiCodes: boolean
  multiCodes: string[] | null
}

export type UserDetailsEnvelope = {
  statusCode?: number | string
  success?: boolean
  message?: string
  data?: UserDetails
}


