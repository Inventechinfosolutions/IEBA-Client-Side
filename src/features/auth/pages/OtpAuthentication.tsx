import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { toast } from "sonner"
import { ChevronDown, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"

import { otpSchema } from "./schemas"
import {
  type CompleteSignInPayload,
  type CompleteSignInResponse,
  type OtpFormValues,
  type OtpLocationState,
  type OtpPayload,
  type OtpResponse,
  type ResendOtpPayload,
  type ResendOtpResponse,
} from "./types"
import iebaLogo from "@/assets/ieba-logo.png"
import forgotPasswordBg from "@/assets/forgot-password-bg.png"
import mailIcon from "@/assets/login-mail-icon.png"
import submitIcon from "@/assets/login-submit-icon.png"

const COUNTY_OPTIONS = [
  { value: "los-angeles", label: "Los Angeles County" },
  { value: "orange", label: "Orange County" },
  { value: "san-diego", label: "San Diego County" },
  { value: "riverside", label: "Riverside County" },
  { value: "san-bernardino", label: "San Bernardino County" },
]

export function OtpAuthentication() {
  const [countyModalOpen, setCountyModalOpen] = useState(false)
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(undefined)
  const [countyError, setCountyError] = useState(false)
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false)
  const [countySearch, setCountySearch] = useState("")
  const { completeOtpSignIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as OtpLocationState | null
  const email = state?.email ?? ""
  const hasCredentials = Boolean(state?.email && state?.password)
  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })
  const {
    register,
    handleSubmit: formHandleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form
  const otpValue = watch("otp")

  if (!hasCredentials) {
    return <Navigate to="/login" replace />
  }

  const verifyOtpMutation = useMutation<OtpResponse, Error, OtpPayload>({
    mutationFn: async (payload) => ({
      verified: payload.otp.trim().length > 0,
    }),
    onSuccess: () => {
      setCountyModalOpen(true)
    },
    onError: (error) => {
      toast.error(error.message || "Invalid OTP")
    },
  })

  const resendOtpMutation = useMutation<ResendOtpResponse, Error, ResendOtpPayload>({
    mutationFn: async () => ({
      message: "OTP resent to your email",
    }),
    onSuccess: (data) => toast.info(data.message),
    onError: (error) => toast.error(error.message || "Failed to resend OTP"),
  })

  const completeSignInMutation = useMutation<
    CompleteSignInResponse,
    Error,
    CompleteSignInPayload
  >({
    mutationFn: async (payload) => {
      completeOtpSignIn(payload.email)
      return { success: true }
    },
    onSuccess: () => {
      toast.success("Signed in successfully")
      navigate("/", { replace: true })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sign in")
    },
  })

  function handleSubmit(values: OtpFormValues) {
    verifyOtpMutation.mutate({ otp: values.otp })
  }

  function handleCountyOk() {
    if (!selectedCounty) {
      setCountyError(true)
      return
    }
    setCountyError(false)
    setCountyModalOpen(false)
    completeSignInMutation.mutate({ email, county: selectedCounty })
  }

  function handleCountyCancel() {
    setCountyModalOpen(false)
    setSelectedCounty(undefined)
    setCountyError(false)
    setCountyDropdownOpen(false)
    setCountySearch("")
  }

  function handleCancel() {
    navigate("/login", { replace: true })
  }

  function handleResendOtp() {
    resendOtpMutation.mutate({ email })
  }

  const selectedCountyLabel = COUNTY_OPTIONS.find(
    (county) => county.value === selectedCounty
  )?.label

  const filteredCountyOptions = COUNTY_OPTIONS.filter((county) =>
    county.label.toLowerCase().includes(countySearch.toLowerCase())
  )

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-white px-6 py-12">
      {/* Same bg as Forgot Password: inverted forgot-password-bg.png, 30% intensity */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none [filter:invert(1)]"
        style={{ backgroundImage: `url(${forgotPasswordBg})` }}
      />
      {/* Top-left: IEBA logo 42×42, IEBA--login container styles */}
      <div className="IEBA--login absolute left-0 top-0 z-10 pt-[24.9297px] pr-[24.9297px] pb-0 pl-[24.9297px] md:left-0">
        <a
          href="/"
          className="flex items-center gap-2.5 font-[Roboto,sans-serif] text-[26px] text-[#212529]"
          aria-label="IEBA Home"
        >
          <img
            src={iebaLogo}
            alt="logo"
            className="h-[42px] w-[42px] object-contain"
          />
          <span className="font">I E B A</span>
        </a>
      </div>

      {/* OTP card – border-radius 6px, ref screenshots */}
      <Card className="relative z-10 h-[400px] w-[28.5%] min-w-[340px] rounded-[6px] border-gray-100 bg-white py-5 px-4 shadow-login-card font-[Roboto,sans-serif]">
        <CardHeader className="space-y-0 text-center px-0 pt-4">
          <CardTitle className="mb-2 font-normal tracking-tight text-[#212529] text-[39.465px] leading-tight font-['Roboto',sans-serif]">
            OTP Authentication
          </CardTitle>
          <CardDescription className="mb-4 text-[20px] text-[#C4BEBE]">
            Access to our dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
        <form onSubmit={formHandleSubmit(handleSubmit)} className="mt-3 space-y-4">
          <div className="space-y-1.5" >
            <label
              htmlFor="otp"
              className="text-sm font-normal text-gray-700"
            >
              OTP
            </label>
            <div className="relative">
              <img
                src={mailIcon}
                alt=""
                className="absolute left-3 top-1/2 h-[22px] w-[22px] -translate-y-1/2 object-contain opacity-70"
              />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                {...register("otp")}
                value={otpValue}
                onChange={(e) => {
                  setValue("otp", e.target.value.replace(/\D/g, "").slice(0, 6), {
                    shouldValidate: true,
                  })
                }}
                className={`h-11 rounded-[6px] pl-10 pr-3 text-base font-normal text-gray-900 ${errors.otp ? "border-red-500 focus-visible:ring-red-500/20" : "border-gray-300"}`}
                autoComplete="one-time-code"
                aria-invalid={!!errors.otp}
              />
            </div>
            <div className="min-h-5">
              {errors.otp && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.otp.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendOtpMutation.isPending}
              className="text-sm font-normal text-[#000000] underline underline-offset-2 hover:text-gray-700"
            >
              Resend OTP
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="h-6 rounded-[6px] border-0 bg-[#DADADA] px-[15px] text-base font-normal text-gray-800 hover:bg-[#d0d0d0]"
            >
              Cancel
            </Button>
          </div>

          <Button
            type="submit"
            disabled={verifyOtpMutation.isPending}
            className="mt-4 h-11 w-full rounded-[6px] border-0 text-[18px] font-medium text-white hover:opacity-90"
            style={{ background: "linear-gradient(90deg, #00c5fb, #6c5dd3)" }}
          >
            <span className="flex items-center justify-center gap-2">
              Submit
              <img src={submitIcon} alt="" className="h-[28px] w-auto object-contain [filter:brightness(0)_invert(1)]" />
            </span>
          </Button>
        </form>
        </CardContent>
      </Card>

      {/* County picker modal – props from screenshots, Tailwind */}
      <Dialog open={countyModalOpen} onOpenChange={(open) => !open && handleCountyCancel()}>
        <DialogContent
          overlayClassName="bg-black/40"
          className="top-[31%] z-[60] w-[min(520px,92vw)] max-w-[92vw] border-0 bg-white p-0 shadow-lg sm:rounded-[6px] [&>button]:hidden"
        >
          <DialogHeader className="px-8 pt-10 sm:px-9">
            <DialogTitle>
              <div className="mb-3 flex w-full items-center justify-center gap-4">
                <img
                  src={iebaLogo}
                  alt="logo"
                  className="h-[42px] w-[42px] object-contain"
                />
                <h3 className="text-[25px] font-normal leading-[1.05] text-[#000000E0]">
                  SuperAdmin IEBA
                </h3>
              </div>
            </DialogTitle>
          </DialogHeader>
        <div className="px-8 pb-10 pt-1 sm:px-9">
          <div className="mb-3 w-full">
            <h6 className="block text-left text-[16px] font-normal leading-tight text-[#000000E0]">
              Pick a county to proceed
            </h6>
          </div>
          <div className="flex w-full justify-center">
            <div className="relative w-full">
              {countyDropdownOpen ? (
                <div
                  className={`relative flex h-[54px] w-full items-center rounded-[14px] border bg-white ${
                    countyError ? "border-red-500 ring-1 ring-red-500" : "border-[#6C5DD3] ring-1 ring-[#6C5DD3]"
                  }`}
                >
                  <Input
                    value={countySearch}
                    onChange={(e) => setCountySearch(e.target.value)}
                    placeholder="Search county"
                    autoFocus
                    className="h-full border-0 bg-transparent pl-4 pr-11 text-[16px] shadow-none focus-visible:ring-0"
                  />
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00000040]" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCountyDropdownOpen(true)
                    setCountySearch("")
                  }}
                  className={`flex h-[54px] w-full items-center justify-between rounded-[14px] border bg-white px-4 text-left ${
                    countyError ? "border-red-500 ring-1 ring-red-500" : "border-[#d9d9d9]"
                  }`}
                >
                  <span className={`text-[16px] ${selectedCounty ? "text-[#000000D9]" : "text-[#00000073]"}`}>
                    {selectedCountyLabel ?? "Select county"}
                  </span>
                  <ChevronDown className="h-5 w-5 text-[#00000073]" />
                </button>
              )}

              {countyDropdownOpen && (
                <div className="absolute left-0 top-[66px] z-50 w-full overflow-hidden rounded-[14px] border border-[#d9d9d9] bg-white shadow-md">
                  <div className="max-h-[220px] overflow-y-auto py-1">
                    {filteredCountyOptions.map((county) => (
                      <button
                        key={county.value}
                        type="button"
                        onClick={() => {
                          setSelectedCounty(county.value)
                          setCountyError(false)
                          setCountyDropdownOpen(false)
                          setCountySearch("")
                        }}
                        className={`block w-full px-5 py-1.5 text-left text-[16px] ${
                          selectedCounty === county.value
                            ? "bg-[#e6f4ff] font-semibold text-[#000000D9]"
                            : "text-[#000000D9] hover:bg-[#f5f5f5]"
                        }`}
                      >
                        {county.label}
                      </button>
                    ))}
                    {filteredCountyOptions.length === 0 && (
                      <div className="px-5 py-2 text-[15px] text-[#00000073]">
                        No county found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {countyError && (
            <p className="mt-1.5 text-center text-xs text-red-500" role="alert">
              Please select the county
            </p>
          )}
        </div>
        <div className="flex w-full items-center justify-center gap-3 px-8 pb-10 sm:px-9">
          <Button
            type="button"
            onClick={handleCountyOk}
            className="h-[35px] min-w-[62px] rounded-[6px] border-0 bg-[#6C5DD3] px-4 text-[15px] font-normal text-white hover:bg-[#5f52bd]"
          >
            OK
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCountyCancel}
            className="h-[35px] min-w-[86px] rounded-[6px] border border-[#d9d9d9] bg-white px-4 text-[15px] font-normal text-[#000000E0] hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
