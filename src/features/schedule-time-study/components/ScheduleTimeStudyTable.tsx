import { useState } from "react"
import statusCrossImg from "@/assets/status-cross.png"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ScheduleTimeStudyForm } from "./ScheduleTimeStudyForm"
import {
  useGetParticipantsListRows,
  useGetScheduledTimeStudyRows,
} from "../queries/getScheduleTimeStudyPeriods"
import { FISCAL_YEAR_OPTIONS } from "../types"
import type { ScheduledTimeStudyRow, ScheduledTimeStudyTableProps } from "../types"

export function ScheduledTimeStudyTable({
  selectedStudyYear,
  onStudyYearChange,
  selectedDepartment,
  periodRows,
}: ScheduledTimeStudyTableProps) {
  const participantsQuery = useGetParticipantsListRows()
  const scheduledQuery = useGetScheduledTimeStudyRows()
  const [hasScheduledRowsChanges, setHasScheduledRowsChanges] = useState(false)
  const [scheduledRows, setScheduledRows] = useState<ScheduledTimeStudyRow[]>([])
  const effectiveScheduledRows = hasScheduledRowsChanges
    ? scheduledRows
    : (scheduledQuery.data ?? [])
  const participantGroupOptions = (participantsQuery.data ?? []).map((row) => row.groupName)
  const [createScheduledOpen, setCreateScheduledOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Select value={selectedStudyYear} onValueChange={onStudyYearChange}>
          <SelectTrigger className="h-[46px] w-[170px] rounded-[10px] border-[#D1D5DB] px-[12px] text-[14px] font-normal text-[#111827] shadow-none focus:ring-0 [&_[data-slot=select-value]]:text-[14px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            side="bottom"
            avoidCollisions={false}
            sideOffset={10}
            align="start"
            className="w-[180px] rounded-[10px] border border-[#E5E7EB] bg-white p-1 shadow-[0_4px_16px_#00000014]"
          >
            {FISCAL_YEAR_OPTIONS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          className="h-10 w-[150px] rounded-[12px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
          onClick={() => setCreateScheduledOpen(true)}
        >
          Add New Scheduling
        </Button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[27%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-[60px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
              {["Time Study Period", "Start Date", "End Date", "Groups", "Status", "Action"].map(
                (header) => (
                  <TableHead
                    key={header}
                    className="h-[60px] border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[12px] text-center text-[12px] font-normal text-white first:text-left last:border-r-0"
                  >
                    {header}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledQuery.isLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`scheduled-skeleton-${index}`} className="h-[44px] border-[#EDEDED]">
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2">
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-center">
                      <Skeleton className="mx-auto h-4 w-[70%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-center">
                      <Skeleton className="mx-auto h-4 w-[70%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2">
                      <Skeleton className="h-4 w-[85%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : effectiveScheduledRows.map((row) => (
                  <TableRow key={row.id} className="h-[44px] border-[#EDEDED]">
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827]">
                      {row.timeStudyPeriod}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-center text-[13px] text-[#111827]">
                      {row.startDate}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-center text-[13px] text-[#111827]">
                      {row.endDate}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827]">
                      {row.groups}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827]">
                      {row.status}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        <img src={statusCrossImg} alt="Cross" className="h-4 w-4 object-contain" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex min-h-[64px] w-full items-center justify-end rounded-[15px] bg-white px-4 py-4 shadow-[0_0_20px_0_#0000001a]">
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="gap-0">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text=""
                onClick={(event) => event.preventDefault()}
                className="h-9 w-9 rounded-[8px] border border-transparent px-0 text-[#9CA3AF] pointer-events-none opacity-60"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(event) => event.preventDefault()}
                className="h-9 w-9 rounded-[8px] border border-[#D1D5DB] bg-white px-0 text-[18px] font-normal text-[#4B5563]"
              >
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                text=""
                onClick={(event) => event.preventDefault()}
                className="h-9 w-9 rounded-[8px] border border-transparent px-0 text-[#9CA3AF] pointer-events-none opacity-60"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <ScheduleTimeStudyForm
        open={createScheduledOpen}
        onOpenChange={setCreateScheduledOpen}
        selectedDepartment={selectedDepartment}
        selectedStudyYear={selectedStudyYear}
        periodRows={periodRows}
        participantGroupOptions={participantGroupOptions}
        onSave={(newRows) => {
          setHasScheduledRowsChanges(true)
          setScheduledRows((prev) => [
            ...newRows,
            ...(hasScheduledRowsChanges ? prev : effectiveScheduledRows),
          ])
        }}
      />
    </>
  )
}
