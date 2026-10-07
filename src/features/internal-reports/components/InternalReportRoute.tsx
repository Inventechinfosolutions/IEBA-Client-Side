import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useInternalReportAccess } from "../queries/getInternalReportAccess"

/** Route guard for PKI internal reports: GLOBALADMIN only, everyone else goes home. */
export function InternalReportRoute({ children }: { children: ReactNode }) {
  const { allowed, isLoading } = useInternalReportAccess()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-[14px] text-[#6B7280]">
        <Loader2 className="size-4 animate-spin" /> Checking access…
      </div>
    )
  }
  if (!allowed) return <Navigate to="/" replace />
  return <>{children}</>
}
