import { useRef, useState } from "react"
import { SearchIcon } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"

import {
  useJobPoolHistoryQuery,
  type JobPoolHistoryRecord,
} from "../queries/jobPoolHistory"

type JobPoolHistoryTableProps = {
  assignmentKind?: string
}

const SEARCH_DEBOUNCE_MS = 400

const HEADERS = [
  "Job Title",
  "Job Code",
  "Assignment Kind",
  "User Name",
  "Effective From",
  "Effective To",
]

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

export function JobPoolHistoryTable({ assignmentKind = "" }: JobPoolHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const { data, isLoading } = useJobPoolHistoryQuery({
    page,
    limit: pageSize,
    assignmentKind: assignmentKind,
  })

  const historyData: JobPoolHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const skeletonRows = Array.from(
    { length: pageSize },
    (_, i) => `history-skeleton-${i}`
  )

  return (
    <div className="flex flex-col gap-4 pt-3">

      {/* Table */}
      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                {HEADERS.map((header, idx) => (
                  <TableHead
                    key={header}
                    className={`h-[48px] bg-[#6C5DD3] px-[14px] text-[14px] font-[500] text-white font-['Roboto',sans-serif] ${
                      idx < 4 ? "text-left" : "text-center"
                    } ${idx === HEADERS.length - 1 ? "" : "border-r border-white/40"}`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? skeletonRows.map((rowId) => (
                    <TableRow
                      key={rowId}
                      className="h-10 border-b border-[#E5E7EB] hover:bg-transparent"
                    >
                      {HEADERS.map((_, i) => (
                        <TableCell
                          key={i}
                          className={`border-r border-[#E5E7EB] px-[14px] py-[10px] last:border-r-0 ${i < 4 ? "text-left" : "text-center"}`}
                        >
                          <Skeleton
                            className={`h-3 ${i < 4 ? "" : "mx-auto"} ${
                              i === 0 ? "w-[80%]" : "w-[60%]"
                            }`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row, idx) => (
                    <TableRow
                      key={`${row.id}-${idx}`}
                      className="min-h-[40px] border-b border-[#E5E7EB] hover:bg-[#fafafa]"
                    >
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left whitespace-normal break-words">
                        {row.jobTitle || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left">
                        {row.jobCode || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left whitespace-normal break-words">
                        {row.assignmentKind || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left whitespace-normal break-words">
                        {row.userName || row.userId || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-center">
                        {formatDate(row.effectiveFrom)}
                      </TableCell>
                      <TableCell className="px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-center">
                        {formatDate(row.effectiveTo)}
                      </TableCell>
                    </TableRow>
                  ))}

              {!isLoading && historyData.length === 0 && (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={HEADERS.length} className="text-center">
                    <img
                      src={tableEmptyIcon}
                      alt="No history found"
                      className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalItems > 0 && (
        <MasterCodePagination
          totalItems={totalItems}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
