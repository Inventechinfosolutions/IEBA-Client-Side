import { useMemo, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { clearToken, getToken } from "@/lib/api"

import { resetPasswordSchema } from "@/features/auth/schemas"
import type { ResetPasswordFormValues, ResetPasswordLocationState } from "@/features/auth/types"
import { useResetPassword } from "@/features/auth/mutations/resetPassword"

import iebaLogo from "@/assets/ieba-logo.png"
import forgotPasswordBg from "@/assets/forgot-password-bg.png"
import passwordIcon from "@/assets/login-password-icon.png"
import submitIcon from "@/assets/login-submit-icon.png"

export function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as ResetPasswordLocationState | null
  const email = (state?.email ?? "").trim()
  const userId = (state?.userId ?? "").trim()

  const token = getToken()
  const canRender = Boolean(
    token && token.trim().length > 0 && email.length > 0 && userId.length > 0
  )

  const [visibility, setVisibility] = useState({
    newPassword: false,
    confirmPassword: false,
  })

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const resetPasswordMutation = useResetPassword()

  const passwordHelperText = useMemo(
    () => "Min 7 chars · 1 uppercase · 1 number · 1 special character",
    []
  )

  function onCancel() {
    clearToken()
    navigate("/login", { replace: true })
  }

  function onSubmit(values: ResetPasswordFormValues) {
    resetPasswordMutation.mutate(
      { userId, password: values.newPassword },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Password updated successfully", {
            position: "top-center",
          })
          clearToken()
          navigate("/login", { replace: true })
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update password", { position: "top-center" })
        },
      }
    )
  }

  if (!canRender) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 [filter:invert(1)]"
        style={{ backgroundImage: `url(${forgotPasswordBg})` }}
      />

      <Link
        to="/login"
        className="IEBA--login absolute left-0 top-0 z-10 flex items-center gap-2 pt-[24.9297px] pr-[24.9297px] pb-0 pl-[24.9297px] font-[Roboto,sans-serif] text-[26px] text-[#212529]"
        aria-label="IEBA Home"
      >
        <img src={iebaLogo} alt="logo" className="h-[42px] w-[42px] object-contain" />
        <span className="font">I E B A</span>
      </Link>

      <div className="relative z-10 flex w-full max-w-[420px] min-w-0 shrink-0 justify-center">
        <Card className="flex w-full min-w-0 flex-col rounded-[6px] border-gray-100 bg-white px-5 py-7 shadow-login-card font-[Roboto,sans-serif]">
          <CardHeader className="space-y-0 px-0 pt-2 text-center">
            <div className="mb-4 flex w-full justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#EEF0FF]">
                <img src={passwordIcon} alt="" className="h-7 w-7 object-contain opacity-90" />
              </div>
            </div>
            <CardTitle className="mb-2 font-normal tracking-tight text-[#212529] text-[35.465px] leading-tight">
              Set password
            </CardTitle>
            <CardDescription className="mb-2 text-[20px] text-[#C4BEBE]">
              Access to our dashboard
            </CardDescription>
            <p className="text-sm text-muted-foreground">
              {email}
            </p>
          </CardHeader>

          <CardContent className="px-0 pt-2">
            <form onSubmit={formHandleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-normal text-gray-700" htmlFor="newPassword">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <img
                    src={passwordIcon}
                    alt=""
                    className="absolute left-3 top-1/2 h-[22px] w-[22px] -translate-y-1/2 object-contain opacity-70"
                  />
                  <Input
                    id="newPassword"
                    type={visibility.newPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    {...register("newPassword")}
                    className={`h-11 rounded-[6px] pl-10 pr-11 text-base font-normal text-gray-900 ${
                      errors.newPassword ? "border-red-500 focus-visible:ring-red-500/20" : "border-gray-300"
                    }`}
                    autoComplete="new-password"
                    aria-invalid={!!errors.newPassword}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisibility((prev) => ({ ...prev, newPassword: !prev.newPassword }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={visibility.newPassword ? "Hide password" : "Show password"}
                  >
                    {visibility.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="min-h-5">
                  {errors.newPassword ? (
                    <p className="text-xs text-red-500">{errors.newPassword.message}</p>
                  ) : (
                    <p className="text-xs text-[#6C5DD3]">{passwordHelperText}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-normal text-gray-700" htmlFor="confirmPassword">
                  RE-ENTER NEW PASSWORD
                </label>
                <div className="relative">
                  <img
                    src={passwordIcon}
                    alt=""
                    className="absolute left-3 top-1/2 h-[22px] w-[22px] -translate-y-1/2 object-contain opacity-70"
                  />
                  <Input
                    id="confirmPassword"
                    type={visibility.confirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    {...register("confirmPassword")}
                    className={`h-11 rounded-[6px] pl-10 pr-11 text-base font-normal text-gray-900 ${
                      errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500/20" : "border-gray-300"
                    }`}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisibility((prev) => ({
                        ...prev,
                        confirmPassword: !prev.confirmPassword,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={visibility.confirmPassword ? "Hide password" : "Show password"}
                  >
                    {visibility.confirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="min-h-5">
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || resetPasswordMutation.isPending}
                className="mt-2 h-11 w-full rounded-[6px] border-0 text-[18px] font-medium text-white hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#00c5fb,#6c5dd3)" }}
              >
                <span className="flex items-center justify-center gap-2">
                  Submit
                  <img
                    src={submitIcon}
                    alt=""
                    className="h-[28px] w-auto object-contain [filter:brightness(0)_invert(1)]"
                  />
                </span>
              </Button>

              <div className="flex w-full justify-end pt-1">
                <Button
                  type="button"
                  onClick={onCancel}
                  className="h-[50px] w-[130px] rounded-[10px] border-0 bg-[#DADADA] px-5 text-[16px] font-normal text-black hover:bg-[#d0d0d0]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

