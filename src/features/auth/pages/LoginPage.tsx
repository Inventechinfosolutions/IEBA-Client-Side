import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"

import loginLogo from "@/assets/login-logo.png"
import loginRightBg from "@/assets/login-right-bg.png"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { error, clearError } = useAuth()
  const navigate = useNavigate()

  const emailError = touched.email && !email.trim()
  const passwordError = touched.password && !password.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    clearError()
    if (!email.trim() || !password.trim()) return
    setIsSubmitting(true)
    navigate("/otp", { state: { email: email.trim(), password }, replace: true })
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-svh w-full flex-nowrap overflow-hidden bg-white">
      {/* Left section: 40% width, 3rd image (login-logo.png) as bg – ref 2nd picture */}
      <div
        className="relative flex min-h-svh shrink-0 flex-col items-center justify-center overflow-hidden border-0 bg-white bg-cover p-6 pt-[6vh] md:w-[40%] md:p-10 md:pt-[8vh]"
        style={{
          backgroundImage: `url(${loginLogo})`,
          backgroundPosition: "center top",
        }}
      >
        <div className="relative z-10 flex w-full max-w-md flex-col items-center pt-[18vh]">
          {/* Login card – height capped so it doesn’t feel too tall */}
          <div className="w-full min-h-[430px] max-h-[50vh] overflow-y-auto rounded-[5px] bg-white p-8 shadow-login-card">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Login</h1>
            <p className="mt-1 text-sm text-gray-500">Access to our dashboard</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email Id"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setTouched((t) => ({ ...t, email: true }))
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className={`h-11 pl-10 pr-4 ${emailError ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    autoComplete="email"
                    aria-invalid={emailError}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500">Please input your Email Id!</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setTouched((t) => ({ ...t, password: true }))
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    className={`h-11 pl-10 pr-10 ${passwordError ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    autoComplete="current-password"
                    aria-invalid={passwordError}
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
                {passwordError && (
                  <p className="text-xs text-red-500">Please input your Password!</p>
                )}
              </div>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-gradient-to-r from-sky-400 to-[#8E58F3] text-white hover:opacity-90"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="size-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Login
                    <RefreshCw className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/* Right section: 60% width (2nd picture), 4th image – clipboard/clock illustration + IEBA */}
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
