import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Check, Inbox, Trash2, X } from "lucide-react"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import editIconImg from "@/assets/edit-icon.png"
import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
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
import { TimeStudyPeriodsForm } from "./TimeStudyPeriodsForm"
import { ParticipantsListTable } from "./ParticipantsListTable"
import { ScheduledTimeStudyTable } from "./ScheduleTimeStudyTable"
import { TimeStudyTab } from "./TimeStudyTab"
import { useScheduleTimeStudyPeriods } from "../hooks/useScheduleTimeStudyPeriods"
import { useDeleteRmtsPayPeriod } from "../mutations/deleteRmtsPayPeriod"
import { useGetScheduleTimeStudyDepartments } from "../queries/getScheduleTimeStudyDepartments"
import { useGetScheduleTimeStudyFiscalYears } from "../queries/getScheduleTimeStudyFiscalYears"
import {
  scheduleTimeStudyFormSchema,
} from "../schemas"
import { fetchScheduleTimeStudyPeriodRows } from "../queries/getRmtsPayPeriods"
import { usePermissions } from "@/hooks/usePermissions"
import type {
  ScheduleTimeStudyFiscalYearOption,
  ScheduleTimeStudyFormValues,
  ScheduleTimeStudyPeriodRow,
  ScheduleTimeStudyTab,
  ScheduleTimeStudyTableLoadedProps,
} from "../types"

const payPeriodDeleteSuccessToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
      <Check className="size-3 stroke-3" />
    </span>
  ),
  className:
    "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
}

const noDataToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#facc15] text-white">
      <AlertCircle className="size-3 stroke-3" />
    </span>
  ),
  className:
    "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
}

function buildScheduleTimeStudyFormDefaults(
  fiscalYearOptions: readonly ScheduleTimeStudyFiscalYearOption[],
): ScheduleTimeStudyFormValues {
  const first = fiscalYearOptions[0]
  return {
    department: "",
    studyYear: first?.id ?? "",
    file: null,
  }
}

export function ScheduleTimeStudyTable() {
  const departmentsQuery = useGetScheduleTimeStudyDepartments()
  const fiscalYearsQuery = useGetScheduleTimeStudyFiscalYears()

  if (departmentsQuery.isPending || fiscalYearsQuery.isPending) {
    return (
      <section className="min-h-[743px] space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-6">
        <Skeleton className="h-12 w-[220px]" />
        <Skeleton className="h-[62px] w-full" />
        <Skeleton className="h-[320px] w-full" />
      </section>
    )
  }

  if (departmentsQuery.isError || fiscalYearsQuery.isError) {
    return (
      <section className="rounded-[10px] border border-[#E5E7EB] bg-white p-6">
        <p className="text-[15px] text-destructive">
          Could not load departments or fiscal years. Check your API connection and try again.
        </p>
      </section>
    )
  }

  const departments = departmentsQuery.data?.items ?? []
  const fiscalYearOptions = fiscalYearsQuery.data ?? []

  if (departments.length === 0) {
    return (
      <section className="rounded-[10px] border border-[#E5E7EB] bg-white p-6">
        <p className="text-[15px] text-muted-foreground">No departments are available.</p>
      </section>
    )
  }

  return (
    <ScheduleTimeStudyTableLoaded
      departments={departments}
      fiscalYearOptions={fiscalYearOptions}
    />
  )
}

function ScheduleTimeStudyTableLoaded({
  departments,
  fiscalYearOptions,
}: ScheduleTimeStudyTableLoadedProps) {
  const { isSuperAdmin, assignedDepartmentIds } = usePermissions()
  const filteredDepartments = useMemo(() => {
    if (isSuperAdmin) return departments
    return departments.filter(d => assignedDepartmentIds.some(id => String(id) === String(d.id)))
  }, [departments, isSuperAdmin, assignedDepartmentIds])

  const [activeTab, setActiveTab] = useState<ScheduleTimeStudyTab>(
    "time-study-period-management"
  )
  const form = useForm<ScheduleTimeStudyFormValues>({
    resolver: zodResolver(scheduleTimeStudyFormSchema),
    defaultValues: buildScheduleTimeStudyFormDefaults(fiscalYearOptions),
    mode: "onSubmit",
  })

  const selectedDepartment = useWatch({ control: form.control, name: "department" }) ?? ""
  const selectedStudyYear = useWatch({ control: form.control, name: "studyYear" }) ?? ""
  const selectedFile = useWatch({ control: form.control, name: "file" })
  const hasSelectedDepartment = Boolean(selectedDepartment.trim())

  const departmentId = useMemo(() => {
    const idStr = selectedDepartment.trim()
    if (!idStr) return null
    const n = Number(idStr)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [selectedDepartment])

  const selectedDepartmentName = useMemo(() => {
    const idStr = selectedDepartment.trim()
    if (!idStr) return ""
    return departments.find((d) => String(d.id) === idStr)?.name ?? ""
  }, [selectedDepartment, departments])

  const shouldLoadPeriods =
    hasSelectedDepartment &&
    (activeTab === "time-study-period-management" || activeTab === "scheduled-time-study")
  const { rows, isLoading } = useScheduleTimeStudyPeriods(
    departmentId,
    selectedStudyYear,
    shouldLoadPeriods,
  )
  const deletePayPeriod = useDeleteRmtsPayPeriod()

  const [createPeriodsOpen, setCreatePeriodsOpen] = useState(false)
  /** Bumped on each modal open so TimeStudyPeriodsForm remounts with fresh defaults (no useEffect in child). */
  const [periodsFormMountKey, setPeriodsFormMountKey] = useState(0)
  const [editingPeriodRow, setEditingPeriodRow] = useState<ScheduleTimeStudyPeriodRow | null>(null)
  const periodRows = rows

  return (
    <section className="font-roboto *:font-roboto min-h-[743px] space-y-5 rounded-[10px] border border-[#E5E7EB] bg-white p-6">
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
            className="max-h-[280px] rounded-[14px] border-[#E5E7EB] p-1"
          >
            {filteredDepartments.map((dept) => (
              <SelectItem key={dept.id} value={String(dept.id)}>
                {dept.name}
              </SelectItem>
            ))}
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
          {activeTab !== "time-study-period-management" ? null : !hasSelectedDepartment ? (
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
                onValueChange={(value) => {
                  form.setValue("studyYear", value, { shouldValidate: true })
                  if (departmentId) {
                    void fetchScheduleTimeStudyPeriodRows({
                      fiscalyear: value,
                      departmentId,
                    }).then((rows) => {
                      if (rows.length === 0) {
                        toast.error("No record found", noDataToastOptions)
                      }
                    })
                  }
                }}
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
                  {fiscalYearOptions.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-muted-foreground">
                      No fiscal years returned from settings.
                    </div>
                  ) : (
                    fiscalYearOptions.map((fy) => (
                      <SelectItem
                        key={fy.id}
                        value={fy.id}
                        className={cn(
                          "h-[42px] rounded-[8px] px-5 pr-5 text-[14px] font-normal text-[#111827] focus:bg-[#F3F4F6] [&>span:first-child]:hidden",
                          selectedStudyYear === fy.id && "bg-[#F3F4F6]"
                        )}
                      >
                        {fy.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.studyYear ? (
                <p className="text-xs text-destructive">{form.formState.errors.studyYear.message}</p>
              ) : null}
            </div>

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
              className="flex flex-wrap items-start gap-3"
            >
              <div className="w-full sm:w-[297px]">
                <TitleCaseInput
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
                      className="h-[60px] border-r border-[#FFFFFF66] bg-[#6C5DD3] px-[12px] text-left text-[12px] font-normal text-white last:border-r-0"
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
                      <TableCell className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {row.isUsed === true ? (
                            <span
                              className="inline-flex shrink-0 cursor-not-allowed text-[#D1D5DB]"
                              title="Time Study Period is already in use"
                              role="img"
                              aria-label="Time Study Period is already in use"
                            >
                              <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                            </span>
                          ) : (
                            <>
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
                              <button
                                type="button"
                                className="text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={deletePayPeriod.isPending}
                                onClick={() => {
                                  const id = Number(row.id)
                                  if (!Number.isFinite(id) || id <= 0) return
                                  void deletePayPeriod
                                    .mutateAsync(id)
                                    .then(() => {
                                      toast.success(
                                        "Deleted successfully",
                                        payPeriodDeleteSuccessToastOptions,
                                      )
                                    })
                                    .catch((error: unknown) => {
                                      toast.error(
                                        error instanceof Error ? error.message : "Delete failed",
                                      )
                                    })
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          )}
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
          {activeTab !== "participants-list" ? null : !hasSelectedDepartment ? (
            <p className="pt-1 pb-4 text-center text-[15px] font-normal text-red-600">
              Please select department to view participant groups
            </p>
          ) : (
            <ParticipantsListTable
              studyYear={selectedStudyYear}
              selectedDepartment={selectedDepartment}
              selectedDepartmentName={selectedDepartmentName}
              departmentId={departmentId}
              fiscalYearOptions={fiscalYearOptions}
              onStudyYearChange={(value) =>
                form.setValue("studyYear", value, { shouldValidate: true })
              }
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled-time-study" className="mt-3 space-y-4">
          {activeTab !== "scheduled-time-study" ? null : !hasSelectedDepartment ? (
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
            selectedDepartmentName={selectedDepartmentName}
            departmentId={departmentId}
            fiscalYearOptions={fiscalYearOptions}
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
        selectedDepartmentName={selectedDepartmentName}
        departmentId={departmentId}
        fiscalYearOptions={fiscalYearOptions}
        editingRow={editingPeriodRow}
      />
    </section>
  )
}
