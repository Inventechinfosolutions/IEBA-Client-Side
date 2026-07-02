import { Fragment, useState } from "react"
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
import { DepartmentHistoryDetailPanel } from "./DepartmentHistoryDetailPanel"
import {
  getDepartmentHistoryCodeDisplay,
  getDepartmentHistoryEffectiveFromDisplay,
  getDepartmentHistoryEffectiveToDisplay,
  getDepartmentHistoryEventDisplay,
  getDepartmentHistoryNameDisplay,
  getDepartmentHistoryReportsDisplay,
  getDepartmentHistoryUpdatedAtDisplay,
  getDepartmentHistoryUpdatedByDisplay,
} from "../lib/departmentHistoryDisplay"
import {
  useDepartmentHistoryByIdQuery,
  useDepartmentHistoryQuery,
  type DepartmentHistoryRecord,
} from "../queries/departmentHistory"

type DepartmentHistoryTableProps = {
  departmentId?: string
  departmentCode?: string
  departmentName?: string
}

const SCOPED_HEADERS = [
  "Event",
  "Effective From",
  "Effective To",
  "Reports",
  "Updated By",
  "Updated At",
] as const

const LIST_HEADERS = [
  "Code",
  "Department",
  "Event",
  "Effective From",
  "Effective To",
  "Reports",
  "Updated By",
  "Updated At",
] as const

function ExpandButton({
  isExpanded,
  onClick,
  className = "text-[#6C5DD3]",
}: {
  isExpanded: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center hover:opacity-80 ${className}`}
      onClick={onClick}
      aria-label={isExpanded ? "Hide details" : "View details"}
    >
      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  )
}

function HistoryDataCells({
  row,
  isScopedView,
}: {
  row: DepartmentHistoryRecord
  isScopedView: boolean
}) {
  const eventCell = (
    <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-center">
      <span className="inline-flex rounded-full bg-[#F5F3FF] px-2.5 py-1 text-[12px] font-medium text-[#6C5DD3]">
        {getDepartmentHistoryEventDisplay(row)}
      </span>
    </TableCell>
  )

  const sharedCells = (
    <>
      <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-center text-[13px] text-[#374151]">
        {getDepartmentHistoryEffectiveFromDisplay(row)}
      </TableCell>
      <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-center text-[13px] text-[#374151]">
        {getDepartmentHistoryEffectiveToDisplay(row)}
      </TableCell>
      <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-left text-[13px] text-[#374151]">
        {getDepartmentHistoryReportsDisplay(row)}
      </TableCell>
      <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-center text-[13px] text-[#374151]">
        {getDepartmentHistoryUpdatedByDisplay(row)}
      </TableCell>
      <TableCell className="px-4 py-3 text-center text-[13px] text-[#374151]">
        {getDepartmentHistoryUpdatedAtDisplay(row)}
      </TableCell>
    </>
  )

  if (isScopedView) {
    return (
      <>
        {eventCell}
        {sharedCells}
      </>
    )
  }

  return (
    <>
      <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-left text-[13px] text-[#111827]">
        {getDepartmentHistoryCodeDisplay(row)}
      </TableCell>
      <TableCell className="border-r border-[#E5E7EB] px-4 py-3 text-left text-[13px] text-[#111827]">
        {getDepartmentHistoryNameDisplay(row)}
      </TableCell>
      {eventCell}
      {sharedCells}
    </>
  )
}

export function DepartmentHistoryTable({
  departmentId = "",
  departmentCode = "",
  departmentName = "",
}: DepartmentHistoryTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const scopedDepartmentId = departmentId.trim()
  const isScopedView = scopedDepartmentId.length > 0
  const headers = isScopedView ? SCOPED_HEADERS : LIST_HEADERS
  const totalColumns = headers.length + 1

  const listQuery = useDepartmentHistoryQuery({
    page,
    limit: pageSize,
    departmentCode,
    departmentName,
    enabled: !isScopedView,
  })
  const byIdQuery = useDepartmentHistoryByIdQuery({
    departmentId: scopedDepartmentId,
    page,
    limit: pageSize,
  })

  const { data, isLoading } = isScopedView ? byIdQuery : listQuery
  const historyData: DepartmentHistoryRecord[] = Array.isArray(data?.data) ? data.data : []
  const totalItems = data?.meta?.totalItems ?? 0
  const skeletonRows = Array.from({ length: pageSize }, (_, i) => `history-skeleton-${i}`)

  const toggleRow = (rowKey: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
  }

  return (
    <div className={`flex flex-col gap-4 ${isScopedView ? "" : "pt-3"}`}>
      {/* Desktop view Table */}
      <div className="hidden md:block overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse min-w-[760px]">
            <TableHeader className="bg-[#6C5DD3] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-[44px] w-[44px] border-r border-white/30 px-2 text-center text-[13px] font-medium text-white" />
                {headers.map((header, idx) => (
                  <TableHead
                    key={header}
                    className={`h-[44px] px-4 text-[13px] font-medium text-white ${
                      header === "Reports" || (!isScopedView && idx <= 1)
                        ? "text-left"
                        : "text-center"
                    } ${idx < headers.length - 1 ? "border-r border-white/30" : ""}`}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? skeletonRows.map((rowId) => (
                    <TableRow key={rowId} className="border-b border-[#E5E7EB]">
                      {Array.from({ length: totalColumns }).map((_, i) => (
                        <TableCell key={i} className="px-4 py-3">
                          <Skeleton className="h-3 w-3/4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : historyData.map((row, idx) => {
                    const rowKey = String(row.id ?? idx)
                    const isExpanded = Boolean(expandedRowIds[rowKey])

                    return (
                      <Fragment key={rowKey}>
                        <TableRow className="border-b border-[#E5E7EB] hover:bg-[#FAFAFA]">
                          <TableCell className="border-r border-[#E5E7EB] px-2 py-3 text-center">
                            <ExpandButton
                              isExpanded={isExpanded}
                              onClick={() => toggleRow(rowKey)}
                            />
                          </TableCell>
                          <HistoryDataCells row={row} isScopedView={isScopedView} />
                        </TableRow>
                        {isExpanded ? (
                          <TableRow className="border-b border-[#E5E7EB] bg-[#FAFAFC]">
                            <TableCell colSpan={totalColumns} className="p-0">
                              <DepartmentHistoryDetailPanel row={row} />
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })}

              {!isLoading && historyData.length === 0 ? (
                <TableRow className="h-[180px]">
                  <TableCell colSpan={totalColumns} className="text-center">
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

      {/* Mobile view cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading
          ? skeletonRows.map((rowId) => (
              <div key={rowId} className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 space-y-4 animate-pulse">
                <Skeleton className="h-6 w-1/3 rounded bg-gray-200" />
                <Skeleton className="h-4 w-2/3 rounded bg-gray-200" />
                <Skeleton className="h-4 w-full rounded bg-gray-200" />
              </div>
            ))
          : historyData.map((row, idx) => {
              const rowKey = String(row.id ?? idx)
              const isExpanded = Boolean(expandedRowIds[rowKey])
              return (
                <div
                  key={rowKey}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden text-[13px] text-[#111827] flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
                    <div className="flex items-center gap-2">
                      <ExpandButton
                        isExpanded={isExpanded}
                        onClick={() => toggleRow(rowKey)}
                        className="text-white"
                      />
                      <span className="font-bold text-[14px]">
                        {getDepartmentHistoryEventDisplay(row)}
                      </span>
                    </div>
                    <span className="text-[12px] opacity-90 font-medium">
                      {getDepartmentHistoryUpdatedAtDisplay(row)}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3.5 flex-1">
                    {!isScopedView && (
                      <>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Code:</span>
                          <span className="font-semibold text-gray-800">{getDepartmentHistoryCodeDisplay(row)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Department:</span>
                          <span className="font-semibold text-gray-800">{getDepartmentHistoryNameDisplay(row)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Effective From:</span>
                      <span className="font-semibold text-gray-800">{getDepartmentHistoryEffectiveFromDisplay(row)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Effective To:</span>
                      <span className="font-semibold text-gray-800">{getDepartmentHistoryEffectiveToDisplay(row)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Updated By:</span>
                      <span className="font-semibold text-gray-800">{getDepartmentHistoryUpdatedByDisplay(row)}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Reports:</span>
                      <span className="font-semibold text-gray-700 leading-relaxed">{getDepartmentHistoryReportsDisplay(row)}</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-[#E5E7EB] bg-[#FAFAFC] p-5 overflow-x-auto text-[12px]">
                      <DepartmentHistoryDetailPanel row={row} />
                    </div>
                  )}
                </div>
              )
            })}
      </div>

      {!isLoading && historyData.length === 0 && (
        <div className="h-[180px] flex items-center justify-center border border-[#E5E7EB] rounded-[10px] bg-white md:hidden">
          <img
            src={tableEmptyIcon}
            alt="No history found"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
        </div>
      )}

      {!isLoading && totalItems > 0 ? (
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
      ) : null}
    </div>
  )
}
