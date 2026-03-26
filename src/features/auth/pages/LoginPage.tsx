import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { setToken } from "@/lib/api"
import { setStoredUser } from "@/lib/auth-storage"

import { type LoginFormValues, type LoginPayload, type LoginResponse } from "./types"
import { loginSchema } from "./schemas"
import loginLogo from "@/assets/login-logo.png"
import loginRightBg from "@/assets/login-right-bg.png"
import mailIcon from "@/assets/login-mail-icon.png"
import passwordIcon from "@/assets/login-password-icon.png"
import submitIcon from "@/assets/login-submit-icon.png"

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { error, clearError } = useAuth()
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
  } = form

  const loginMutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: async (payload) => {
      return { email: payload.email.trim() }
    },
    onSuccess: (data, variables) => {
      clearError()
      navigate("/otp", {
        state: { email: data.email, password: variables.password },
        replace: true,
      })
    },
  })

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate({ email: values.email, password: values.password })
  }

  function handleDevBypass() {
    setToken("dev-token")
    setStoredUser({
      id: "1",
      name: "ieba admin",
      email: "admin@ieba.local",
    })
    toast.success("Dev login enabled")
    window.location.assign("/master-code")
  }

  return (
    <div className="flex min-h-svh w-full flex-nowrap overflow-hidden bg-white">
      <div
        className="relative flex min-h-svh shrink-0 flex-col items-center justify-center overflow-hidden border-0 bg-white bg-cover p-6 pt-[6vh] md:w-[40%] md:p-10 md:pt-[8vh]"
        style={{
          backgroundImage: `url(${loginLogo})`,
          backgroundPosition: "center top",
        }}
      >
        <div className="relative z-10 flex w-full max-w-md flex-col items-center pt-[23vh]">
          <div className="w-full min-h-[430px] max-h-[50vh] overflow-y-auto rounded-[5px] bg-white p-8 shadow-login-card">
            <div className="text-center">
              <h1 className="mb-2 tracking-tight text-[#212529] font-[Roboto,sans-serif] text-[38.465px] leading-tight">
                Login
              </h1>
              <p className="text-[19px] text-gray-500">Access to our dashboard</p>
            </div>
            <form onSubmit={formHandleSubmit(onSubmit)} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <div className="relative">
                  <img
                    src={mailIcon}
                    alt=""
                    className="absolute left-3 top-1/2 h-[22px] w-[22px] -translate-y-1/2 object-contain opacity-70"
                  />
                  <Input
                    type="email"
                    placeholder="Email Id"
                    {...register("email")}
                    className={`h-11 pl-10 pr-4 ${errors.email ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <img
                    src={passwordIcon}
                    alt=""
                    className="absolute left-3 top-1/2 h-[22px] w-[22px] -translate-y-1/2 object-contain opacity-70"
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...register("password")}
                    className={`h-11 pl-10 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>
              <div className="flex justify-start pt-[2vh] pb-[2vh]">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="h-11 w-full rounded-lg border-0 text-[18px] font-medium text-white hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#00c5fb,#6c5dd3)" }}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <img src={submitIcon} alt="" className="h-[28px] w-auto animate-spin object-contain [filter:brightness(0)_invert(1)]" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Login
                    <img src={submitIcon} alt="" className="h-[28px] w-auto object-contain [filter:brightness(0)_invert(1)]" />
                  </span>
                )}
              </Button>
              {import.meta.env.DEV && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDevBypass}
                >
                  Auto Login (UI Only)
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>
      <div
        className="relative hidden min-h-svh min-w-0 flex-1 border-0 bg-[#2563eb] bg-cover bg-center bg-no-repeat md:-ml-px md:block"
        style={{ backgroundImage: `url(${loginRightBg})` }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center p-12">
          <h2 className="pt-[1vh] text-center font-['Roboto',sans-serif] text-[120px] font-bold tracking-tight text-white drop-shadow-md">
            I E B A
          </h2>
        </div>
      </div>
    </div>
  )
}
