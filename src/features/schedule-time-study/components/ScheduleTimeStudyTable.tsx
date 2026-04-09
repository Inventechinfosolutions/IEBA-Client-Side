import { useState } from "react"
import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import { Trash2 } from "lucide-react"
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

import { useGetRmtsGroups } from "../queries/getRmtsGroups"
import { useGetRmtsPpGroupListEnriched } from "../queries/getRmtsPpGroupListEnriched"
import { useDeleteRmtsPpGroupList } from "../mutations/deleteRmtsPpGroupList"
import type { ScheduledTimeStudyRowEnriched, ScheduledTimeStudyTableProps } from "../types"
import { DEFAULT_SCHEDULE_PARTICIPANT_GROUP_OPTIONS } from "../types"
import { SchedulePayPeriodGroupStatus } from "../enums/schedule-time-study.enum"
import { ScheduleTimeStudyForm } from "./ScheduleTimeStudyForm"

export function ScheduledTimeStudyTable({
  selectedStudyYear,
  onStudyYearChange,
  selectedDepartment,
  selectedDepartmentName,
  departmentId,
  fiscalYearOptions,
  periodRows,
}: ScheduledTimeStudyTableProps) {
  const groupsQuery = useGetRmtsGroups({ departmentId, fiscalyear: selectedStudyYear })
  const scheduledQuery = useGetRmtsPpGroupListEnriched({
    departmentId,
    fiscalyear: selectedStudyYear,
  })
  const deleteRow = useDeleteRmtsPpGroupList()

  const scheduledRows: ScheduledTimeStudyRowEnriched[] = scheduledQuery.data ?? []
  const participantGroupOptions = (groupsQuery.data?.rows ?? []).map((row) => row.groupName)
  const groupsDetailed = groupsQuery.data?.raw ?? []

  const [createScheduledOpen, setCreateScheduledOpen] = useState(false)
  const [editingScheduledRow, setEditingScheduledRow] = useState<ScheduledTimeStudyRowEnriched | null>(
    null,
  )
  const [formMountKey, setFormMountKey] = useState(0)

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
            {fiscalYearOptions.map((fy) => (
              <SelectItem key={fy.id} value={fy.id}>
                {fy.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          className="h-10 w-[150px] rounded-[12px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
          onClick={() => {
            setEditingScheduledRow(null)
            setFormMountKey((k) => k + 1)
            setCreateScheduledOpen(true)
          }}
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
                ),
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
              : scheduledRows.map((row) => (
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
                      <div className="flex items-center justify-center gap-2">
                        {row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingScheduledRow(row)
                              setFormMountKey((k) => k + 1)
                              setCreateScheduledOpen(true)
                            }}
                            aria-label="Edit scheduled row"
                          >
                            <img src={editIconImg} alt="Edit" className="h-4 w-4 object-contain" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={deleteRow.isPending}
                          onClick={async () => {
                            const ok = window.confirm("Delete this scheduled time study row?")
                            if (!ok) return
                            const id = Number(row.id)
                            if (!Number.isFinite(id) || id <= 0) return
                            try {
                              await deleteRow.mutateAsync(id)
                            } catch {
                              // Error toast handled at higher-level API wrapper patterns elsewhere; keep silent here.
                            }
                          }}
                          className="disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Delete scheduled row"
                        >
                          {row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT ? (
                            <Trash2 className="h-4 w-4 text-[#DC2626]" />
                          ) : (
                            <img src={statusCrossImg} alt="Delete" className="h-4 w-4 object-contain" />
                          )}
                        </button>
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
        key={`sched-form-${formMountKey}-${editingScheduledRow?.id ?? "new"}`}
        open={createScheduledOpen}
        onOpenChange={(next) => {
          setCreateScheduledOpen(next)
          if (!next) setEditingScheduledRow(null)
        }}
        selectedDepartment={selectedDepartment}
        selectedDepartmentName={selectedDepartmentName}
        selectedStudyYear={selectedStudyYear}
        departmentId={departmentId}
        fiscalYearOptions={fiscalYearOptions}
        periodRows={periodRows}
        participantGroupOptions={
          participantGroupOptions.length > 0
            ? participantGroupOptions
            : [...DEFAULT_SCHEDULE_PARTICIPANT_GROUP_OPTIONS]
        }
        groupsDetailed={groupsDetailed}
        editingRow={editingScheduledRow}
      />
    </>
  )
}
