import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import tableSwitchUserIcon from "@/assets/icons/table-switch-user.png"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserTableProps } from "@/features/user/types"
import { usePermissions } from "@/hooks/usePermissions"

export function UserCardView({
  rows,
  isLoading,
  onEditRow,
  onSwitchUser,
}: UserTableProps) {
  const { canUpdate } = usePermissions()
  const canUpdateUser = canUpdate("user")
  const showSwitchUser = typeof onSwitchUser === "function"

  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [expandedMultiCodeRowIds, setExpandedMultiCodeRowIds] = useState<Record<string, boolean>>({})

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`skeleton-card-${index}`}
            className="overflow-hidden rounded-[8px] border border-[#e6e7ef] bg-white p-4 shadow-sm"
          >
            <Skeleton className="mb-3 h-5 w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-[8px] border border-[#e6e7ef] bg-white p-6 text-center">
        <img
          src={tableEmptyIcon}
          alt="Empty"
          aria-hidden="true"
          className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((row) => {
        const isDeptExpanded = expandedRowIds[row.id]

        return (
          <div
            key={row.id}
            className="overflow-hidden rounded-[8px] border border-[#e6e7ef] bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Card Header Bar */}
            <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-2.5 text-white">
              <span className="text-[14px] font-bold tracking-wide">
                {row.employee}
              </span>
              <div className="flex items-center gap-2.5">
                {canUpdateUser && (
                  <button
                    type="button"
                    onClick={() => onEditRow(row)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[4px] bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                    title="Edit User"
                  >
                    <img
                      src={tableEditIcon}
                      alt="Edit"
                      aria-hidden="true"
                      className="size-3.5 object-contain brightness-0 invert"
                    />
                  </button>
                )}
                {showSwitchUser && (
                  <button
                    type="button"
                    onClick={() => onSwitchUser(row)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[4px] bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                    title="Switch User"
                  >
                    <img
                      src={tableSwitchUserIcon}
                      alt="Switch User"
                      aria-hidden="true"
                      className="size-4 object-contain brightness-0 invert"
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Card Body Grid */}
            <div className="p-4 text-[12px]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Department */}
                <div>
                  <span className="font-bold text-[#111827]">Department: </span>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-start gap-1 text-left font-normal text-[#232735]"
                    onClick={() =>
                      setExpandedRowIds((prev) => ({
                        ...prev,
                        [row.id]: !prev[row.id],
                      }))
                    }
                  >
                    {isDeptExpanded ? (
                      <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-[#6C5DD3]" aria-hidden />
                    ) : (
                      <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-[#6C5DD3]" aria-hidden />
                    )}
                    <span>{row.department}</span>
                  </button>
                  {isDeptExpanded && row.roleAssignments && row.roleAssignments.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1 pl-4">
                      {row.roleAssignments.map((role) => (
                        <span
                          key={`${row.id}-${role}`}
                          className="rounded-[6px] border border-[#d7dbe7] bg-[#f8f9fc] px-2 py-0.5 text-[10px] text-[#555f76]"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Supervisor */}
                <div>
                  <span className="font-bold text-[#111827]">Supervisor: </span>
                  <span className="font-normal text-[#232735]">
                    {row.supervisorPrimary}
                    {row.supervisorSecondary ? `, ${row.supervisorSecondary}` : ""}
                  </span>
                </div>

                {/* TS Min/day */}
                <div>
                  <span className="font-bold text-[#111827]">TS Min/day: </span>
                  <span className="font-normal text-[#232735]">{row.tsMinDay}</span>
                </div>

                {/* Assigned Multi Codes */}
                <div>
                  <span className="font-bold text-[#111827]">Assigned Multi Codes: </span>
                  {row.assignedMultiCodesDetailed && row.assignedMultiCodesDetailed.length > 0 ? (
                    <div className="mt-1 flex flex-col gap-1 pl-1">
                      {row.assignedMultiCodesDetailed.map((detail) => {
                        const key = `${row.id}-${detail.departmentName}`
                        const isExpanded = expandedMultiCodeRowIds[key]
                        return (
                          <div key={key} className="flex flex-col items-start">
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-start gap-1 text-left text-[11px] font-normal text-[#232735]"
                              onClick={() =>
                                setExpandedMultiCodeRowIds((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }))
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="mt-0.5 size-3 shrink-0 text-[#6C5DD3]" aria-hidden />
                              ) : (
                                <ChevronRight className="mt-0.5 size-3 shrink-0 text-[#6C5DD3]" aria-hidden />
                              )}
                              <span>{detail.departmentName}</span>
                            </button>
                            {isExpanded ? (
                              <div className="mt-1 flex flex-wrap gap-1 pl-4">
                                {detail.codes.split(", ").map((code) => (
                                  <span
                                    key={code}
                                    className="rounded-[6px] border border-[#d7dbe7] bg-[#f8f9fc] px-2 py-0.5 text-[10px] text-[#555f76]"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="font-normal text-[#232735]">
                      {row.assignedMultiCodes || "—"}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Indicators Grid */}
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#f0f1f7] pt-2.5 text-[11px] sm:flex sm:flex-wrap sm:items-center sm:gap-x-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#111827]">SPMP:</span>
                  <img
                    src={row.spmp ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#111827]">Programs:</span>
                  <img
                    src={row.programs ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#111827]">Activities:</span>
                  <img
                    src={row.activities ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#111827]">Multicodes Enabled:</span>
                  <img
                    src={row.multicodesEnabled ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
                  <span className="font-bold text-[#111827]">Supervisor Apportioning:</span>
                  <img
                    src={row.supervisorApportioning ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
