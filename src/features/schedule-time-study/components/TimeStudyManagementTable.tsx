import dayjs from "dayjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"

import { AlertCircle, Check, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Spinner } from "@/components/ui/spinner"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
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
import { fetchScheduleTimeStudyFiscalYears } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import { usePermissions } from "@/hooks/usePermissions"
import { resolveCurrentFiscalYearId } from "@/features/settings/components/FiscalYear/fiscalYearDateUtils"
import type {
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

function buildScheduleTimeStudyFormDefaults(): ScheduleTimeStudyFormValues {
  return {
    department: "",
    studyYear: "",
    file: null,
  }
}

export function ScheduleTimeStudyTable() {
  const departmentsQuery = useGetScheduleTimeStudyDepartments()

  if (departmentsQuery.isPending) {
    return (
      <section className="min-h-[743px] space-y-4 rounded-[10px] border border-[#E5E7EB] bg-white p-6">
        <Skeleton className="h-12 w-[220px]" />
        <Skeleton className="h-[62px] w-full" />
        <Skeleton className="h-[320px] w-full" />
      </section>
    )
  }

  if (departmentsQuery.isError) {
    return (
      <section className="rounded-[10px] border border-[#E5E7EB] bg-white p-6">
        <p className="text-[15px] text-destructive">
          Could not load departments. Check your API connection and try again.
        </p>
      </section>
    )
  }

  const departments = departmentsQuery.data?.items ?? []

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
      isDepartmentsFetching={departmentsQuery.isFetching}
    />
  )
}

function ScheduleTimeStudyTableLoaded({
  departments,
  isDepartmentsFetching = false,
}: ScheduleTimeStudyTableLoadedProps & { isDepartmentsFetching?: boolean }) {
  const queryClient = useQueryClient()
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
    defaultValues: buildScheduleTimeStudyFormDefaults(),
    mode: "onSubmit",
  })

  const selectedDepartment = useWatch({ control: form.control, name: "department" }) ?? ""
  const selectedStudyYear = useWatch({ control: form.control, name: "studyYear" }) ?? ""
  const selectedFile = useWatch({ control: form.control, name: "file" })
  const hasSelectedDepartment = Boolean(selectedDepartment.trim())

  const fiscalYearsQuery = useGetScheduleTimeStudyFiscalYears({ enabled: hasSelectedDepartment })
  const fiscalYearOptions = fiscalYearsQuery.data ?? []

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
    activeTab === "time-study-period-management"
  const { rows, isLoading, isFetching } = useScheduleTimeStudyPeriods(
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

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [prevQueryKey, setPrevQueryKey] = useState("")
  const queryKey = `${departmentId}-${selectedStudyYear}`
  if (queryKey !== prevQueryKey) {
    setCurrentPage(1)
    setPrevQueryKey(queryKey)
  }

  const paginatedPeriodRows = periodRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <section className="font-roboto *:font-roboto min-h-[743px] space-y-5 rounded-[10px] border border-[#E5E7EB] bg-white p-6">
      <div className="space-y-2">
        <Label className="text-[14px] font-normal text-[#1F2937]">Select Department</Label>
        <SingleSelectDropdown
          value={selectedDepartment || ""}
          onChange={async (value) => {
            form.setValue("department", value, { shouldValidate: true })
            if (value && !form.getValues("studyYear")) {
              try {
                const fiscalYears = await queryClient.fetchQuery({
                  queryKey: scheduleTimeStudyKeys.fiscalYears(),
                  queryFn: fetchScheduleTimeStudyFiscalYears,
                })
                if (fiscalYears.length > 0 && !form.getValues("studyYear")) {
                  form.setValue("studyYear", resolveCurrentFiscalYearId(fiscalYears), {
                    shouldValidate: true,
                  })
                }
              } catch (err) {
                console.error("Failed to fetch fiscal years automatically", err)
              }
            }
          }}
          onBlur={() => {}}
          options={filteredDepartments.map((dept) => ({ value: String(dept.id), label: dept.name }))}
          placeholder="Select department"
          className="h-10 w-[190px] rounded-[10px] border-[#D1D5DB] px-[14px] text-[14px] text-[#111827] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          isLoading={isDepartmentsFetching}
        />
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

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <SingleSelectDropdown
                value={selectedStudyYear}
                onChange={(value) => {
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
                onBlur={() => {}}
                options={fiscalYearOptions.map((fy) => ({ value: fy.id, label: fy.label }))}
                placeholder="Select year"
                className="h-10 w-[170px] rounded-[10px] border-[#D1D5DB] px-[12px] text-[14px] font-normal text-[#111827] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {form.formState.errors.studyYear ? (
                <p className="text-xs text-destructive">{form.formState.errors.studyYear.message}</p>
              ) : null}
            </div>

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
              className="flex items-center gap-5"
            >
              <div className="w-full sm:w-[220px]">
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
                  className="flex h-10 w-full cursor-pointer items-center rounded-[6px] border border-[#C8CDD6] bg-white px-[10px] py-[6px] transition-colors hover:border-[#6C5DD3] focus-within:border-[#6C5DD3]"
                >
                  <span className="mr-1 inline-flex h-7 min-w-[91px] whitespace-nowrap items-center justify-center rounded-[3px] border border-[#757575] bg-[#F5F5F5] px-[6px] text-[15px] leading-none font-normal text-black">
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
                className="h-10 w-[180px] rounded-[6px] bg-[#6C5DD3] px-[15px] text-[14px] font-normal text-white hover:bg-[#5D4FC4]"
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

          <div className="relative overflow-hidden rounded-[10px] border border-[#E5E7EB]">
            {isFetching && (
              <div className="absolute top-[60px] inset-x-0 bottom-0 flex items-center justify-center bg-white/50 z-[50]">
                <Spinner className="text-[#6C5DD3]" />
              </div>
            )}
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
                        <img src={tableEmptyIcon} alt="" className="size-[80px] object-contain" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPeriodRows.map((row) => (
                    <TableRow key={row.id} className="h-[44px] border-[#EDEDED] hover:bg-[#fafafa]">
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827] break-words whitespace-normal">
                        {row.timeStudyPeriod}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827] break-words whitespace-normal">
                        {dayjs(row.startDate).isValid() && row.startDate.includes("T")
                          ? dayjs(row.startDate).format("MM-DD-YYYY")
                          : row.startDate}
                      </TableCell>
                      <TableCell className="border-r border-[#E5E7EB] px-4 py-2 text-[13px] text-[#111827] break-words whitespace-normal">
                        {dayjs(row.endDate).isValid() && row.endDate.includes("T")
                          ? dayjs(row.endDate).format("MM-DD-YYYY")
                          : row.endDate}
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="inline-flex shrink-0 cursor-not-allowed text-[#D1D5DB]"
                                    role="img"
                                    aria-label="Time Study Period is already in use"
                                  >
                                    <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black text-white px-3 py-1.5 rounded-md text-xs">
                                  Time Study Period is already in use
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="text-[#6C5DD3] cursor-pointer"
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
                                className="flex size-4 cursor-pointer items-center justify-center text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40"
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
                                {deletePayPeriod.isPending ? (
                                  <Spinner className="size-3.5 text-[#DC2626]" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
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

          <MasterCodePagination
            totalItems={periodRows.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
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
