import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Spinner } from "@/components/ui/spinner"
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

import {
  getParHistoryActivityCodeDisplay,
  getParHistoryActivityNameDisplay,
  getParHistoryDepartmentDisplay,
  getParHistoryEventDisplay,
  getParHistoryProgramCodeDisplay,
  getParHistoryProgramNameDisplay,
  getParHistoryUpdatedAtDisplay,
  getParHistoryUpdatedByDisplay,
  parHistoryRowHasDetail,
} from "../../lib/timeStudyProgramActivityHistoryDisplay"
import {
  useTimeStudyProgramActivityHistoryQuery,
  type TimeStudyProgramActivityHistoryRecord,
} from "../../queries/timeStudyProgramActivityHistory"
import { ProgramActivityRelationHistoryDetailPanel } from "./ProgramActivityRelationHistoryDetailPanel"

type ProgramActivityRelationHistoryTableProps = {
  programCode?: string
  activityCode?: string
  departmentId?: number
}

const HEADERS = [
  "Department",
  "Program Code",
  "Program Name",
  "Activity Code",
  "Activity Name",
  "Event",
  "Updated By",
  "Updated At",
] as const

const COL_WIDTHS = ["4%", "11%", "9%", "13%", "9%", "15%", "9%", "13%", "13%"] as const

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

export function ProgramActivityRelationHistoryTable({
  programCode = "",
  activityCode = "",
  departmentId,
}: ProgramActivityRelationHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})

  const { data, isLoading, isFetching } = useTimeStudyProgramActivityHistoryQuery({
    page,
    limit: pageSize,
    programCode,
    activityCode,
    departmentId,
  })

  const isDataLoading = isLoading || isFetching
  const historyData: TimeStudyProgramActivityHistoryRecord[] = Array.isArray(data?.data)
    ? data.data
    : []
  const totalItems = data?.meta?.totalItems ?? 0
  const totalColumns = HEADERS.length + 1

  const skeletonRows = Array.from({ length: pageSize }, (_, i) => `par-history-skeleton-${i}`)

  const toggleRow = (rowKey: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
  }

  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="relative overflow-x-auto">
          {isDataLoading && historyData.length === 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
              <Spinner className="text-[#6C5DD3]" />
            </div>
          )}
          <Table className="w-full table-fixed border-collapse min-w-[960px]">
            <colgroup>
              {COL_WIDTHS.map((width, i) => (
                <col key={`par-history-col-${i}`} style={{ width }} />
              ))}
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-[#6C5DD3] shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-[48px] border-r border-white/40 bg-[#6C5DD3] px-2 text-center text-[14px] font-[500] text-white" />
                {HEADERS.map((header, idx) => (
                  <TableHead
                    key={header}
                    className={`h-[48px] bg-[#6C5DD3] px-[14px] text-[14px] font-[500] text-white font-['Roboto',sans-serif] whitespace-normal wrap-break-word leading-snug ${
                      idx <= 4 ? "text-left" : "text-center"
                    } ${idx === HEADERS.length - 1 ? "" : "border-r border-white/40"}`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading && historyData.length === 0
                ? skeletonRows.map((rowId) => (
                    <TableRow
                      key={rowId}
                      className="h-10 border-b border-[#E5E7EB] hover:bg-transparent"
                    >
                      {Array.from({ length: totalColumns }).map((_, i) => (
                        <TableCell
                          key={i}
                          className={`border-r border-[#E5E7EB] px-[14px] py-[10px] last:border-r-0 ${
                            i === 0 ? "text-center" : i <= 5 ? "text-left" : "text-center"
                          }`}
                        >
                          <Skeleton
                            className={`h-3 ${i === 0 ? "mx-auto w-3" : i <= 5 ? "w-[60%]" : "mx-auto w-[60%]"}`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row, idx) => {
                    const rowKey = String(row.id ?? idx)
                    const isExpanded = Boolean(expandedRowIds[rowKey])
                    const hasDetail = parHistoryRowHasDetail(row)

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
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryDepartmentDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryProgramCodeDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryProgramNameDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryActivityCodeDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-left text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryActivityNameDisplay(row)}
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            <span className="inline-flex rounded-full bg-[#F5F3FF] px-2.5 py-1 text-[12px] font-medium text-[#6C5DD3]">
                              {getParHistoryEventDisplay(row)}
                            </span>
                          </TableCell>
                          <TableCell className="border-r border-[#E5E7EB] px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryUpdatedByDisplay(row)}
                          </TableCell>
                          <TableCell className="px-[14px] py-[10px] text-center text-[12px] text-[#232735] whitespace-normal wrap-break-word">
                            {getParHistoryUpdatedAtDisplay(row)}
                          </TableCell>
                        </TableRow>
                        {isExpanded && hasDetail ? (
                          <TableRow className="border-b border-[#E5E7EB] bg-[#FAFAFC]">
                            <TableCell colSpan={totalColumns} className="p-0">
                              <ProgramActivityRelationHistoryDetailPanel row={row} />
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })}

              {!isDataLoading && historyData.length === 0 && (
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
