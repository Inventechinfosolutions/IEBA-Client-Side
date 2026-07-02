import dayjs from "dayjs"
import { useState } from "react"
import { cn } from "@/lib/utils"

import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/usePermissions"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { SingleSelectDropdown } from "@/components/ui/dropdown"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { useGetRmtsPpGroupListEnriched } from "../queries/getRmtsPpGroupListEnriched"
import { useDeleteRmtsPpGroupList } from "../mutations/deleteRmtsPpGroupList"
import type { ScheduledTimeStudyRowEnriched, ScheduledTimeStudyTableProps } from "../types"
import { SchedulePayPeriodGroupStatus } from "../enums/schedule-time-study.enum"
import { ScheduleTimeStudyForm } from "./ScheduleTimeStudyForm"
import { Check } from "lucide-react"
import { toast } from "sonner"

const participantGroupSuccessToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
      <Check className="size-3 stroke-3" />
    </span>
  ),
  className:
    "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
}

export function ScheduledTimeStudyTable({
  selectedStudyYear,
  onStudyYearChange,
  selectedDepartment,
  selectedDepartmentName,
  departmentId,
  fiscalYearOptions,
  periodRows,
}: ScheduledTimeStudyTableProps) {
  const { canAdd, canUpdate } = usePermissions()
  const canAddSchedule = canAdd("scheduletimestudy")
  const canUpdateSchedule = canUpdate("scheduletimestudy")
  const scheduledQuery = useGetRmtsPpGroupListEnriched({
    departmentId,
    fiscalyear: selectedStudyYear,
  })
  const deleteRow = useDeleteRmtsPpGroupList()

  const scheduledRows: ScheduledTimeStudyRowEnriched[] = scheduledQuery.data ?? []

  const [createScheduledOpen, setCreateScheduledOpen] = useState(false)
  const [editingScheduledRow, setEditingScheduledRow] = useState<ScheduledTimeStudyRowEnriched | null>(
    null,
  )
  const [formMountKey, setFormMountKey] = useState(0)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SingleSelectDropdown
          value={selectedStudyYear}
          onChange={onStudyYearChange}
          onBlur={() => {}}
          options={fiscalYearOptions.map((fy) => ({ value: fy.id, label: fy.label }))}
          placeholder="Select year"
          className="h-10 w-full sm:w-[170px] rounded-[10px] border-[#D1D5DB] px-[12px] text-[14px] font-normal text-[#111827] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {canAddSchedule && (
          <Button
            type="button"
            className="h-10 w-full sm:w-auto rounded-[12px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
            onClick={() => {
              setEditingScheduledRow(null)
              setFormMountKey((k) => k + 1)
              setCreateScheduledOpen(true)
            }}
          >
            Add New Scheduling
          </Button>
        )}
      </div>

      <div className="hidden md:block relative overflow-hidden rounded-[10px] border border-[#E5E7EB]">
        {scheduledQuery.isFetching && (
          <div className="absolute top-[60px] inset-x-0 bottom-0 flex items-center justify-center bg-white/50 z-[50]">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
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
              : scheduledRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-[145px] bg-white text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                        <img src={tableEmptyIcon} alt="" className="size-[80px] object-contain" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : scheduledRows.map((row) => (
                  <TableRow key={row.id} className="h-[44px] border-[#EDEDED] hover:bg-[#fafafa]">
                    <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827] break-words">
                      {row.timeStudyPeriod}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-center text-[13px] text-[#111827] break-words">
                      {dayjs(row.startDate).isValid() && row.startDate.includes("T")
                        ? dayjs(row.startDate).format("MM-DD-YYYY")
                        : row.startDate}
                    </TableCell>

                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-center text-[13px] text-[#111827] break-words">
                      {dayjs(row.endDate).isValid() && row.endDate.includes("T")
                        ? dayjs(row.endDate).format("MM-DD-YYYY")
                        : row.endDate}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] break-words">
                      {row.groups}
                    </TableCell>
                    <TableCell className="border-r border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] break-words">
                      {row.status}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        {row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT && canUpdateSchedule ? (
                          <button
                            type="button"
                            className="cursor-pointer"
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
                          disabled={deleteRow.isPending || row.statusRaw !== SchedulePayPeriodGroupStatus.DRAFT}
                          onClick={async () => {
                            if (row.statusRaw !== SchedulePayPeriodGroupStatus.DRAFT) return
                            const id = Number(row.id)
                            if (!Number.isFinite(id) || id <= 0) return
                            try {
                              await deleteRow.mutateAsync(id)
                              toast.success("Deleted successfully", participantGroupSuccessToastOptions)
                            } catch {
                              // Error toast handled at higher-level API wrapper patterns elsewhere; keep silent here.
                            }
                          }}
                          className="flex h-5 w-5 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Delete scheduled row"
                        >
                          {deleteRow.isPending ? (
                            <Spinner className="size-3.5 text-[#DC2626]" />
                          ) : row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT ? (
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

      <div className="block md:hidden space-y-4">
        {scheduledQuery.isFetching && (
          <div className="flex items-center justify-center p-4">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        {scheduledQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`scheduled-card-skeleton-${index}`} className="p-4 border border-[#E5E7EB] rounded-[10px] bg-white space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><Skeleton className="h-3 w-16" /></div>
                <div><Skeleton className="h-3 w-20" /></div>
                <div><Skeleton className="h-3 w-16" /></div>
                <div><Skeleton className="h-3 w-20" /></div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[#E5E7EB] pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))
        ) : scheduledRows.length === 0 ? (
          <div className="p-8 border border-[#E5E7EB] rounded-[10px] bg-white text-center">
            <img src={tableEmptyIcon} alt="" className="mx-auto size-[80px] object-contain" />
          </div>
        ) : (
          scheduledRows.map((row) => (
            <div key={row.id} className="border border-[#E5E7EB] rounded-[10px] bg-white overflow-hidden shadow-sm flex flex-col text-[13px] text-[#111827]">
              {/* Header */}
              <div className="bg-[#6C5DD3] px-5 py-3 text-white flex items-center justify-between">
                <span className="font-bold text-[14px] leading-none">{row.timeStudyPeriod}</span>
                <div className="flex items-center gap-1.5">
                  {row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT && canUpdateSchedule && (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center p-1 rounded hover:bg-white/10"
                      onClick={() => {
                        setEditingScheduledRow(row)
                        setFormMountKey((k) => k + 1)
                        setCreateScheduledOpen(true)
                      }}
                      aria-label="Edit scheduled row"
                    >
                      <img src={editIconImg} alt="Edit" className="size-[16px] object-contain brightness-0 invert" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={deleteRow.isPending || row.statusRaw !== SchedulePayPeriodGroupStatus.DRAFT}
                    className="inline-flex cursor-pointer items-center justify-center p-1 rounded hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={async () => {
                      if (row.statusRaw !== SchedulePayPeriodGroupStatus.DRAFT) return
                      const id = Number(row.id)
                      if (!Number.isFinite(id) || id <= 0) return
                      try {
                        await deleteRow.mutateAsync(id)
                        toast.success("Deleted successfully", participantGroupSuccessToastOptions)
                      } catch {
                        // Handled
                      }
                    }}
                    aria-label="Delete scheduled row"
                  >
                    {deleteRow.isPending ? (
                      <Spinner className="size-3.5 text-white" />
                    ) : (
                      <Trash2 className="size-[15px] text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3.5 flex-1">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">Start Date:</span>
                  <span className="font-normal text-gray-600 text-right text-[13px]">
                    {dayjs(row.startDate).isValid() && row.startDate.includes("T")
                      ? dayjs(row.startDate).format("MM-DD-YYYY")
                      : row.startDate}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">End Date:</span>
                  <span className="font-normal text-gray-600 text-right text-[13px]">
                    {dayjs(row.endDate).isValid() && row.endDate.includes("T")
                      ? dayjs(row.endDate).format("MM-DD-YYYY")
                      : row.endDate}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">Groups:</span>
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-[70%]">
                    {row.groups && row.groups.trim().length > 0 ? (
                      row.groups.split(", ").map((groupName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-[6px] border border-[#d8dae3] bg-[#f8f9fa] px-2 py-0.5 text-[10px] text-[#4b5563] font-normal"
                        >
                          {groupName}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#9ca3af]">—</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pb-1">
                  <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">Status:</span>
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-normal",
                    row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT 
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : row.statusRaw === SchedulePayPeriodGroupStatus.PUBLISHED
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {row.status}
                  </span>
                </div>
              </div>
            </div>
          )))}
      </div>

      <div className="mt-6 flex min-h-[64px] w-full items-center justify-center sm:justify-end rounded-[15px] bg-white px-4 py-4 shadow-[0_0_20px_0_#0000001a]">
        <Pagination className="mx-0 w-auto justify-center sm:justify-end">
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
        participantGroupOptions={[]}
        groupsDetailed={[]}
        editingRow={editingScheduledRow}
      />
    </>
  )
}
