import { useTimeStudyMGT } from "../hooks/useTimeStudyMGT"
import { MgtEmployeePanel } from "../components/MgtEmployeePanel"
import { MgtLegendCard } from "../components/MgtLegendCard"
import { PersonalTimeStudyCalendarCard } from "../../components/PersonalTimeStudyCalendarCard"
import { Check, X, Unlock, Bell, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActionUserTimeRecord } from "../mutations/useActionUserTimeRecord"

export function TimeStudyMGTPage() {
  const {
    search, setSearch,
    selectedUserId,
    currentDate, setCurrentDate,
    filteredEmployees,
    dayStatuses,
    weekSummaries,
    allocatedTotal,
    actualTotal,
    balanceTotal,
    isEmployeeListLoading,
    selectEmployee,
  } = useTimeStudyMGT()

  const { mutate: notifyUser } = useActionUserTimeRecord()

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">

        {/* 3-column layout: Employee Panel | Calendar | Legend */}
        <div className="flex gap-4 items-stretch">

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
          <div className="flex-1 min-w-0">
            <PersonalTimeStudyCalendarCard
              weekRows={[]}
              currentMonthDate={currentDate}
              onMonthChange={setCurrentDate}
              dayStatuses={dayStatuses}
              weekSummaries={weekSummaries}
              showActionColumn={true}
              renderStatus={(_weekIndex, _dates, status) => {
                const s = String(status).toLowerCase()
                if (s === "approved") {
                  return (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] shrink-0">
                      <Check className="size-2.5 text-white" aria-hidden />
                    </span>
                  )
                }
                if (s === "rejected") {
                  return (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] shrink-0">
                      <X className="size-2.5 text-white" aria-hidden />
                    </span>
                  )
                }
                // Submission statuses (Equal/More/Less)
                if (s === "submitted") {
                  return <div className="size-2.5 rounded-full bg-[#22c55e]" title="Equal Hours" />
                }
                if (s === "submittedexceed") {
                  return <div className="size-2.5 rounded-full bg-[#EF4444]" title="More Hours" />
                }
                if (s === "submittedless") {
                  return <div className="size-2.5 rounded-full bg-[#EAB308]" title="Less Hours" />
                }
                return null
              }}
              renderAction={(_weekIndex, dates, status) => {
                const s = String(status).toLowerCase()
                const isApproved = s === "approved"
                const isSubmitted = s === "submitted" || s === "submittedexceed" || s === "submittedless"
                
                return (
                  <div className="flex items-center gap-1.5">
                    {isApproved || isSubmitted ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-white shrink-0 border border-gray-100 shadow-sm">
                        <Unlock className="size-3.5 text-gray-500" aria-hidden />
                      </span>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={() => {
                              if (!selectedUserId) return
                              const startDate = dates[0].toISOString().split('T')[0]
                              const endDate = dates[dates.length - 1].toISOString().split('T')[0]
                              notifyUser({ userId: selectedUserId, startDate, endDate, status: "notify" })
                            }}
                            className="relative inline-flex size-5 items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <Bell className="size-4" style={{ fill: "#6c5dd3", stroke: "#6c5dd3" }} aria-hidden />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Notify
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {!isSubmitted && !isApproved ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-[#6c5dd3] hover:opacity-80 shrink-0 transition-opacity">
                            <Info className="size-4" strokeWidth={1.5} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
                          Time Sheet was not submitted by user do you want to notify them? press notify icon
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <button className="text-[#6c5dd3] hover:opacity-80 shrink-0 transition-opacity">
                        <Info className="size-4" strokeWidth={1.5} />
                      </button>
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

        {/* Bottom minutes summary bar */}
        <div className="flex justify-end items-center gap-6 rounded-[6px] border border-gray-100 bg-white px-6 py-5 text-sm shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
          <span className="text-gray-600">
            Allocated TS Minutes: <span className="font-semibold text-gray-800">{allocatedTotal}</span>
          </span>
          <span className="text-gray-600">
            Actual Minutes: <span className="font-semibold text-gray-800">{actualTotal}</span>
          </span>
          <span className="text-gray-600">
            Balance: <span className="font-semibold text-gray-800">{balanceTotal}</span>
          </span>
        </div>

      </div>
    </TooltipProvider>
  )
}
