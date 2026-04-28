import { useTimeStudyMGT } from "../hooks/useTimeStudyMGT"
import { MgtEmployeePanel } from "../components/MgtEmployeePanel"
import { MgtCalendarCard } from "../components/MgtCalendarCard"
import { MgtLegendCard } from "../components/MgtLegendCard"

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
      <div className="flex gap-4 items-start">

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
          {selectedUserId ? (
            <MgtCalendarCard
              currentDate={currentDate}
              onMonthChange={setCurrentDate}
              dayStatuses={dayStatuses}
            />
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-400">
              Select an employee to view their calendar
            </div>
          )}
        </div>

        {/* Right: Legend */}
        <div className="w-[180px] shrink-0">
          <MgtLegendCard />
        </div>

      </div>

      {/* Bottom minutes summary bar */}
      <div className="flex justify-end gap-6 rounded-xl border border-gray-100 bg-white px-6 py-3 text-sm shadow-sm">
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
