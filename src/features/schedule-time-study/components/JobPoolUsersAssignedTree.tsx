import { Check } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { JobPoolRow } from "@/features/job-pool/types"

import {
  isJobPoolFullySelected,
  isJobPoolUserSelected,
  jobPoolUserDisplayLabel,
} from "../utils/scheduleTimeStudyJobPoolUtils"

type DepartmentUserLookup = {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  user?: { loginId?: string | null } | null
}

export type JobPoolUsersAssignedTreeProps = {
  jobPools: JobPoolRow[]
  selectedJobPoolIds: string[]
  selectedJobPoolUserIds: string[]
  departmentUsers?: DepartmentUserLookup[]
  onToggleJobPool: (jobPoolId: string, checked: boolean) => void
  onToggleUser: (userId: string, jobPoolId: string) => void
  scrollHeightClass?: string
}

function checkboxClass(checked: boolean) {
  return `flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
    checked
      ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
      : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
  }`
}

export function JobPoolUsersAssignedTree({
  jobPools,
  selectedJobPoolIds,
  selectedJobPoolUserIds,
  departmentUsers,
  onToggleJobPool,
  onToggleUser,
  scrollHeightClass = "h-[396px]",
}: JobPoolUsersAssignedTreeProps) {
  return (
    <ScrollArea className={`${scrollHeightClass} pb-2`}>
      <div className="flex flex-col">
        {jobPools.map((jp) => {
          const users = jp.userprofiles ?? []
          const userIdsInPool = users.map((u) => u.id).filter((id) => id !== "")
          const poolSelected = isJobPoolFullySelected(
            jp.id,
            userIdsInPool,
            selectedJobPoolIds,
            selectedJobPoolUserIds,
          )

          return (
            <div key={jp.id} className="border-b border-[#f1f3f7] last:border-b-0">
              <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-5 text-[12px] font-semibold text-[#374151]">
                <span className="min-w-0">{jp.name || "—"}</span>
                <button
                  type="button"
                  aria-label={
                    poolSelected
                      ? `Deselect job pool ${jp.name ?? ""}`
                      : `Select job pool ${jp.name ?? ""}`
                  }
                  onClick={() => onToggleJobPool(jp.id, !poolSelected)}
                  className={checkboxClass(poolSelected)}
                >
                  <Check className="size-3.5 stroke-[3]" />
                </button>
              </div>

              <div className="px-6 py-0.5">
                <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-bold text-[#374151] shadow-sm">
                  Job Pool
                </span>
              </div>

              <div className="flex flex-col pb-2">
                {users.length === 0 ? (
                  <p className="px-6 py-2 text-[12px] text-[#6B7280]">No users in this job pool.</p>
                ) : (
                  users.map((u) => {
                    const checked = isJobPoolUserSelected(
                      u.id,
                      jp.id,
                      selectedJobPoolIds,
                      selectedJobPoolUserIds,
                    )
                    const label = jobPoolUserDisplayLabel(u, departmentUsers)

                    return (
                      <button
                        key={`${jp.id}-${u.id}`}
                        type="button"
                        onClick={() => onToggleUser(u.id, jp.id)}
                        className={`group relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 pl-[60px] pr-5 text-left transition-colors ${
                          checked ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                            <div className="absolute left-4 top-0 h-full w-[1.5px] bg-[#D1D5DB]" />
                            <div className="absolute left-4 top-1/2 h-[1.5px] w-3 bg-[#D1D5DB]" />
                          </div>
                          <div className="pl-6 text-[14px] font-normal text-[#111827] whitespace-normal break-words">
                            {label}
                          </div>
                        </div>
                        <div className={checkboxClass(checked)}>
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
