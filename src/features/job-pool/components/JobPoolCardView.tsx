import React from "react"
import { History } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import statusCrossIcon from "@/assets/status-cross.png"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/usePermissions"
import type { JobPoolRow } from "../types"

export type JobPoolCardViewProps = {
  rows: JobPoolRow[]
  isLoading: boolean
  onEditRow: (row: JobPoolRow) => void
  onHistoryRow?: (row: JobPoolRow) => void
  footer?: React.ReactNode
}

function formatUserName(user: {
  name?: string
  firstName?: string
  lastName?: string
}): string {
  const full =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    (user.name ?? "").trim()
  return full
}

export function JobPoolCardView({
  rows,
  isLoading,
  onEditRow,
  onHistoryRow,
  footer,
}: JobPoolCardViewProps) {
  const { canUpdate, isSuperAdmin } = usePermissions()
  const canUpdateJobPool = canUpdate("jobpool")

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`job-pool-card-skeleton-${idx}`}
              className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-5 w-16 rounded bg-white/40" />
              </div>
              <div className="p-5 space-y-3.5">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[150px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[13px] text-gray-500 dark:text-zinc-400">
            No job pools found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row) => (
            <div
              key={`job-pool-card-${row.id}`}
              className="job-pool-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
            >
              {/* Header - Job Pool Name in Header */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-bold text-[14px] truncate text-white">
                    {row.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onHistoryRow && isSuperAdmin ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onHistoryRow(row)}
                      className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 dark:bg-transparent dark:hover:bg-white/20 p-1"
                      aria-label={`View history for ${row.name}`}
                    >
                      <History className="size-[16px] text-white" strokeWidth={2} />
                    </Button>
                  ) : null}

                  {canUpdateJobPool ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRow(row)}
                      className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 dark:bg-transparent dark:hover:bg-white/20 p-1"
                      aria-label={`Edit ${row.name}`}
                    >
                      <img
                        src={tableEditIcon}
                        alt="Edit"
                        aria-hidden="true"
                        className="size-[16px] object-contain brightness-0 invert"
                      />
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3.5 flex-1 bg-white dark:bg-[#0c0d12]">
                {/* Department & Active Status row */}
                <div className="grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5">
                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Department
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                      {row.department || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Active
                    </span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {row.active ? (
                        <img
                          src={tableCheckIcon}
                          alt="Active"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossIcon}
                          alt="Inactive"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Classification Tags */}
                <div className="border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5 space-y-1.5">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block">
                    Job Classification {row.jobClassifications.length > 0 ? `(${row.jobClassifications.length})` : ""}
                  </span>
                  {row.jobClassifications.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {row.jobClassifications.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center rounded-[7px] bg-[#f8f9fa] dark:bg-[#1c192d] px-2 py-0.5 text-[11px] text-[#232735] dark:text-[#e4e4e7] ${
                            tag.status?.toLowerCase() === "inactive"
                              ? "border border-red-300"
                              : "border border-[#d8dae3] dark:border-[rgba(108,93,211,0.5)]!"
                          }`}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#9ca3af] text-[12px]">—</span>
                  )}
                </div>

                {/* Users Tags */}
                <div className="space-y-1.5">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block">
                    Users {row.userprofiles && row.userprofiles.length > 0 ? `(${row.userprofiles.length})` : ""}
                  </span>
                  {row.userprofiles && row.userprofiles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {row.userprofiles
                        .map((u) => ({
                          id: u.id,
                          label: formatUserName(u),
                          status: u.status,
                        }))
                        .filter((u) => u.id && u.label)
                        .map((u) => (
                          <span
                            key={u.id}
                            title={u.label}
                            className={`inline-flex items-center rounded-[7px] border bg-[#f8f9fa] dark:bg-[#1c192d] px-2.5 py-1 text-[11px] text-[#232735] dark:text-[#e4e4e7] ${
                              u.status?.toLowerCase() === "inactive"
                                ? "border-red-400"
                                : "border-[#d8dae3] dark:border-[rgba(108,93,211,0.5)]!"
                            }`}
                          >
                            {u.label}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <span className="text-[#9ca3af] text-[12px]">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  )
}
