import { useState } from "react"

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
import { Spinner } from "@/components/ui/spinner"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"

import {
  useAuditHistoryQuery,
  type AuditHistoryRecord,
} from "../queries/auditHistory"

type AuditHistoryTableProps = {
  entityName?: string
}

const HEADERS = [
  "Entity Name",
  "Entity ID",
  "Operation",
  "Changed By",
  "Changed At",
  "Request ID",
]

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function AuditHistoryTable({
  entityName = "",
}: AuditHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching } = useAuditHistoryQuery({
    page,
    limit: pageSize,
    entityName: entityName,
  })
  const isDataLoading = isLoading || isFetching

  const historyData: AuditHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const skeletonRows = Array.from(
    { length: pageSize },
    (_, i) => `history-skeleton-${i}`
  )

  return (
    <div className="flex flex-col gap-4 pt-3">

      {/* Table */}
      <div className="relative overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        {isDataLoading && (
          <div className="absolute inset-x-0 bottom-0 top-[48px] z-50 flex items-center justify-center bg-white/60">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "25%" }} />
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
                        {row.entityName || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left whitespace-normal break-words">
                        {row.entityId || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left">
                        {row.operation || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-left whitespace-normal break-words">
                        {row.changedBy || "—"}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-center">
                        {formatDateTime(row.changedAt)}
                      </TableCell>
                      <TableCell className="px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] text-center whitespace-normal break-words">
                        {row.requestId || "—"}
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
      {!isDataLoading && totalItems > 0 && (
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
