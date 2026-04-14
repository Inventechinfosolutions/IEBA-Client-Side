import type { z } from "zod"
import type { Control } from "react-hook-form"

import type { changePasswordSchema } from "./schemas"

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export type ChangePasswordPayload = {
  oldPassword: string
  newPassword: string
}

export type ChangePasswordResponse = {
  message: string
}

export type ChangePasswordFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * When true, the dialog cannot be closed/cancelled until password is changed.
   */
  required?: boolean
  /**
   * Called after a successful password change (after dialog closes).
   */
  onSuccess?: () => void
}

export type ChangePasswordFieldName = "oldPassword" | "newPassword" | "confirmPassword"

export type PasswordFieldProps = {
  name: ChangePasswordFieldName
  label: string
  placeholder: string
  error?: string
  control: Control<ChangePasswordFormValues>
  visible: boolean
  onToggleVisible: () => void
  maxLength?: number
}

export type PasswordVisibilityState = {
  oldPassword: boolean
  newPassword: boolean
  confirmPassword: boolean
}