import { useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { setToken } from "@/lib/api"
import { queryClient } from "@/main"

import { mimicKeys } from "../keys"
import { clearStoredMimicSession } from "../storage"
import { useMimicSession } from "../queries/useMimicSession"

export function MimicBanner({ inline = false }: { inline?: boolean }) {
  const { data: mimic } = useMimicSession()
  const { establishDashboardSession } = useAuth()
  const navigate = useNavigate()

  if (!mimic) return null

  const pill = (
    <div className="inline-flex items-center gap-3 rounded-[3px] bg-[#fc1b1b] px-5 py-1.5 text-[13px] font-medium text-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
      <span>{`Mimicing ${mimic.targetDisplayName}`}</span>
      <button
        type="button"
        className="cursor-pointer rounded-[2px] bg-white px-2 py-0.5 text-[12px] font-medium text-[#111827] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#f9fafb]"
        onClick={() => {
          setToken(mimic.originalToken)
          establishDashboardSession(mimic.originalUser)
          clearStoredMimicSession()
          queryClient.setQueryData(mimicKeys.all, null)
          queryClient.clear()
          navigate("/", { replace: true })
        }}
      >
        Exit
      </button>
    </div>
  )

  if (inline) return pill

  return <div className="flex w-full justify-center px-4 pt-2">{pill}</div>
}

