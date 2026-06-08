import { Fragment, useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

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
import { JobPoolHistoryDetailPanel } from "./JobPoolHistoryDetailPanel"
import {
  getJobPoolHistoryColumns,
  jobPoolHistoryRowHasDetail,
} from "../lib/jobPoolHistoryDisplay"
import {
  useJobPoolHistoryByIdQuery,
  useJobPoolHistoryQuery,
  type JobPoolHistoryRecord,
} from "../queries/jobPoolHistory"

type JobPoolHistoryTableProps = {
  assignmentKind?: string
  jobPoolId?: string
}

function ExpandButton({
  isExpanded,
  onClick,
  disabled,
}: {
  isExpanded: boolean
  onClick: () => void
  disabled?: boolean
}) {
  if (disabled) {
    return <span className="inline-block w-4" aria-hidden="true" />
  }

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center text-[#6C5DD3] hover:opacity-80"
      onClick={onClick}
      aria-label={isExpanded ? "Hide details" : "View details"}
    >
      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  )
}

export function JobPoolHistoryTable({
  assignmentKind = "",
  jobPoolId = "",
}: JobPoolHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const scopedJobPoolId = jobPoolId.trim()
  const isScopedView = scopedJobPoolId.length > 0
  const columns = useMemo(() => getJobPoolHistoryColumns(assignmentKind), [assignmentKind])
  const totalColumns = columns.length + 1

  const listQuery = useJobPoolHistoryQuery({
    page,
    limit: pageSize,
    assignmentKind,
    enabled: !isScopedView,
  })
  const byIdQuery = useJobPoolHistoryByIdQuery({
    jobPoolId: scopedJobPoolId,
    page,
    limit: pageSize,
    assignmentKind,
  })

  const { data, isLoading } = isScopedView ? byIdQuery : listQuery

  const historyData: JobPoolHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0

  const skeletonRows = Array.from(
    { length: pageSize },
    (_, i) => `history-skeleton-${i}`,
  )

  const toggleRow = (rowKey: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
  }

  const colWidth = `${Math.floor(96 / Math.max(columns.length, 1))}%`

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed border-collapse min-w-[920px]">
            <colgroup>
              <col style={{ width: "4%" }} />
              {columns.map((column) => (
                <col key={column.key} style={{ width: colWidth }} />
              ))}
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-[48px] border-r border-white/40 bg-[#6C5DD3] px-2 text-center text-[14px] font-[500] text-white" />
                {columns.map((column, idx) => (
                  <TableHead
                    key={column.key}
                    className={`h-[48px] bg-[#6C5DD3] px-[14px] text-[14px] font-[500] text-white font-['Roboto',sans-serif] ${
                      column.align === "center" ? "text-center" : "text-left"
                    } ${idx === columns.length - 1 ? "" : "border-r border-white/40"}`}
                  >
                    {column.header}
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
                      {Array.from({ length: totalColumns }).map((_, i) => (
                        <TableCell
                          key={i}
                          className={`border-r border-[#E5E7EB] px-[14px] py-[10px] last:border-r-0 ${
                            i <= columns.length ? "text-left" : "text-center"
                          }`}
                        >
                          <Skeleton className={`h-3 ${i === 0 ? "mx-auto w-3" : "w-[60%]"}`} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row, idx) => {
                    const rowKey = String(row.id ?? idx)
                    const isExpanded = Boolean(expandedRowIds[rowKey])
                    const hasDetail = jobPoolHistoryRowHasDetail(row)

                    return (
                      <Fragment key={rowKey}>
                        <TableRow className="min-h-[40px] border-b border-[#E5E7EB] hover:bg-[#fafafa]">
                          <TableCell className="border-r border-[#E5E7EB] px-2 py-[10px] text-center">
                            <ExpandButton
                              isExpanded={isExpanded}
                              disabled={!hasDetail}
                              onClick={() => toggleRow(rowKey)}
                            />
                          </TableCell>
                          {columns.map((column) => {
                            const value = column.getValue(row)
                            const showEventPill = Boolean(column.isEvent)

                            return (
                              <TableCell
                                key={column.key}
                                className={`border-r border-[#E5E7EB] px-[14px] py-[10px] text-[14px] font-[400] text-[#000000E0] font-['Roboto',sans-serif] last:border-r-0 whitespace-normal break-words ${
                                  column.align === "center" ? "text-center" : "text-left"
                                }`}
                              >
                                {showEventPill ? (
                                  <span className="inline-flex rounded-full bg-[#F5F3FF] px-2.5 py-1 text-[12px] font-medium text-[#6C5DD3]">
                                    {value}
                                  </span>
                                ) : (
                                  value
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                        {isExpanded && hasDetail ? (
                          <TableRow className="border-b border-[#E5E7EB] bg-[#FAFAFC]">
                            <TableCell colSpan={totalColumns} className="p-0">
                              <JobPoolHistoryDetailPanel row={row} />
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })}

              {!isLoading && historyData.length === 0 && (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={totalColumns} className="text-center">
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
