import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { toast } from "sonner"
import { ChevronDown, CircleCheckIcon, Search } from "lucide-react"

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
import { setToken } from "@/lib/api"

import { otpSchema } from "@/features/auth/schemas"
import { useGlobalNamespaces } from "@/features/auth/queries/getGlobalNamespaces"
import { useValidateLoginOtp } from "@/features/auth/mutations/useValidateLoginOtp"
import { getUserDetails } from "@/features/auth/api/getUserDetails"
import { AuthJourney } from "@/features/auth/enums/auth.enum"
import {
  type OtpFormValues,
  type OtpLocationState,
  type OtpPayload,
  type OtpResponse,
} from "@/features/auth/types"
import { useLogin } from "@/features/auth/mutations/login"
import { useSendResetOtp } from "@/features/auth/mutations/sendResetOtp"
import iebaLogo from "@/assets/ieba-logo.png"
import forgotPasswordBg from "@/assets/forgot-password-bg.png"
import mailIcon from "@/assets/login-mail-icon.png"
import submitIcon from "@/assets/login-submit-icon.png"

export function OtpAuthentication() {
  const [countyModalOpen, setCountyModalOpen] = useState(false)
  /** Selected tenant `nameSpace` from global API (display uses `countyName`). */
  const [selectedNameSpace, setSelectedNameSpace] = useState<string | undefined>(undefined)
  const [countyError, setCountyError] = useState(false)
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false)
  const [countySearch, setCountySearch] = useState("")
  const { establishDashboardSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as OtpLocationState | null
  const email = state?.email ?? ""
  const journey = state?.journey ?? AuthJourney.Dashboard
  const hasCredentials =
    journey === AuthJourney.Dashboard
      ? Boolean(state?.email && state?.password)
      : Boolean(state?.email)
  const initialOtp = (state?.otp ?? "").replace(/\D/g, "").slice(0, 6)
  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: initialOtp },
  })
  const {
    register,
    handleSubmit: formHandleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form
  const otpValue = watch("otp")

  const globalNamespacesQuery = useGlobalNamespaces(
    countyModalOpen && hasCredentials && journey === AuthJourney.Dashboard
  )

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

  const resendLoginMutation = useLogin()
  const resendForgotOtpMutation = useSendResetOtp()

  const validateLoginOtpMutation = useValidateLoginOtp()

  if (!hasCredentials) {
    return (
      <Navigate
        to={journey === AuthJourney.ResetPassword ? "/forgot-password" : "/login"}
        replace
      />
    )
  }

  function handleSubmit(values: OtpFormValues) {
    if (journey === AuthJourney.ResetPassword) {
      const otp = values.otp.replace(/\D/g, "").slice(0, 6)
      if (otp.length < 6) {
        toast.error("Enter a valid 6-digit OTP")
        return
      }
      validateLoginOtpMutation.mutate(
        { loginId: email.trim(), otp, journey: AuthJourney.ResetPassword },
        {
          onSuccess: (result) => {
            setToken(result.accessToken)
            toast.success("OTP verified successfully", {
              icon: (
                <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
              ),
            })
            navigate("/reset-password", {
              replace: true,
              state: {
                email: email.trim(),
                userId: result.userId,
              },
            })
          },
          onError: (error) => {
            toast.error(error.message || "OTP verification failed")
          },
        }
      )
      return
    }

    verifyOtpMutation.mutate({ otp: values.otp })
  }

  function handleCountyOk() {
    if (!selectedNameSpace) {
      setCountyError(true)
      return
    }
    const otp = otpValue.replace(/\D/g, "").slice(0, 6)
    if (otp.length < 6) {
      toast.error("Enter a valid 6-digit OTP on the previous step")
      return
    }
    setCountyError(false)
    validateLoginOtpMutation.mutate(
      {
        loginId: email.trim(),
        otp,
        journey: AuthJourney.Dashboard,
        nameSpace: selectedNameSpace,
      },
      {
        onSuccess: async (result) => {
          setToken(result.accessToken)

          // Fetch full user details (roles, departments, permissions, etc.)
          let roles: string[] | undefined
          let permissions: string[] | undefined
          let displayName: string | undefined
          try {
            const details = await getUserDetails(result.userId)
            roles = details.roles?.map((r) => r.name)
            
            // Get flattened permissions from top-level or from roles
            permissions = details.allpermissions
            if (!permissions || permissions.length === 0) {
              // Fallback to concatenating from departmentRoles
              const all = new Set<string>()
              details.departmentsRoles?.forEach(dr => {
                dr.permissions?.forEach(p => all.add(p))
              })
              permissions = Array.from(all)
            }

            displayName =
              details.name ??
              [details.firstName, details.lastName]
                .filter((part) => !!part && part.trim().length > 0)
                .join(" ")
          } catch (error) {
            // If profile call fails, continue with basic session so user can still log in.
          }

          const loginId = email.trim()
          const countyName = selectedCountyLabel?.toUpperCase() ?? ""

          establishDashboardSession({
            id: result.userId,
            name:
              displayName && displayName.trim().length > 0
                ? displayName
                : loginId.includes("@")
                  ? (loginId.split("@")[0] ?? "User")
                  : loginId,
            email: loginId,
            namespace: selectedNameSpace,
            countyName,
            roles,
            permissions,
          })
          setCountyModalOpen(false)
          toast.success("Signed in successfully", {
            icon: (
              <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
            ),
          })
          navigate("/", { replace: true })
        },
        onError: (error) => {
          toast.error(error.message || "OTP verification failed")
        },
      }
    )
  }

  function handleCountyCancel() {
    setCountyModalOpen(false)
    setSelectedNameSpace(undefined)
    setCountyError(false)
    setCountyDropdownOpen(false)
    setCountySearch("")
  }

  function handleCancel() {
    navigate("/login", { replace: true })
  }

  function handleResendOtp() {
    if (journey === AuthJourney.ResetPassword) {
      resendForgotOtpMutation.mutate(
        { loginId: email },
        {
          onSuccess: (data) => {
            const nextOtp =
              data.otp == null ? "" : String(data.otp).replace(/\D/g, "").slice(0, 6)
            if (nextOtp) {
              setValue("otp", nextOtp, { shouldValidate: true })
            }
            navigate(location.pathname, {
              replace: true,
              state: {
                email: (data.loginId || email).trim(),
                otp: nextOtp || undefined,
                journey: AuthJourney.ResetPassword,
              } satisfies OtpLocationState,
            })
            toast.success("OTP sent successfully", {
              icon: (
                <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
              ),
            })
          },
          onError: (error) => {
            toast.error(error.message || "Failed to resend OTP")
          },
        }
      )
      return
    }

    const password = state?.password
    if (!password) return
    resendLoginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.nextPage !== "otp") {
            toast.error("Could not resend OTP. Please sign in again from the login page.")
            return
          }
          const nextOtp = data.otp ?? ""
          setValue("otp", nextOtp, { shouldValidate: true })
          navigate(location.pathname, {
            replace: true,
            state: {
              email: data.loginId,
              password,
              otp: data.otp,
              journey: AuthJourney.Dashboard,
            } satisfies OtpLocationState,
          })
          toast.success("OTP sent successfully", {
            icon: (
              <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
            ),
          })
        },
        onError: (error) => {
          toast.error(error.message || "Failed to resend OTP")
        },
      }
    )
  }

  const namespaceRows = globalNamespacesQuery.data ?? []
  const selectedCountyLabel = namespaceRows.find(
    (row) => row.nameSpace === selectedNameSpace
  )?.countyName

  const filteredCountyOptions = namespaceRows.filter((row) =>
    row.countyName.toLowerCase().includes(countySearch.toLowerCase())
  )

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-x-hidden bg-white px-4 py-8 sm:px-6 sm:py-12">
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

      {/* OTP card: narrower width, taller min height; max-width keeps centering stable */}
      <div className="relative z-10 flex w-full max-w-[420px] min-w-0 shrink-0 justify-center">
        <Card className="flex min-h-[430px] w-full min-w-0 flex-col rounded-[6px] border-gray-100 bg-white py-7 px-5 shadow-login-card font-[Roboto,sans-serif]">
        <CardHeader className="space-y-0 text-center px-0 pt-4">
          <CardTitle className="mb-2 font-normal tracking-tight text-[#212529] text-[39.465px] leading-tight font-['Roboto',sans-serif]">
            OTP Authentication
          </CardTitle>
          <CardDescription className="mb-4 text-[20px] text-[#C4BEBE]">
            Access to our dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
        <form
          onSubmit={formHandleSubmit(handleSubmit)}
          className="mt-3 flex flex-col gap-4"
        >
          <div className="space-y-1.5">
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
              disabled={
                journey === AuthJourney.ResetPassword
                  ? resendForgotOtpMutation.isPending
                  : resendLoginMutation.isPending
              }
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
            disabled={
              journey === AuthJourney.ResetPassword
                ? validateLoginOtpMutation.isPending
                : verifyOtpMutation.isPending
            }
            className="mt-2 h-11 w-full rounded-[6px] border-0 text-[18px] font-medium text-white hover:opacity-90"
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
      </div>

      {/* County picker modal – used only for dashboard journey */}
      <Dialog
        open={journey === AuthJourney.Dashboard ? countyModalOpen : false}
        onOpenChange={(open) => !open && handleCountyCancel()}
      >
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
        <div className="px-8 pb-4 pt-1 sm:px-9">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="mb-3 w-full">
              <h6 className="block text-left text-[16px]  font-normal leading-tight text-[#000000E0]">
                Pick a county to proceed
              </h6>
            </div>
            <div className="relative w-full">
              {countyDropdownOpen ? (
                <div
                  className={`relative flex h-[48px] w-full items-center rounded-[10px] border bg-white ${
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
                  className={`flex h-[48px] w-full items-center justify-between rounded-[10px] border bg-white px-4 text-left ${
                    countyError ? "border-red-500 ring-1 ring-red-500" : "border-[#d9d9d9]"
                  }`}
                >
                  <span className={`text-[14px] ${selectedNameSpace ? "text-[#000000D9]" : "text-[#00000073]"}`}>
                    {selectedCountyLabel?.toUpperCase() ?? "Select county"}
                  </span>
                  <ChevronDown className="h-5 w-5 text-[#00000073]" />
                </button>
              )}

              {countyDropdownOpen && (
                <div className="absolute left-0 top-[52px] z-50 w-full overflow-hidden rounded-[10px] border border-[#d9d9d9] bg-white shadow-md">
                  <div className="max-h-[220px] overflow-y-auto py-1">
                    {globalNamespacesQuery.isLoading && (
                      <div className="px-5 py-2 text-[15px] text-[#00000073]">
                        Loading counties…
                      </div>
                    )}
                    {globalNamespacesQuery.isError && (
                      <div className="space-y-2 px-5 py-2">
                        <p className="text-[15px] text-red-500" role="alert">
                          {globalNamespacesQuery.error instanceof Error
                            ? globalNamespacesQuery.error.message
                            : "Failed to load counties"}
                        </p>
                        <button
                          type="button"
                          onClick={() => void globalNamespacesQuery.refetch()}
                          className="text-sm text-[#6C5DD3] underline underline-offset-2"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {globalNamespacesQuery.isSuccess &&
                      filteredCountyOptions.map((row) => (
                        <button
                          key={row.nameSpace}
                          type="button"
                          onClick={() => {
                            setSelectedNameSpace(row.nameSpace)
                            setCountyError(false)
                            setCountyDropdownOpen(false)
                            setCountySearch("")
                          }}
                          className={`block w-full px-5 py-1.5 text-left text-[14px] ${
                            selectedNameSpace === row.nameSpace
                              ? "bg-[#e6f4ff] font-semibold text-[#000000D9]"
                              : "text-[#000000D9] hover:bg-[#f5f5f5]"
                          }`}
                        >
                          {row.countyName.toUpperCase()}
                        </button>
                      ))}
                    {globalNamespacesQuery.isSuccess && filteredCountyOptions.length === 0 && (
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
              Please select a county
            </p>
          )}
        </div>
        <div className="flex w-full items-center justify-center gap-3 px-8 pb-10 sm:px-9">
          <Button
            type="button"
            onClick={handleCountyOk}
            disabled={validateLoginOtpMutation.isPending}
            className="h-[35px] min-w-[62px] rounded-[6px] border-0 bg-[#6C5DD3] px-4 text-[15px] font-normal text-white hover:bg-[#5f52bd] disabled:opacity-60"
          >
            {validateLoginOtpMutation.isPending ? "Verifying…" : "OK"}
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
