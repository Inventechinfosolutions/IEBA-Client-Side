import { useState } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { toast } from "sonner"
import { Modal, Select } from "antd"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"

import { type OtpLocationState } from "./types"
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
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState(false)
  const [countyModalOpen, setCountyModalOpen] = useState(false)
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const [countyError, setCountyError] = useState(false)
  const { completeOtpSignIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as OtpLocationState | null
  const email = state?.email ?? ""
  const hasCredentials = Boolean(state?.email && state?.password)

  if (!hasCredentials) {
    return <Navigate to="/login" replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = otp.trim()
    if (!trimmed) {
      setOtpError(true)
      toast.error("Please Enter OTP")
      return
    }
    setOtpError(false)
    setCountyModalOpen(true)
  }

  function handleCountyOk() {
    if (!selectedCounty) {
      setCountyError(true)
      return
    }
    setCountyError(false)
    setCountyModalOpen(false)
    completeOtpSignIn(email)
    toast.success("Signed in successfully")
    navigate("/", { replace: true })
  }

  function handleCountyCancel() {
    setCountyModalOpen(false)
    setSelectedCounty(null)
    setCountyError(false)
  }

  function handleCancel() {
    navigate("/login", { replace: true })
  }

  function handleResendOtp() {
    toast.info("OTP resent to your email")
  }

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
        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
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
               
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  setOtpError(false)
                }}
                onBlur={() => otp.trim() === "" && otpError && setOtpError(true)}
                className={`h-11 rounded-[6px] pl-10 pr-3 text-base font-normal text-gray-900 ${otpError ? "border-red-500 focus-visible:ring-red-500/20" : "border-gray-300"}`}
                autoComplete="one-time-code"
                aria-invalid={otpError}
              />
            </div>
            <div className="min-h-5">
              {otpError && (
                <p className="text-xs text-red-500" role="alert">
                  Please Enter OTP
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <button
              type="button"
              onClick={handleResendOtp}
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
            onClick={() => {
              if (!otp.trim()) setOtpError(true)
            }}
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
      <Modal
        open={countyModalOpen}
        onCancel={handleCountyCancel}
        title={
          <div className="mb-6 flex h-12 w-full items-center justify-center gap-4 pt-4">
            <img
              src={iebaLogo}
              alt="logo"
              className="h-[42px] w-[42px] object-contain"
            />
            <h3 className="font-normal text-[#000000E0] text-[25.786px] leading-tight">
              SuperAdmin IEBA
            </h3>
          </div>
        }
        footer={
          <div className="flex h-8 w-full justify-center gap-3 items-center">
            <Button
              type="button"
              onClick={handleCountyOk}
              className="h-8 rounded-[6px] border-0 bg-[#6C5DD3] px-[15px] font-normal text-white hover:opacity-90"
            >
              OK
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCountyCancel}
              className="h-8 rounded-[6px] border border-gray-300 px-[15px] text-sm font-normal text-[#000000E0] hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        }
        width={520}
        closable
        className="county-modal"
      >
        <div className="py-4 px-6">
          <h6 className="mb-2 block text-[16px] font-normal text-[#000000E0]">
            Pick a county to proceed
          </h6>
          <div className={countyError ? "rounded-[6px] ring-1 ring-red-500" : ""}>
            <Select
              placeholder="Select county"
              value={selectedCounty}
              onChange={(val) => {
                setSelectedCounty(val)
                setCountyError(false)
              }}
              options={COUNTY_OPTIONS}
              className="w-full [&_.ant-select-selector]:min-h-12 [&_.ant-select-selector]:py-2"
              size="large"
              allowClear
            />
          </div>
          {countyError && (
            <p className="mt-1.5 text-xs text-red-500" role="alert">
              Please select the county
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
