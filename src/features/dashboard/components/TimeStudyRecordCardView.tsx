import type { ReactNode } from "react"
import { Eye, Download, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export interface TimeStudyRecordEntry {
  id: number
  programname?: string
  programcode?: string
  activitycode?: string
  activityname?: string
  description?: string
  comments?: string
  notes?: string
  date?: string
  starttime?: string
  endtime?: string
  activitytime?: number
  supportingDocs?: Array<{ id?: number; fileName: string; url?: string }>
}

export interface TimeStudyRecordCardViewProps {
  rows: TimeStudyRecordEntry[]
  isLoading?: boolean
  onViewDoc: (recordId: number, docId?: number) => void
  onDownloadDoc: (recordId: number, docId?: number, fileName?: string) => void
  footer?: ReactNode
}

export function TimeStudyRecordCardView({
  rows,
  isLoading,
  onViewDoc,
  onDownloadDoc,
  footer,
}: TimeStudyRecordCardViewProps) {
  return (
    <div className="block md:hidden space-y-3 max-h-[380px] overflow-y-auto pr-2.5 w-full min-w-0">
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
        rows.map((entry, index) => {
          const programName = entry.programname || entry.programcode || "—"
          const activityCode =
            entry.activitycode && entry.activityname
              ? `${entry.activitycode} (${entry.activityname})`
              : entry.activitycode || entry.activityname || "—"
          const notesVal = entry.description || entry.comments || entry.notes || "—"
          const rawDate = entry.date || "—"
          const dateVal = rawDate.length > 10 ? rawDate.slice(0, 10) : rawDate
          const startVal = entry.starttime || "—"
          const endVal = entry.endtime || "—"
          const minVal = entry.activitytime ?? 0
          const firstDoc = entry.supportingDocs?.[0]
          const docVal = firstDoc?.fileName || "—"
          const hasDoc = !!firstDoc

          return (
            <div
              key={entry.id || index}
              className="rounded-xl border border-[#e5e7eb] bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#6C5DD3]/30 transition-all space-y-3 text-[12px]"
            >
              {/* 1. TS Program & 2. Date */}
              <div className="flex items-start justify-between border-b border-[#f0f0f5] pb-2 gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                    TS Program
                  </span>
                  <span
                    className="font-semibold text-[#6C5DD3] text-[13px] truncate block"
                    title={programName}
                  >
                    {programName}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                    Date
                  </span>
                  <span className="text-[11px] font-medium text-[#374151] block">
                    {dateVal}
                  </span>
                </div>
              </div>

              {/* 3. Service / Activity Code */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                  Service / Activity Code
                </span>
                <span className="text-[12px] font-medium text-[#111827] block break-words">
                  {activityCode}
                </span>
              </div>

              {/* 4. Start, 5. End, 6. Min. Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[#f8f9fa] p-2 rounded-lg text-center border border-[#e5e7eb]/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                    Start
                  </span>
                  <span className="text-[11px] font-medium text-[#374151]">{startVal}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                    End
                  </span>
                  <span className="text-[11px] font-medium text-[#374151]">{endVal}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                    Min.
                  </span>
                  <span className="text-[11px] font-bold text-[#6C5DD3]">{minVal}</span>
                </div>
              </div>

              {/* 7. Notes */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-0.5">
                  Notes
                </span>
                <span className="text-[11px] font-normal text-[#4b5563] block break-words">{notesVal}</span>
              </div>

              {/* 8. Supporting Doc */}
              <div className="border-t border-[#f0f0f5] pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] block mb-1">
                  Supporting Doc
                </span>
                {hasDoc && firstDoc ? (
                  <div className="flex items-center justify-between gap-2 bg-[#f8f7ff] p-2 rounded-lg border border-[#6C5DD3]/20">
                    <span
                      className="truncate flex-1 min-w-0 font-normal text-[#374151] text-[11px]"
                      title={docVal}
                    >
                      {docVal}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title="View Document"
                        onClick={() => onViewDoc(entry.id, firstDoc.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#6C5DD3] bg-[#6C5DD3]/10 hover:bg-[#6C5DD3] hover:text-white transition-all shadow-xs"
                      >
                        <Eye className="size-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        title="Download Document"
                        onClick={() => onDownloadDoc(entry.id, firstDoc.id, firstDoc.fileName)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#6C5DD3] bg-[#6C5DD3]/10 hover:bg-[#6C5DD3] hover:text-white transition-all shadow-xs"
                      >
                        <Download className="size-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#9ca3af] italic">None</span>
                )}
              </div>
            </div>
          )
        })
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
