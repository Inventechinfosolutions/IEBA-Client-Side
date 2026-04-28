import { useTimeStudyMGT } from "../hooks/useTimeStudyMGT"
import { MgtEmployeePanel } from "../components/MgtEmployeePanel"
import { MgtLegendCard } from "../components/MgtLegendCard"
import { PersonalTimeStudyCalendarCard } from "../../components/PersonalTimeStudyCalendarCard"
import { Check, X, Unlock, Bell, Info } from "lucide-react"

export function TimeStudyMGTPage() {
  const {
    search, setSearch,
    selectedUserId,
    currentDate, setCurrentDate,
    filteredEmployees,
    dayStatuses,
    isEmployeeListLoading,
    selectEmployee,
  } = useTimeStudyMGT()

  return (
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
            showActionColumn={true}
            renderStatus={(_weekIndex, _dates, status) => {
              const isApproved = status === "approved_time_entry" || status === "approved" || status === "notsubmitted" // Just to show the green check for now, can be updated later based on actual status
              // According to the image, the first row and last row have green check, the middle have red cross.
              // I will use isApproved to determine.
              return isApproved ? (
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] shrink-0">
                  <Check className="size-2.5 text-white" aria-hidden />
                </span>
              ) : (
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] shrink-0">
                  <X className="size-2.5 text-white" aria-hidden />
                </span>
              )
            }}
            renderAction={(_weekIndex, _dates, status) => {
              const isApproved = status === "approved_time_entry" || status === "approved" || status === "notsubmitted"
              return (
                <div className="flex items-center gap-1.5">
                  {isApproved ? (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-white shrink-0">
                      <Unlock className="size-4 text-gray-500" aria-hidden />
                    </span>
                  ) : (
                    <span className="relative inline-flex size-5 items-center justify-center shrink-0">
                      <Bell className="size-4" style={{ fill: "#6c5dd3", stroke: "#6c5dd3" }} aria-hidden />
                    </span>
                  )}
                  <button className="text-[#6c5dd3] hover:opacity-80 shrink-0 transition-opacity">
                    <Info className="size-4" strokeWidth={1.5} />
                  </button>
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
          Allocated TS Minutes: <span className="font-semibold text-gray-800">0</span>
        </span>
        <span className="text-gray-600">
          Actual Minutes: <span className="font-semibold text-gray-800">0</span>
        </span>
        <span className="text-gray-600">
          Balance: <span className="font-semibold text-gray-800">0</span>
        </span>
      </div>

    </div>
  )
}
