import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Mail, RefreshCw } from "lucide-react"
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

import iebaLogo from "@/assets/ieba-logo.png"
import forgotPasswordBg from "@/assets/forgot-password-bg.png"

type OtpLocationState = { email: string; password: string }

const COUNTY_OPTIONS = [
  { value: "los-angeles", label: "Los Angeles County" },
  { value: "orange", label: "Orange County" },
  { value: "san-diego", label: "San Diego County" },
  { value: "riverside", label: "Riverside County" },
  { value: "san-bernardino", label: "San Bernardino County" },
]

export function OtpAuthentication() {
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countyModalOpen, setCountyModalOpen] = useState(false)
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as OtpLocationState | null
  const email = state?.email ?? ""
  const password = state?.password ?? ""
  const hasCredentials = Boolean(state?.email && state?.password)

  useEffect(() => {
    if (!hasCredentials) {
      navigate("/login", { replace: true })
    }
  }, [hasCredentials, navigate])

  if (!hasCredentials) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Redirecting to login…</div>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error("Please enter the OTP")
      return
    }
    setCountyModalOpen(true)
  }

  async function handleCountyOk() {
    if (!selectedCounty) {
      toast.error("Please pick a county to proceed")
      return
    }
    setCountyModalOpen(false)
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      toast.success("Signed in successfully")
      navigate("/", { replace: true })
    } catch {
      toast.error("Invalid OTP or session expired")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCountyCancel() {
    setCountyModalOpen(false)
    setSelectedCounty(null)
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
      {/* Top-left: IEBA logo + text – ref 1st pic: gap 8–12px, text-2xl bold */}
      <div className="absolute left-6 top-8 z-10 md:left-12">
        <a href="/" className="flex items-center gap-2.5" aria-label="IEBA Home">
          <img
            src={iebaLogo}
            alt=""
            className="h-8 w-auto object-contain md:h-9"
          />
          <span className="text-2xl font-bold text-gray-900">
            I E B A
          </span>
        </a>
      </div>

      {/* OTP card – Tailwind: .otp--content--center equivalent */}
      <Card className="relative z-10 h-[420px] w-[28%] min-w-[320px] rounded-[5px] border-gray-100 bg-white opacity-100 py-[2.5%] px-[2%] shadow-login-card">
        <CardHeader className="space-y-1 text-center px-0 pt-0">
          <CardTitle className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
            OTP Authentication.
          </CardTitle>
          <CardDescription className="text-sm font-normal text-gray-500 mt-1">
            Access to our dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="otp"
              className="text-sm font-normal text-gray-700"
            >
              OTP
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-11 rounded-lg border-gray-300 pl-10 pr-3 text-base font-normal text-gray-900"
                autoComplete="one-time-code"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-sm font-normal text-gray-900 underline underline-offset-2 hover:text-gray-700"
            >
              Resend OTP
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="h-9 rounded-lg border border-gray-300 bg-gray-200 px-4 text-base font-semibold text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg text-base font-semibold !bg-gradient-to-r !from-[#38BDF8] !via-[#6366F1] !to-[#7C3AED] text-white shadow-auth-card hover:!opacity-95 mt-4"
          >
            {isSubmitting ? (
              "Submitting…"
            ) : (
              <>
                Submit
                <RefreshCw className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>
        </CardContent>
      </Card>

      {/* County picker modal - styled via index.css .county-modal */}
      <Modal
        open={countyModalOpen}
        onCancel={handleCountyCancel}
        title={
          <div className="flex items-center gap-4">
            <img
              src={iebaLogo}
              alt=""
              className="h-12 w-auto object-contain"
            />
            <span className="text-xl font-bold text-gray-900">
              SuperAdmin IEBA
            </span>
          </div>
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={handleCountyOk}
              className="rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              OK
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCountyCancel}
              className="rounded-xl border-gray-300 px-6 py-3 text-base font-medium"
            >
              Cancel
            </Button>
          </div>
        }
        width={560}
        closable
        className="county-modal"
      >
        <div>
          <label className="mb-3 block text-base font-medium text-gray-800">
            Pick a county to proceed
          </label>
          <Select
            placeholder="Select county"
            value={selectedCounty}
            onChange={setSelectedCounty}
            options={COUNTY_OPTIONS}
            className="w-full [&_.ant-select-selector]:min-h-12 [&_.ant-select-selector]:py-2"
            size="large"
            allowClear
          />
        </div>
      </Modal>
    </div>
  )
}
