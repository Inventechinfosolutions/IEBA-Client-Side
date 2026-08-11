import { useMemo } from "react"
import { useTimeStudyMGT } from "../hooks/useTimeStudyMGT"
import { toIsoYmdFromDate } from "@/lib/dates"
import { MgtEmployeePanel } from "../components/MgtEmployeePanel"
import { MgtLegendCard } from "../components/MgtLegendCard"
import { PersonalTimeStudyCalendarCard } from "../../components/PersonalTimeStudyCalendarCard"
import { Check, X, Unlock, Bell, Info, Pencil, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActionUserTimeRecordRanges } from "../mutations/updateActionUserTimeRecord"
import {
  useSubmitMgtTimeRecords,
  useDeleteMgtTimeRecord,
} from "../mutations/submitMgtTimeRecords"
import { PersonalTimeStudyEntryForm } from "../../components/PersonalTimeStudyEntryForm"
import { PersonalTimeStudyMobileEntryForm } from "../../components/PersonalTimeStudyMobileEntryForm"
import { WeekStatusIcon } from "../../components/WeekStatusIcon"
import { FUTURE_WEEK_STATUS } from "../../utils/weekSummaryUtils"
import { MgtActionDateDialog } from "../components/MgtActionDateDialog"
import type { MgtActionDateRange } from "../api/timeStudyMGTApi"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function isPendingSubmissionStatus(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase()
  return (
    s.startsWith("submitted") ||
    s.includes("target met") ||
    s.includes("equal hours") ||
    s === "less_hours" ||
    s === "more_hours" ||
    s === "equal_hours" ||
    s === "submitted" ||
    s === "submittedless" ||
    s === "submittedexceed"
  )
}

function isApprovedStatus(status: unknown): boolean {
  const s = String(status ?? "").toLowerCase()
  return s === "approved" || s === "approved_time_entry" || s.startsWith("approved")
}

/** Day can be edited when not submitted/approved (unlock or reject first). */
function canSupervisorEditDay(status: unknown): boolean {
  if (!status) return true
  if (isApprovedStatus(status)) return false
  if (isPendingSubmissionStatus(status)) return false
  return true
}

export function TimeStudyMGTPage() {
  const {
    search, setSearch,
    selectedUserId,
    selectedEmployee,
    currentDate, setCurrentDate,
    selectedDate, setSelectedDate,
    filteredEmployees,
    dayStatuses,
    weekSummaries,
    allocatedTotal,
    actualTotal,
    balanceTotal,
    dayDetail,
    dropdownData,
    isEmployeeListLoading,
    selectEmployee,
    actualMultiTotal,
    multiBalanceTotal,
    isDayDetailLoading,
    isDropdownLoading,
    apportioningConfig,
    apportioningRecords,
    refetchConfig,
    isEditing,
    startEditing,
    stopEditing,
    handleOpenDropdown,
    departmentMulticodes,
    fetchingDepartments,
    fetchMulticodeProgramsForDepartment,
    month,
    year,
  } = useTimeStudyMGT()

  const { mutateAsync: applyAction, isPending: isActionPending } = useActionUserTimeRecordRanges()

  const dateStr = selectedDate ? toIsoYmdFromDate(selectedDate) : ""
  const submitMutation = useSubmitMgtTimeRecords(selectedUserId ?? "", dateStr, month, year)
  const deleteMutation = useDeleteMgtTimeRecord(selectedUserId ?? "", dateStr, month, year)

  const selectedDayStatus = dateStr ? dayStatuses[dateStr]?.status : undefined
  const dayEditable = canSupervisorEditDay(selectedDayStatus)
  const employeeDisplayName = selectedEmployee
    ? (`${selectedEmployee.firstName ?? ""} ${selectedEmployee.lastName ?? ""}`.trim() || selectedEmployee.name || "")
    : ""

  const editDisabledReason = useMemo(() => {
    if (!selectedUserId || !selectedDate) return "Select an employee and day first"
    if (isApprovedStatus(selectedDayStatus)) {
      return "Day is approved. Unlock it first, then edit."
    }
    if (isPendingSubmissionStatus(selectedDayStatus)) {
      return "Day is submitted. Unlock or reject it first, then edit."
    }
    return null
  }, [selectedUserId, selectedDate, selectedDayStatus])

  const formBusy =
    isDayDetailLoading || submitMutation.isPending || deleteMutation.isPending

  const formProps = {
    key: `${selectedUserId}-${dateStr}-${isEditing ? "edit" : "view"}`,
    dateStr,
    userId: selectedUserId!,
    username: employeeDisplayName,
    initialRecords: dayDetail?.timeStudyRecords,
    dropdownData,
    leaveRecords: dayDetail?.leaveRecords as any,
    readonly: !isEditing,
    allocatedTotal,
    actualTotal,
    balanceTotal,
    actualMultiTotal,
    multiBalanceTotal,
    showLeaveBanner: true,
    isLoading: formBusy,
    isDropdownLoading,
    onOpenDropdown: handleOpenDropdown,
    apportioningConfig,
    apportioningRecords,
    apportioningSummary: dayDetail?.apportioningSummary,
    refetchConfig,
    departmentMulticodes,
    fetchingDepartments,
    onFetchMulticodeDept: fetchMulticodeProgramsForDepartment,
    onSave: isEditing
      ? (records: any[]) => {
          submitMutation.mutate({ records, mode: "save" })
        }
      : undefined,
    onSubmit: isEditing
      ? (records: any[]) => {
          submitMutation.mutate(
            { records, mode: "submit" },
            { onSuccess: () => stopEditing() },
          )
        }
      : undefined,
    onDelete: isEditing ? (id: number) => deleteMutation.mutate(id) : undefined,
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">

        {/* 3-column layout on desktop: Employee Panel | Calendar | Legend */}
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-stretch px-1 sm:px-3">

          {/* Left: Employee list */}
          <MgtEmployeePanel
            search={search}
            onSearchChange={setSearch}
            employees={filteredEmployees}
            selectedUserId={selectedUserId}
            onSelect={selectEmployee}
            isLoading={isEmployeeListLoading}
          />

          {/* Middle: Calendar */}
          <div className="flex-1 min-w-0 px-0 sm:px-3 overflow-x-auto">
            <PersonalTimeStudyCalendarCard
              weekRows={[]}
              variant="management"
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              currentMonthDate={currentDate}
              onMonthChange={setCurrentDate}
              dayStatuses={dayStatuses}
              weekSummaries={weekSummaries}
              showActionColumn={true}
              renderStatus={(_weekIndex, _dates, status) => <WeekStatusIcon status={status} />}
              renderAction={(_weekIndex, dates, status) => {
                const s = String(status).toLowerCase()
                if (s === FUTURE_WEEK_STATUS) return null

                const isApproved = s === "approved"
                const isSubmitted = s === "submitted" || s === "submittedexceed" || s === "submittedless"
                const hasRejectedDayInWeek = dates.some((date) => {
                  const d = toIsoYmdFromDate(date)
                  return String(dayStatuses[d]?.status ?? "").toLowerCase() === "rejected"
                })
                const hasPendingSubmittedDays = dates.some((date) => {
                  const d = toIsoYmdFromDate(date)
                  return isPendingSubmissionStatus(dayStatuses[d]?.status)
                })
                const showApproveReject = isSubmitted || hasPendingSubmittedDays
                const showUnlock = isApproved && !hasPendingSubmittedDays

                const handleAction = async (action: string, dateRanges: MgtActionDateRange[]) => {
                  if (!selectedUserId) return
                  await applyAction({
                    userId: selectedUserId,
                    dateRanges,
                    status: action,
                  })
                }

                return (
                  <div className="flex items-center gap-1.5">
                    {showApproveReject && (
                      <>
                        {!hasRejectedDayInWeek && (
                          <MgtActionDateDialog
                            action="approved"
                            dates={dates}
                            dayStatuses={dayStatuses}
                            isSubmitting={isActionPending}
                            onConfirm={(dateRanges) => handleAction("approved", dateRanges)}
                            trigger={
                              <button
                                type="button"
                                aria-label="Choose days to approve"
                                title="Approve"
                                className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] hover:bg-[#16a34a] shrink-0 transition-colors shadow-sm cursor-pointer animate-zoom-in-out z-10 relative"
                              >
                                <Check className="size-2.5 text-white" />
                              </button>
                            }
                          />
                        )}
                        <MgtActionDateDialog
                          action="rejected"
                          dates={dates}
                          dayStatuses={dayStatuses}
                          isSubmitting={isActionPending}
                          onConfirm={(dateRanges) => handleAction("rejected", dateRanges)}
                          trigger={
                            <button
                              type="button"
                              aria-label="Choose days to reject"
                              title="Reject"
                              className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] hover:bg-[#dc2626] shrink-0 transition-colors shadow-sm cursor-pointer"
                            >
                              <X className="size-2.5 text-white" />
                            </button>
                          }
                        />
                      </>
                    )}

                    {showUnlock && (
                      <>
                        <MgtActionDateDialog
                          action="opened"
                          dates={dates}
                          dayStatuses={dayStatuses}
                          isSubmitting={isActionPending}
                          onConfirm={(dateRanges) => handleAction("opened", dateRanges)}
                          trigger={
                            <button
                              type="button"
                              aria-label="Choose days to unlock"
                              title="Unlock"
                              className="inline-flex size-5 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 shrink-0 transition-colors border border-gray-200 cursor-pointer"
                            >
                              <Unlock className="size-3 text-gray-600" />
                            </button>
                          }
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-[#6c5dd3] hover:opacity-80 shrink-0 transition-opacity cursor-pointer">
                              <Info className="size-4" strokeWidth={1.5} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
                            Time Sheet was Approved for a week do you want to unlock it press unlock icon
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}

                    {!showApproveReject && !showUnlock && (
                      <>
                        <MgtActionDateDialog
                          action="notify"
                          dates={dates}
                          dayStatuses={dayStatuses}
                          isSubmitting={isActionPending}
                          onConfirm={(dateRanges) => handleAction("notify", dateRanges)}
                          trigger={
                            <button
                              type="button"
                              aria-label="Choose days to notify"
                              title="Notify"
                              className="inline-flex size-5 items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Bell className="size-4" style={{ fill: "#6c5dd3", stroke: "#6c5dd3" }} aria-hidden />
                            </button>
                          }
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-[#6c5dd3] hover:opacity-80 shrink-0 transition-opacity cursor-pointer">
                              <Info className="size-4" strokeWidth={1.5} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
                            Time Sheet was not submitted by user do you want to notify them? press notify icon
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                )
              }}
            />
          </div>

          {/* Right: Legend */}
          <div className="w-full xl:w-[200px] 2xl:w-[220px] shrink-0 self-start">
            <MgtLegendCard />
          </div>

        </div>

        {/* Time Study Entry Form — editable when supervisor clicks pencil */}
        {selectedUserId && selectedDate && (
          <div className="mt-4 mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 sm:px-3">
              <div className="text-sm text-muted-foreground">
                {isEditing ? (
                  <span>
                    Editing time study for <span className="font-medium text-foreground">{employeeDisplayName}</span>
                    {" · "}
                    {dateStr}
                  </span>
                ) : (
                  <span>
                    Viewing <span className="font-medium text-foreground">{employeeDisplayName}</span>
                    {" · "}
                    {dateStr}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stopEditing}
                    className="gap-1.5"
                  >
                    <XCircle className="size-3.5" />
                    Cancel edit
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(!dayEditable && "inline-flex")}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!dayEditable}
                          onClick={startEditing}
                          className="gap-1.5"
                          aria-label="Edit this day's time study"
                        >
                          <Pencil className="size-3.5" />
                          Edit day
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {editDisabledReason && (
                      <TooltipContent side="top" className="max-w-[240px] text-xs">
                        {editDisabledReason}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Mobile Card View (< xl) */}
            <div className="xl:hidden">
              <PersonalTimeStudyMobileEntryForm {...formProps} />
            </div>

            {/* Desktop Table View (≥ xl) */}
            <div className="hidden xl:block">
              <PersonalTimeStudyEntryForm {...formProps} />
            </div>
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}
