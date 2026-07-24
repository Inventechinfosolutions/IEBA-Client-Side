import type { ReactNode } from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { AuditHistoryRecord } from "../queries/auditHistory"

export type AuditHistoryCardViewProps = {
  rows: AuditHistoryRecord[]
  isLoading?: boolean
  footer?: ReactNode
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export function AuditHistoryCardView({
  rows,
  isLoading,
  footer,
}: AuditHistoryCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`audit-card-skeleton-${idx}`}
            className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
          >
            <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
              <div className="h-4 w-1/3 rounded bg-white/40" />
              <div className="h-5 w-16 rounded bg-white/40" />
            </div>
            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        ))
      ) : rows.length === 0 ? (
        <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[150px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[13px] text-gray-500 dark:text-zinc-400">
            No audit history found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row, idx) => (
            <div
              key={`mobile-audit-${row.id || idx}`}
              className="audit-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
            >
              {/* Card Header: PURPLE background in both dark & light modes */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
                <span className="font-bold text-[14px] truncate max-w-[75%]">
                  {row.entityName || "—"}
                </span>
                <span className="shrink-0 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wide">
                  {row.operation || "—"}
                </span>
              </div>

              {/* Card Body: Light background in light mode, dark in dark mode */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 bg-white dark:bg-[#0c0d12]">
                {/* Entity ID */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider shrink-0">
                    Entity ID:
                  </span>
                  <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-[13px] text-right break-all">
                    {row.entityId || "—"}
                  </span>
                </div>

                {/* Changed By */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider shrink-0">
                    Changed By:
                  </span>
                  <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-[13px] text-right break-all max-w-full">
                    {row.changedBy || "—"}
                  </span>
                </div>

                {/* Changed At */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider shrink-0">
                    Changed At:
                  </span>
                  <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-[13px] text-right">
                    {formatDateTime(row.changedAt)}
                  </span>
                </div>

                {/* Request ID */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-0.5">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider shrink-0">
                    Request ID:
                  </span>
                  <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-[13px] text-right break-all max-w-full">
                    {row.requestId || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
