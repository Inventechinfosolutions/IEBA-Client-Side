import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { type ForgotPasswordFormValues } from "./types"
import { forgotPasswordSchema } from "./schemas"
import iebaLogo from "@/assets/ieba-logo.png"
import forgotPasswordBg from "@/assets/forgot-password-bg.png"
import mailIcon from "@/assets/login-mail-icon.png"
import submitIcon from "@/assets/login-submit-icon.png"

export function ForgotPassword() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
  } = form

  function onSubmit(_values: ForgotPasswordFormValues) {
    // TODO: wire to forgot-password API
  }

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-white p-6">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none [filter:invert(1)]"
        style={{ backgroundImage: `url(${forgotPasswordBg})` }}
      />
      <Link
        to="/login"
        className="IEBA--login absolute left-0 top-0 z-10 flex items-center gap-2 pt-[24.9297px] pr-[24.9297px] pb-0 pl-[24.9297px] font-[Roboto,sans-serif] text-[26px] text-[#212529]"
        aria-label="IEBA Home"
      >
        <img
          src={iebaLogo}
          alt="logo"
          className="h-[42px] w-[42px] object-contain"
        />
        <span className="font">I E B A</span>
      </Link>

      <div className="relative z-10 flex w-full justify-center">
        <div className="flex h-[420px] min-w-[320px] w-[28%] flex-col rounded-[6px] bg-white py-5 px-4 shadow-login-card font-[Roboto,sans-serif]">
          <div className="text-center" style={{ paddingTop: "2.3vh" }}>
            <h1 className="mb-2 tracking-tight text-[#212529] text-[39.465px] leading-tight">
              Forgot Password
            </h1>
            <p className="mb-4 text-[20px] text-[#C4BEBE]" style={{ fontFamily: "Roboto, sans-serif" }}>
              Access to our dashboard
            </p>
          </div>
          <form onSubmit={formHandleSubmit(onSubmit)} className="mt-6 flex flex-1 flex-col space-y-4">
            <div className="space-y-1 pt-[3vh] pb-[1vh]">
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
                  className={`h-11 rounded-[6px] pl-10 pr-4 ${errors.email ? "border-red-500 focus-visible:ring-red-500/20" : "border-gray-300"}`}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="mt-auto h-11 w-full rounded-[6px] border-0 text-[18px] font-medium text-white hover:opacity-90 mb-[11vh]"
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
          </form>
        </div>
      </div>
    </div>
  )
}
