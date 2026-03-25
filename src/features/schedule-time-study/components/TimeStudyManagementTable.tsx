import { zodResolver } from "@hookform/resolvers/zod"
import { Inbox } from "lucide-react"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import editIconImg from "@/assets/edit-icon.png"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TimeStudyPeriodsForm } from "./ TimeStudyPeriodsForm"
import { ParticipantsListTable } from "./ParticipantsListTable"
import { ScheduledTimeStudyTable } from "./ScheduleTimeStudyTable"
import { TimeStudyTab } from "./TimeStudyTab"
import { useScheduleTimeStudyPeriods } from "../hooks/useScheduleTimeStudyPeriods"
import {
  scheduleTimeStudyDefaultValues,
  scheduleTimeStudyFormSchema,
} from "../schemas"
import { FISCAL_YEAR_OPTIONS } from "../types"
import type {
  ScheduleTimeStudyFormValues,
  ScheduleTimeStudyPeriodRow,
  ScheduleTimeStudyTab,
} from "../types"

function parseTableDate(value: string) {
  const mmDdYyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
  if (mmDdYyyy) {
    const [, monthText, dayText, yearText] = mmDdYyyy
    const month = Number(monthText)
    const day = Number(dayText)
    const year = Number(yearText)
    const parsed = new Date(year, month - 1, day)
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed
    }
  }

  const yyyyMmDd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (yyyyMmDd) {
    const [, yearText, monthText, dayText] = yyyyMmDd
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)
    const parsed = new Date(year, month - 1, day)
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed
    }
  }

  return null
}

function canEditPeriodRow(endDateValue: string) {
  const parsedEndDate = parseTableDate(endDateValue)
  if (!parsedEndDate) return false

  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const rowEndDateOnly = new Date(
    parsedEndDate.getFullYear(),
    parsedEndDate.getMonth(),
    parsedEndDate.getDate()
  )
  return rowEndDateOnly >= todayOnly
}

export function ScheduleTimeStudyTable() {
  const [activeTab, setActiveTab] = useState<ScheduleTimeStudyTab>(
    "time-study-period-management"
  )
  const form = useForm<ScheduleTimeStudyFormValues>({
    resolver: zodResolver(scheduleTimeStudyFormSchema),
    defaultValues: scheduleTimeStudyDefaultValues,
    mode: "onSubmit",
  })

  const onSubmit = form.handleSubmit(() => {
    form.reset(scheduleTimeStudyDefaultValues)
  })
  const selectedDepartment = form.watch("department")
  const { rows, isLoading } = useScheduleTimeStudyPeriods(selectedDepartment)
  const selectedStudyYear = form.watch("studyYear")
  const selectedFile = form.watch("file")
  const hasSelectedDepartment = Boolean(selectedDepartment.trim())
  const [createPeriodsOpen, setCreatePeriodsOpen] = useState(false)
  /** Bumped on each modal open so TimeStudyPeriodsForm remounts with fresh defaults (no useEffect in child). */
  const [periodsFormMountKey, setPeriodsFormMountKey] = useState(0)
  const [createdPeriodRows, setCreatedPeriodRows] = useState<ScheduleTimeStudyPeriodRow[]>([])
  const [editedPeriodRows, setEditedPeriodRows] = useState<
    Record<string, ScheduleTimeStudyPeriodRow>
  >({})
  const [editingPeriodRow, setEditingPeriodRow] = useState<ScheduleTimeStudyPeriodRow | null>(null)
  const [deletedPeriodRowIds, setDeletedPeriodRowIds] = useState<string[]>([])
  const periodRows = [...createdPeriodRows, ...rows]
    .map((row) => editedPeriodRows[row.id] ?? row)
    .filter(
    (row) => !deletedPeriodRowIds.includes(row.id)
    )

  return (
    <section className="ieba-roboto min-h-[743px] space-y-5 rounded-[10px] border border-[#E5E7EB] bg-white p-6">
      <div className="space-y-2">
        <Label className="text-[14px] font-normal text-[#1F2937]">Select Department</Label>
        <Select
          value={selectedDepartment || undefined}
          onValueChange={(value) => form.setValue("department", value, { shouldValidate: true })}
        >
          <SelectTrigger className="h-12 w-[190px] rounded-[10px] border-[#D1D5DB] px-[14px] text-[14px] text-[#111827] shadow-none focus:ring-0 [&_[data-slot=select-value]]:text-[#111827] [&_[data-slot=select-value]]:text-[14px] [&_[data-slot=select-value]]:font-normal">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            side="bottom"
            avoidCollisions={false}
            sideOffset={8}
            align="start"
            className="rounded-[14px] border-[#E5E7EB] p-1"
          >
            <SelectItem value="behavioral-health">Behavioral Health</SelectItem>
            <SelectItem value="public-health">Public Health</SelectItem>
            <SelectItem value="social-services">Social Services</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.department ? (
          <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>
        ) : null}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ScheduleTimeStudyTab)}
        className="w-full"
      >
        <TabsList className="grid !h-[62px] w-full grid-cols-3 items-stretch gap-0 overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white p-0">
          <TimeStudyTab
            value="time-study-period-management"
            label="Time Study Period Management"
          />
          <TimeStudyTab value="participants-list" label="Participants List" />
          <TimeStudyTab value="scheduled-time-study" label="Scheduled Time Study" />
        </TabsList>

        <TabsContent value="time-study-period-management" className="mt-3 space-y-4">
          {!hasSelectedDepartment ? (
            <p className="pt-1 pb-4 text-center text-[15px] font-normal text-red-600">
              Please select department to view payperiods
            </p>
          ) : (
            <>
          <h3 className="text-[16px] font-medium leading-none text-[#6C5DD3]">
            Time Study Period MGMT
          </h3>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="mt-6 space-y-1">
              <Select
                value={selectedStudyYear}
                onValueChange={(value) =>
                  form.setValue("studyYear", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="h-[54px] w-[170px] rounded-[10px] border-[#D1D5DB] px-[12px] text-[14px] font-normal text-[#111827] shadow-none focus:ring-0 [&_[data-slot=select-value]]:text-[14px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  avoidCollisions={false}
                  sideOffset={12}
                  align="start"
                  className="w-[180px] rounded-[10px] border border-[#E5E7EB] bg-white p-1 shadow-[0_4px_16px_#00000014]"
                >
                  {FISCAL_YEAR_OPTIONS.map((year) => (
                    <SelectItem
                      key={year}
                      value={year}
                      className={cn(
                        "h-[42px] rounded-[8px] px-5 pr-5 text-[14px] font-normal text-[#111827] focus:bg-[#F3F4F6] [&>span:first-child]:hidden",
                        selectedStudyYear === year && "bg-[#F3F4F6]"
                      )}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.studyYear ? (
                <p className="text-xs text-destructive">{form.formState.errors.studyYear.message}</p>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-3">
              <div className="w-full sm:w-[297px]">
                <Input
                  id="schedule-time-study-file"
                  type="file"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    form.setValue("file", file, { shouldValidate: true })
                  }}
                />
                <label
                  htmlFor="schedule-time-study-file"
                  className="flex h-[69px] w-full cursor-pointer items-center rounded-[14px] border border-[#C8CDD6] bg-white px-[24px] py-[19px] transition-colors hover:border-[#6C5DD3] focus-within:border-[#6C5DD3]"
                >
                  <span className="mr-1 inline-flex h-7 min-w-[91px] items-center justify-center rounded-[3px] border border-[#757575] bg-[#F5F5F5] px-[6px] text-[15px] leading-none font-normal text-black">
                    Choose File
                  </span>
                  <span className="truncate text-[15px] leading-none font-normal text-black">
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
                </label>
                {form.formState.errors.file ? (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.file.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                className="h-10 w-[180px] rounded-[12px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
                onClick={() => {
                  setEditingPeriodRow(null)
                  setPeriodsFormMountKey((k) => k + 1)
                  setCreatePeriodsOpen(true)
                }}
              >
                Add Time Study Period
              </Button>
            </form>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB]">
            <Table className="w-full table-fixed">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[7%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="h-[60px] bg-[#6C5DD3] hover:bg-[#6C5DD3]">
                  {[
                    "Time Study Period",
                    "Start Date",
                    "End Date",
                    "Hours",
                    "Holidays",
                    "Allocable",
                    "Non-Allocable",
                    "Action",
                  ].map((header) => (
                    <TableHead
                      key={header}
                      className="h-[60px] border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[12px] text-left text-[14px] font-normal text-white last:border-r-0"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={`period-skeleton-${index}`} className="h-[44px] border-[#EDEDED]">
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2">
                        <Skeleton className="h-4 w-[85%]" />
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2">
                        <Skeleton className="h-4 w-[70%]" />
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2">
                        <Skeleton className="h-4 w-[70%]" />
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                        <Skeleton className="mx-auto h-4 w-8" />
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                        <Skeleton className="mx-auto h-4 w-8" />
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                        <Skeleton className="mx-auto h-4 w-10" />
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center">
                        <Skeleton className="mx-auto h-4 w-10" />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <Skeleton className="mx-auto h-4 w-6" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : periodRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-[145px] bg-white text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                        <Inbox className="size-10 text-[#D1D5DB]" />
                        <span className="text-[14px]">No data</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  periodRows.map((row) => (
                    <TableRow key={row.id} className="h-[44px] border-[#EDEDED]">
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827]">
                        {row.timeStudyPeriod}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827]">
                        {row.startDate}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827]">
                        {row.endDate}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center text-[13px] text-[#111827]">
                        {row.hours}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center text-[13px] text-[#111827]">
                        {row.holidays}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center text-[13px] text-[#111827]">
                        {row.allocable}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-center text-[13px] text-[#111827]">
                        {row.nonAllocable}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          {canEditPeriodRow(row.endDate) ? (
                            <button
                              type="button"
                              className="text-[#6C5DD3]"
                              onClick={() => {
                                setEditingPeriodRow(row)
                                setPeriodsFormMountKey((k) => k + 1)
                                setCreatePeriodsOpen(true)
                              }}
                            >
                              <img
                                src={editIconImg}
                                alt="Edit"
                                className="h-4 w-4 object-contain"
                              />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="text-[#DC2626]"
                            onClick={() => {
                              setCreatedPeriodRows((prev) =>
                                prev.filter((createdRow) => createdRow.id !== row.id)
                              )
                              setDeletedPeriodRowIds((prev) =>
                                prev.includes(row.id) ? prev : [...prev, row.id]
                              )
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
            </>
          )}
        </TabsContent>

        <TabsContent value="participants-list" className="mt-3">
          {!hasSelectedDepartment ? (
            <p className="pt-1 pb-4 text-center text-[15px] font-normal text-red-600">
              Please select department to view participant groups
            </p>
          ) : (
            <ParticipantsListTable
              studyYear={selectedStudyYear}
              selectedDepartment={selectedDepartment}
              onStudyYearChange={(value) =>
                form.setValue("studyYear", value, { shouldValidate: true })
              }
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled-time-study" className="mt-3 space-y-4">
          {!hasSelectedDepartment ? (
            <p className="pt-1 pb-4 text-center text-[15px] font-normal text-red-600">
              Please select department to view scheduled payperiods
            </p>
          ) : (
            <>
          <h3 className="text-[16px] font-medium leading-none text-[#6C5DD3]">
            Schedule Time Study
          </h3>
          <ScheduledTimeStudyTable
            selectedStudyYear={selectedStudyYear}
            onStudyYearChange={(value) => form.setValue("studyYear", value, { shouldValidate: true })}
            selectedDepartment={selectedDepartment}
            periodRows={periodRows}
          />
            </>
          )}
        </TabsContent>
      </Tabs>

      <TimeStudyPeriodsForm
        key={`${periodsFormMountKey}-${editingPeriodRow?.id ?? "new"}`}
        open={createPeriodsOpen}
        onOpenChange={(nextOpen) => {
          setCreatePeriodsOpen(nextOpen)
          if (!nextOpen) {
            setEditingPeriodRow(null)
          }
        }}
        selectedDepartment={selectedDepartment}
        editingRow={editingPeriodRow}
        onSave={(row) => {
          setCreatedPeriodRows((prev) => {
            const existingIndex = prev.findIndex((item) => item.id === row.id)
            if (existingIndex >= 0) {
              return prev.map((item) => (item.id === row.id ? row : item))
            }
            return [row, ...prev]
          })
          setEditedPeriodRows((prev) => ({ ...prev, [row.id]: row }))
        }}
      />
    </section>
  )
}
