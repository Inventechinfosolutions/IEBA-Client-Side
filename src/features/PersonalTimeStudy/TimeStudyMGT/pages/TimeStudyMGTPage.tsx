import { useTimeStudyMGT } from "../hooks/useTimeStudyMGT"
import { toIsoYmdFromDate } from "@/lib/dates"
import { MgtEmployeePanel } from "../components/MgtEmployeePanel"
import { MgtLegendCard } from "../components/MgtLegendCard"
import { PersonalTimeStudyCalendarCard } from "../../components/PersonalTimeStudyCalendarCard"
import { Check, X, Unlock, Bell, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActionUserTimeRecord } from "../mutations/updateActionUserTimeRecord"
import { PersonalTimeStudyEntryForm } from "../../components/PersonalTimeStudyEntryForm"

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
  } = useTimeStudyMGT()

  const { mutate: notifyUser } = useActionUserTimeRecord()

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">

        {/* 3-column layout: Employee Panel | Calendar | Legend */}
        <div className="flex gap-8 items-stretch px-3">

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
          <div className="flex-1 min-w-0 px-3">
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
              renderStatus={(_weekIndex, _dates, status) => {
                const s = String(status).toLowerCase()
                if (s === "approved") {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] shrink-0 cursor-help">
                          <Check className="size-2.5 text-white" aria-hidden />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Approved</TooltipContent>
                    </Tooltip>
                  )
                }
                if (s === "rejected") {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] shrink-0 cursor-help">
                          <X className="size-2.5 text-white" aria-hidden />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Rejected</TooltipContent>
                    </Tooltip>
                  )
                }
                if (s === "submitted" || s === "submittedexceed" || s === "submittedless") {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#3b82f6] shrink-0 cursor-help">
                          <Check className="size-2.5 text-white" aria-hidden />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Submitted</TooltipContent>
                    </Tooltip>
                  )
                }
                return null
              }}
              renderAction={(_weekIndex, dates, status) => {
                const s = String(status).toLowerCase()
                const isApproved = s === "approved"
                const isSubmitted = s === "submitted" || s === "submittedexceed" || s === "submittedless"
                
                const handleAction = (action: string) => {
                  if (!selectedUserId) return
                  const startDate = toIsoYmdFromDate(dates[0])
                  const endDate = toIsoYmdFromDate(dates[dates.length - 1])
                  notifyUser({ userId: selectedUserId, startDate, endDate, status: action })
                }

                return (
                  <div className="flex items-center gap-1.5">
                    {/* If Submitted: Show Approve/Reject ONLY */}
                    {isSubmitted && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleAction("approved")} className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] hover:bg-[#16a34a] shrink-0 transition-colors shadow-sm cursor-pointer">
                              <Check className="size-2.5 text-white" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Approve</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleAction("rejected")} className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] hover:bg-[#dc2626] shrink-0 transition-colors shadow-sm cursor-pointer">
                              <X className="size-2.5 text-white" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Reject</TooltipContent>
                        </Tooltip>
                      </>
                    )}

                    {/* If Approved: Show Unlock + Info */}
                    {isApproved && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleAction("opened")} className="inline-flex size-5 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 shrink-0 transition-colors border border-gray-200 cursor-pointer">
                              <Unlock className="size-3 text-gray-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Unlock</TooltipContent>
                        </Tooltip>
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

                    {/* If Open/Draft/Rejected/Null: Show Notify + Info */}
                    {!isSubmitted && !isApproved && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleAction("notify")} className="inline-flex size-5 items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                              <Bell className="size-4" style={{ fill: "#6c5dd3", stroke: "#6c5dd3" }} aria-hidden />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Notify</TooltipContent>
                        </Tooltip>
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
          <div className="w-[220px] shrink-0 self-start">
            <MgtLegendCard />
          </div>

        </div>

        {/* Read-only Time Study Entry Form with totals integrated */}
        {selectedUserId && selectedDate && (
          <div className="mt-4 mb-4">
            <PersonalTimeStudyEntryForm
              key={`${selectedUserId}-${toIsoYmdFromDate(selectedDate)}`}
              dateStr={toIsoYmdFromDate(selectedDate)}
              userId={selectedUserId}
              username={selectedEmployee?.name || (selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "")}
              initialRecords={dayDetail?.timeStudyRecords}
              dropdownData={dropdownData}
              leaveRecords={dayDetail?.leaveRecords}
              readonly={true}
              allocatedTotal={allocatedTotal}
              actualTotal={actualTotal}
              balanceTotal={balanceTotal}
              actualMultiTotal={actualMultiTotal}
              multiBalanceTotal={multiBalanceTotal}
              showLeaveBanner={true}
              isLoading={isDayDetailLoading}
            />
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}
