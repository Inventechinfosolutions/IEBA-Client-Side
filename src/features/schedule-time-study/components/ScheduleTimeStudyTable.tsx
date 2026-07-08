import dayjs from "dayjs"
import { useState } from "react"
import { cn } from "@/lib/utils"

import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/usePermissions"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
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

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [prevQueryKey, setPrevQueryKey] = useState("")
  const queryKey = `${departmentId}-${selectedStudyYear}`
  if (queryKey !== prevQueryKey) {
    setCurrentPage(1)
    setPrevQueryKey(queryKey)
  }

  const paginatedRows = scheduledRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
                ) : paginatedRows.map((row) => (
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

      <MasterCodePagination
        totalItems={scheduledRows.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />

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
