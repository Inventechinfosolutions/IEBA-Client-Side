import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import type { SupervisorApportioningConfig } from "../queries/getUserApportioningConfig"

// ── Types ──────────────────────────────────────────────────────────────────

export type ApportioningPanelProps = {
  apportioningConfig: SupervisorApportioningConfig | null | undefined
  supervisorOwnMinutesToday: number
  dropdownData?: any[]
}
type ApportioningRowState = {
  selectedProgram: string
  selectedActivity: string
}

function ReadOnlyAutoToggle({ checked }: { checked: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-label="Auto Apportioning (read-only, set by department settings)"
      title="Controlled by department settings — cannot be changed here"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full border-2 border-transparent",
        checked ? "bg-[#6C5DD3]" : "bg-gray-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </span>
  )
}

/** Computed remaining-time display — read-only, colour-coded. */
function RemainingTimeDisplay({ minutes }: { minutes: number }) {
  const isOver = minutes < 0
  return (
    <div
      aria-readonly="true"
      className={cn(
        "flex h-10 w-full items-center rounded-[6px] border bg-[#F2F4F7] px-3 text-[11px] font-semibold cursor-not-allowed select-none",
        isOver ? "border-red-300 text-red-600" : "border-input text-[#344054]",
      )}
    >
      {minutes}
    </div>
  )
}
export function PersonalTimeStudyApportioningPanel({
  apportioningConfig,
  supervisorOwnMinutesToday,
  dropdownData,
}: ApportioningPanelProps) {
  // Guard: only render for supervisors with active apportioning departments
  const shouldRender = useMemo(
    () =>
      !!apportioningConfig &&
      apportioningConfig.apportioningRequired &&
      apportioningConfig.departments.length > 0,
    [apportioningConfig],
  )

  // Per-department row selection state (program + activity per dept)
  const [rowStates, setRowStates] = useState<Record<number, ApportioningRowState>>(() =>
    Object.fromEntries(
      (apportioningConfig?.departments ?? []).map((d) => [
        d.departmentId,
        { selectedProgram: "", selectedActivity: "" },
      ]),
    ),
  )

  // Compute remaining minutes per department
  const departmentRows = useMemo(() => {
    if (!apportioningConfig) return []
    return apportioningConfig.departments.map((dept) => {
      // Split the supervisor's total worked time proportionally based on this department's percentage
      const consumedMinutes = Math.round((supervisorOwnMinutesToday * dept.apportioningPercent) / 100)
      return {
        ...dept,
        remainingMinutes: dept.allowedMinutes - consumedMinutes,
      }
    })
  }, [apportioningConfig, supervisorOwnMinutesToday])

  // Build flat program list (all programs from dropdownData, deduplicated by id)
  const allPrograms = useMemo(() => {
    const list =
      dropdownData?.flatMap((d: any) =>
        (d.programs ?? []).map((p: any) => ({ ...p, departmentCode: d.departmentCode })),
      ) ?? []
    return Array.from(new Map(list.map((p: any) => [p.id, p])).values()) as any[]
  }, [dropdownData])

  // Build flat activity list (all activities, deduplicated by id)
  const allActivities = useMemo(() => {
    const list =
      dropdownData?.flatMap((d: any) =>
        (d.activities ?? []).map((a: any) => ({ ...a, departmentCode: d.departmentCode })),
      ) ?? []
    return Array.from(new Map(list.map((a: any) => [a.id, a])).values()) as any[]
  }, [dropdownData])

  // Handlers for row-level changes
  const handleProgramChange = (deptId: number, value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [deptId]: { selectedProgram: value, selectedActivity: "" }, // reset activity on program change
    }))
  }

  const handleActivityChange = (deptId: number, value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [deptId]: { ...prev[deptId], selectedActivity: value },
    }))
  }

  if (!shouldRender) return null

  return (
    <div className="mt-4 rounded-[8px] border border-[#6C5DD3]/20 bg-[#F8F7FF] p-4">
      {/* Panel title */}
      <h4 className="mb-3 text-[13px] font-semibold text-[#6C5DD3]">Apportioning</h4>

      {/* Column headers */}
      <div className="mb-0 grid grid-cols-[110px_150px_1fr_1fr_110px] items-end gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Department</span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Auto Apportioning<span className="text-destructive"></span>
        </span>
        <span className="text-[11px] font-medium text-[#6C5DD3]">
          Program <span className="text-destructive">*</span>
        </span>
        <span className="text-[11px] font-medium text-[#6C5DD3]">
          Service / Activity <span className="text-destructive">*</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">Remaining Time (Min.)</span>
      </div>

      {/* Department rows */}
      <div className="flex flex-col gap-3">
        {departmentRows.map((dept) => {
          const rowState = rowStates[dept.departmentId] ?? {
            selectedProgram: "",
            selectedActivity: "",
          }

          // Programs available for this row (non-multicode)
          const programOptions = allPrograms
            .filter((p: any) => !p.isMultiCode)
            .map((p: any) => {
              const deptPrefix = (p.departmentCode ?? "").split("-")[0]
              return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
            })

          // Activities available for the selected program in this row
          const activityOptions = rowState.selectedProgram
            ? allActivities.map((a: any) => ({
                value: String(a.id),
                label: `${a.code} - ${a.name}`,
              }))
            : []

          return (
            <div
              key={dept.departmentId}
              className="grid grid-cols-[110px_150px_1fr_1fr_110px] items-end gap-2"
            >
              {/* Department name */}
              <span className="text-[12px] font-medium text-[#344054] leading-snug pb-2">
                {dept.departmentName}
              </span>

              {/* Auto Apportioning toggle — READ-ONLY (locked from dept settings) */}
              <div className="flex h-10 items-center">
                <ReadOnlyAutoToggle checked={dept.autoApportioning} />
              </div>

              {/* Program — interactive dropdown */}
              <SingleSelectSearchDropdown
                value={rowState.selectedProgram}
                placeholder="Not Assign"
                options={programOptions}
                onChange={(v) => handleProgramChange(dept.departmentId, v)}
                onBlur={() => {}}
                className="h-10 text-[11px]"
              />

              {/* Service / Activity — interactive dropdown */}
              <SingleSelectSearchDropdown
                value={rowState.selectedActivity}
                placeholder="Not Assign"
                disabled={!rowState.selectedProgram}
                options={activityOptions}
                onChange={(v) => handleActivityChange(dept.departmentId, v)}
                onBlur={() => {}}
                className={cn(
                  "h-10 text-[11px]",
                  !rowState.selectedProgram && "bg-[#F2F4F7] cursor-not-allowed",
                )}
              />

              {/* Remaining Time (Min.) — read-only computed */}
              <div className="flex flex-col gap-1">
                <RemainingTimeDisplay minutes={dept.remainingMinutes} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
