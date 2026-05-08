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
import { useUserProgramHistoryQuery, type UserProgramHistoryRecord } from "../queries/userProgramHistory"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"

type UserProgramHistoryTableProps = {
  userId?: string
  programCode?: string
  programName?: string
}

export function UserProgramHistoryTable({
  userId = "",
  programCode = "",
  programName = "",
}: UserProgramHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useUserProgramHistoryQuery({
    page,
    limit: pageSize,
    programCode,
    userId,
  })

  const historyData = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const headers = [
    "Program Code",
    "Program Name",
    "User Name",
    "Effective From",
    "Effective To",
  ]

  const skeletonRows = Array.from({ length: pageSize }, (_, index) => `history-skeleton-${index}`)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-bold text-[#111827]">
            Program Assignment History
          </h3>
          {userId && <p className="text-[11px] text-[#555f76]">User ID: {userId}</p>}
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "160px" }} />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                {headers.map((header, idx) => (
                  <TableHead
                    key={header}
                    className={`h-10 bg-[#6C5DD3] px-3 text-[12px] font-medium text-white ${
                      idx < 3 ? "text-left" : "text-center"
                    } ${
                      idx === headers.length - 1 ? "" : "border-r border-white/50"
                    }`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? skeletonRows.map((rowId) => (
                    <TableRow key={rowId} className="h-10 border-b border-[#eff0f5] hover:bg-transparent">
                      {headers.map((_, i) => (
                        <TableCell key={i} className={`border-r border-[#eff0f5] px-3 py-2 last:border-r-0 ${i < 3 ? "text-left" : "text-center"}`}>
                          <Skeleton 
                            className={`h-3 ${i < 3 ? "" : "mx-auto"} ${
                              i === 1 ? "w-[85%]" : // Program Name (longer)
                              i === 0 ? "w-[60%]" : // Program Code
                              i === 2 ? "w-[75%]" : // User Name
                              "w-[50%]"             // Dates
                            }`} 
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row: UserProgramHistoryRecord) => (
                    <TableRow key={row.id} className="min-h-[40px] border-b border-[#eff0f5] hover:bg-[#fafafa]">
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] text-left whitespace-normal wrap-break-word">{row.programCode}</TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] text-left whitespace-normal wrap-break-word">{row.programName}</TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] text-left whitespace-normal wrap-break-word">{row.userName || row.userId}</TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] text-center whitespace-normal wrap-break-word">{formatDate(row.effectiveFrom)}</TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] last:border-r-0 text-center whitespace-normal wrap-break-word">{formatDate(row.effectiveTo)}</TableCell>
                    </TableRow>
                  ))}
              {!isLoading && historyData.length === 0 ? (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={headers.length} className="text-center">
                    <img
                      src={tableEmptyIcon}
                      alt="No history found"
                      className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

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
