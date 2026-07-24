import DOMPurify from "dompurify"
import tableCheckIcon from "@/assets/icons/table-check.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import statusCrossIcon from "@/assets/status-cross.png"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/usePermissions"
import type { JobClassificationRow } from "../types"

export type JobClassificationCardViewProps = {
  rows: JobClassificationRow[]
  isLoading: boolean
  onEditRow: (row: JobClassificationRow) => void
}

export function JobClassificationCardView({
  rows,
  isLoading,
  onEditRow,
}: JobClassificationCardViewProps) {
  const { canUpdate } = usePermissions()
  const canUpdateJobClassification = canUpdate("jobclassification")

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`job-class-card-skeleton-${idx}`}
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
            No job classifications found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row) => {
            const hasDesc = Boolean(row.activityDescription && row.activityDescription.trim())
            const sanitizedDescription = hasDesc
              ? DOMPurify.sanitize(row.activityDescription ?? "", {
                  ALLOWED_TAGS: ["ul", "ol", "li", "b", "strong", "i", "em", "br", "p"],
                })
              : ""

            return (
              <div
                key={`job-class-card-${row.id}`}
                className="job-class-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Header - Code in Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-bold text-[14px] truncate text-white">
                      {row.code}
                    </span>
                  </div>

                  {canUpdateJobClassification && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRow(row)}
                      className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 dark:bg-transparent dark:hover:bg-white/20 p-1"
                      aria-label="Edit row"
                    >
                      <img
                        src={tableEditIcon}
                        alt="Edit"
                        aria-hidden="true"
                        className="size-[16px] object-contain brightness-0 invert"
                      />
                    </Button>
                  )}
                </div>

                {/* Body - Code & Active top row, Name full width, Users full width, Description bottom */}
                <div className="p-4 space-y-3.5 flex-1 bg-white dark:bg-[#0c0d12]">
                  {/* Code & Active row */}
                  <div className="grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5">
                    <div>
                      <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                        Code
                      </span>
                      <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                        {row.code}
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

                  {/* Name - Full width */}
                  <div className="border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5">
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Name
                    </span>
                    <span className="font-semibold text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                      {row.name}
                    </span>
                  </div>

                  {/* Users - Full width so pills stretch across the entire card */}
                  <div className="border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5 space-y-1.5">
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block">
                      Users {row.users && row.users.length > 0 ? `(${row.users.length})` : ""}
                    </span>
                    {row.users && row.users.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {row.users.map((user) => (
                          <span
                            key={user.id}
                            className={`inline-flex items-center rounded-[6px] border bg-[#f8f9fa] dark:bg-[#1c192d] px-2.5 py-1 text-[11px] text-[#232735] dark:text-[#e4e4e7] ${
                              user.status?.toLowerCase() === "inactive"
                                ? "border-red-400"
                                : "border-[#d8dae3] dark:border-[rgba(108,93,211,0.5)]!"
                            }`}
                          >
                            {user.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#9ca3af] text-[12px]">—</span>
                    )}
                  </div>

                  {/* Activity Description */}
                  {hasDesc && (
                    <div className="space-y-1 pt-0.5">
                      <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block">
                        Description
                      </span>
                      <div
                        className="text-[12px] text-gray-600 dark:text-[#e5e7eb] leading-relaxed prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
