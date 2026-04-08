import { useMemo, useState } from "react"

import { PersonalTimeStudyCalendarCard } from "../components/PersonalTimeStudyCalendarCard"
import { PersonalTimeStudyEntryForm } from "../components/PersonalTimeStudyEntryForm"
import { PersonalTimeStudyLeaveCard } from "../components/PersonalTimeStudyLeaveCard"
import { PersonalTimeStudyLegendCard } from "../components/PersonalTimeStudyLegendCard"
import { PersonalTimeStudyMinutesCard } from "../components/PersonalTimeStudyMinutesCard"
import { PersonalTimeStudyNotesSection } from "../components/PersonalTimeStudyNotesSection"
import type { WeekSummaryRow } from "../components/PersonalTimeStudyWeekSummary"

/** Placeholder week rows — replace with data derived from the calendar month when wiring APIs. */
function usePlaceholderWeekRows(): WeekSummaryRow[] {
  return useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `w-${i + 1}`,
        totalMin: 0,
        status: "less" as const,
      })),
    []
  )
}

export function PersonalTimeStudyPage() {
  const weekRows = usePlaceholderWeekRows()
  const [notes, setNotes] = useState("")

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      {/* Left ~40%: calendar only. Right ~60%: 3 summary cards, then Notes (same width as cards). */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4 xl:gap-6">
        <div className="flex min-h-0 min-w-0 shrink-0 lg:h-full lg:w-[40%] lg:max-w-[40%]">
          <PersonalTimeStudyCalendarCard
            weekRows={weekRows}
            className="h-full min-h-0 w-full min-w-0"
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
          <div className="grid min-h-0 w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PersonalTimeStudyLegendCard className="min-h-0" />
            <PersonalTimeStudyLeaveCard
              className="min-h-0"
              leaveCount={0}
              approved={0}
              open={0}
              rejected={0}
            />
            <PersonalTimeStudyMinutesCard
              className="min-h-0 sm:col-span-2 lg:col-span-1"
              allocatedMinutes={480}
              actualMinutes={0}
              balanceMinutes={0}
            />
          </div>

          <PersonalTimeStudyNotesSection
            value={notes}
            onChange={setNotes}
            onSave={() => {
              /* persist notes — wire API later */
            }}
            className="min-h-0 flex-1"
          />
        </div>
      </div>

      <PersonalTimeStudyEntryForm
        onSave={() => {
          /* save draft — wire API later */
        }}
        onSubmit={() => {
          /* submit period — wire API later */
        }}
      />
    </div>
  )
}
