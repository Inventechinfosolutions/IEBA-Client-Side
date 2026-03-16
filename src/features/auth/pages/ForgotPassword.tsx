import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import iebaLogo from "@/assets/ieba-logo.png"
import forgotPasswordBg from "@/assets/forgot-password-bg.png"

export function ForgotPassword() {
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: wire to forgot-password API
  }

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-white p-6">
      {/* White-theme background: image inverted so dark asset displays as light, 30% intensity */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none [filter:invert(1)]"
        style={{ backgroundImage: `url(${forgotPasswordBg})` }}
      />
      {/* Logo top-left – ieba-logo.png */}
      <Link
        to="/login"
        className="absolute left-6 top-6 z-10 flex items-center gap-2"
        aria-label="IEBA Home"
      >
        <img
          src={iebaLogo}
          alt="IEBA"
          className="h-9 w-auto object-contain"
        />
        <span className="text-lg font-semibold text-gray-900">I E B A</span>
      </Link>

      {/* Centered Forgot Password card – ref 1st picture: center text, Roboto */}
      <div className="relative z-10 flex w-full justify-center">
        <div className="font-roboto h-[420px] w-[28%] min-w-[320px] rounded-[5px] bg-white opacity-100 py-[2.5%] px-[2%] shadow-login-card">
          <h1 className="text-center text-[30px] font-bold tracking-tight text-gray-900">
            Forgot Password
          </h1>
          <p className="font-roboto mt-1 text-center text-sm text-[#c4bebe] text-[17px]">
            Access to our dashboard
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1" style={{ paddingTop: "3vh" , paddingBottom: "1vh" }}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10 pr-4"
                  autoComplete="email"
                />
              </div>
            </div >
            <Button 
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-blue-500 to-[#8E58F3] text-white hover:opacity-90"
            >
              <span className="flex items-center justify-center gap-2" >
                Submit
                <RefreshCw className="size-4" />
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
