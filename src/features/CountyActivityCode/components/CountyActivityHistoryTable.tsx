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
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { CountyActivityHistoryCardView } from "./CountyActivityHistoryCardView"

import {
  ACTIVITY_DEFINITION_HISTORY_KIND,
  useActivityHistoryQuery,
  type ActivityHistoryRecord,
} from "../queries/activityHistory"
import {
  getActivityHistoryCreatedAtDisplay,
  getActivityHistoryCreatedByDisplay,
  getActivityHistoryEffectiveFromDisplay,
  getActivityHistoryEffectiveToDisplay,
  getActivityHistoryEventDisplay,
  getActivityHistoryUpdatedAtDisplay,
  getActivityHistoryUpdatedByDisplay,
} from "../lib/activityHistoryDisplay"

type CountyActivityHistoryTableProps = {
  countyActivityCode?: string
  countyActivityName?: string
  /** When set with `historyKind`, forwarded to `GET /users/activity-history`. */
  userId?: string
  historyKind?: string
  /**
   * `audit` — definition-style columns (event, created/updated by/at).
   * `assignment` — code, name, effective from/to (e.g. User → Time Study activity history).
   */
  columnLayout?: "audit" | "assignment"
}

const AUDIT_HEADERS = [
  "Activity Code",
  "Activity Name",
  "Activity Event",
  "Created By Name",
  "Created At",
  "Updated By Name",
  "Updated At",
] as const

const ASSIGNMENT_HEADERS = [
  "Activity Code",
  "Activity Name",
  "Effective From",
  "Effective To",
] as const

const COL_WIDTHS_AUDIT = ["12%", "18%", "12%", "14%", "14%", "14%", "16%"] as const
const COL_WIDTHS_ASSIGNMENT = ["18%", "32%", "25%", "25%"] as const

export function CountyActivityHistoryTable({
  countyActivityCode = "",
  countyActivityName = "",
  userId = "",
  historyKind = ACTIVITY_DEFINITION_HISTORY_KIND,
  columnLayout = "audit",
}: CountyActivityHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useActivityHistoryQuery({
    page,
    limit: pageSize,
    activityCode: countyActivityCode,
    activityName: countyActivityName,
    historyKind,
    userId,
  })

  const historyData: ActivityHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const skeletonRows = Array.from({ length: pageSize }, (_, i) => `history-skeleton-${i}`)

  const isAssignmentLayout = columnLayout === "assignment"
  const headers = isAssignmentLayout ? ASSIGNMENT_HEADERS : AUDIT_HEADERS
  const colWidths = isAssignmentLayout ? COL_WIDTHS_ASSIGNMENT : COL_WIDTHS_AUDIT
  const leftAlignThroughIndex = isAssignmentLayout ? 1 : 2

  const paginationNode = !isLoading && totalItems > 0 ? (
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
  ) : null

  return (
    <div className="flex flex-col gap-4 pt-3 w-full min-w-0">
      {/* Mobile & Tablet Card View */}
      <CountyActivityHistoryCardView
        historyData={historyData}
        isLoading={isLoading}
        isAssignmentLayout={isAssignmentLayout}
        footer={paginationNode}
      />

      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={`activity-history-col-${i}`} style={{ width: w }} />
              ))}
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                {headers.map((header, idx) => (
                  <TableHead
                    key={header}
                    className={`h-[48px] bg-[#6C5DD3] px-[14px] text-[14px] font-[500] text-white font-['Roboto',sans-serif] whitespace-normal wrap-break-word leading-snug ${
                      idx <= leftAlignThroughIndex ? "text-left" : "text-center"
                    } ${idx === headers.length - 1 ? "" : "border-r border-white/40"}`}
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
                      {headers.map((_, i) => (
                        <TableCell
                          key={i}
                          className={`border-r border-[#E5E7EB] px-[14px] py-[10px] text-[12px] last:border-r-0 ${
                            i <= leftAlignThroughIndex ? "text-left" : "text-center"
                          }`}
                        >
                          <Skeleton
                            className={`h-3 ${i <= leftAlignThroughIndex ? "" : "mx-auto"} ${
                              i === 1
                                ? "w-[85%]"
                                : i === 0
                                  ? "w-[60%]"
                                  : isAssignmentLayout
                                    ? "w-[55%]"
                                    : i === 2
                                      ? "w-[70%]"
                                      : "w-[45%]"
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
                      {isAssignmentLayout ? (
                        <>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.activityCode || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.activityName || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getActivityHistoryEffectiveFromDisplay(row)}
                          </TableCell>
                          <TableCell className="px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] last:border-r-0 whitespace-normal break-words">
                            {getActivityHistoryEffectiveToDisplay(row)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.activityCode || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {row.activityName || "—"}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getActivityHistoryEventDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getActivityHistoryCreatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getActivityHistoryCreatedAtDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] whitespace-normal break-words">
                            {getActivityHistoryUpdatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="px-[14px] py-[10px] text-center text-[12px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] last:border-r-0 whitespace-normal break-words">
                            {getActivityHistoryUpdatedAtDisplay(row)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}

              {!isLoading && historyData.length === 0 && (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={headers.length} className="text-center">
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

      <div className="hidden xl:block">
        {paginationNode}
      </div>
    </div>
  )
}
