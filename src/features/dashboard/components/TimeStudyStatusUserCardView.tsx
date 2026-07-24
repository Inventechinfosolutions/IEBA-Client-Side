import type { ReactNode } from "react"
import { Eye, Bell, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import type { TimeStudyStatusUser, ModalVariant } from "./TimeStudyStatusModal"

export interface TimeStudyStatusUserCardViewProps {
  rows: TimeStudyStatusUser[]
  isLoading?: boolean
  variant: ModalVariant
  showDate?: boolean
  isNotSubmitted?: boolean
  onViewUser: (user: TimeStudyStatusUser) => void
  onNotifyUser?: (user: TimeStudyStatusUser) => void
  footer?: ReactNode
}

export function TimeStudyStatusUserCardView({
  rows,
  isLoading,
  variant,
  showDate,
  isNotSubmitted,
  onViewUser,
  onNotifyUser,
  footer,
}: TimeStudyStatusUserCardViewProps) {
  return (
    <div className="block md:hidden px-3.5 sm:px-6 space-y-3">
      {isLoading ? (
        <div className="py-8 text-center">
          <Spinner className="mx-auto h-8 w-8 text-[#6C5DD3]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-[#9ca3af]">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">No records found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2.5 w-full min-w-0">
          {rows.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#6C5DD3]/30 transition-all flex items-center justify-between gap-3 text-[12px]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#111827] text-[13px] truncate">
                  {user.name}
                </p>
                <p className="text-[11px] font-normal text-[#6b7280] truncate mt-0.5">
                  {user.department}
                </p>
                {showDate && user.date && (
                  <p className="text-[10px] font-normal text-[#9ca3af] mt-1">
                    {user.date}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onViewUser(user)}
                  className="flex h-8 px-3 items-center justify-center gap-1 rounded-lg border border-[#6C5DD3] bg-[#6C5DD3] text-white text-[11px] font-medium transition-all shadow-sm hover:bg-[#5B4DBF] active:scale-95"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                {isNotSubmitted && onNotifyUser && (
                  <button
                    type="button"
                    onClick={() => onNotifyUser(user)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#d97706] transition-all hover:bg-[#d97706] hover:text-white active:scale-95 shadow-sm"
                    title="Send Notification"
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
