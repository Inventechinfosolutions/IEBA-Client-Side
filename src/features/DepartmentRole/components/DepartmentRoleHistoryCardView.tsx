import React from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { DepartmentRoleHistoryRecord } from "../queries/departmentRoleHistory"
import {
  getDepartmentRoleHistoryCreatedAtDisplay,
  getDepartmentRoleHistoryCreatedByDisplay,
  getDepartmentRoleHistoryEffectiveFromDisplay,
  getDepartmentRoleHistoryEffectiveToDisplay,
  getDepartmentRoleHistoryUpdatedAtDisplay,
  getDepartmentRoleHistoryUpdatedByDisplay,
} from "../lib/departmentRoleHistoryDisplay"

export interface DepartmentRoleHistoryCardViewProps {
  data: DepartmentRoleHistoryRecord[]
  isLoading: boolean
  columnLayout?: "audit" | "assignment"
}

export function DepartmentRoleHistoryCardView({
  data,
  isLoading,
  columnLayout = "audit",
}: DepartmentRoleHistoryCardViewProps) {
  const isAssignmentLayout = columnLayout === "assignment"

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`history-card-skeleton-${idx}`}
              className="rounded-[12px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-12 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-12 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No history"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No department role history records found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((row, idx) => (
            <div
              key={`dept-role-hist-card-${row.id}-${idx}`}
              className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] shadow-sm hover:shadow-md transition-all overflow-hidden p-4 space-y-3.5 w-full min-w-0"
            >
              {isAssignmentLayout ? (
                <>
                  {/* Assignment Layout Header */}
                  <div className="bg-[#6C5DD3] px-4 py-3 -mx-4 -mt-4 mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Department Name
                      </div>
                      <div className="text-[13px] font-semibold text-white">
                        {row.departmentName || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Role Name
                      </div>
                      <div className="text-[13px] font-medium text-white">
                        {row.roleName || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Effective From
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        {getDepartmentRoleHistoryEffectiveFromDisplay(row)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Effective To
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        {getDepartmentRoleHistoryEffectiveToDisplay(row)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Audit Layout Header */}
                  <div className="bg-[#6C5DD3] px-4 py-3 -mx-4 -mt-4 mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Department
                      </div>
                      <div className="text-[13px] font-semibold text-white">
                        {row.departmentName || "—"}{" "}
                        {row.departmentCode ? `(${row.departmentCode})` : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Role Name
                      </div>
                      <div className="text-[13px] font-medium text-white">
                        {row.roleName || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Audit Metadata Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Created By
                      </div>
                      <div className="mt-0.5 font-normal text-[#6B7280] dark:text-[#9ca3af] truncate">
                        {getDepartmentRoleHistoryCreatedByDisplay(row)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Created At
                      </div>
                      <div className="mt-0.5 font-normal text-[#6B7280] dark:text-[#9ca3af] truncate">
                        {getDepartmentRoleHistoryCreatedAtDisplay(row)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Updated By
                      </div>
                      <div className="mt-0.5 font-normal text-[#6B7280] dark:text-[#9ca3af] truncate">
                        {getDepartmentRoleHistoryUpdatedByDisplay(row)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Updated At
                      </div>
                      <div className="mt-0.5 font-normal text-[#6B7280] dark:text-[#9ca3af] truncate">
                        {getDepartmentRoleHistoryUpdatedAtDisplay(row)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
