import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import type { SupervisorApportioningConfig } from "../queries/getUserApportioningConfig"

// ── Types ──────────────────────────────────────────────────────────────────

export type ApportioningPanelProps = {
  apportioningConfig: SupervisorApportioningConfig | null | undefined
  supervisorOwnMinutesToday: number
  /** Saved apportioning TSRs from backend (apportioning=true). Pre-fills rows when autoApportioning=true. */
  apportioningRecords?: any[]
}

/** Row state keyed by a unique string — `rec_${record.id}` for auto rows, `dept_${deptId}` for manual rows. */
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

/** Read-only text field shown in place of a dropdown when the row is backend-owned. */
function ReadOnlyField({ label }: { label: string }) {
  return (
    <div
      aria-readonly="true"
      title="Set automatically by the system — cannot be changed"
      className="flex h-10 w-full items-center rounded-[6px] border border-input bg-[#F2F4F7] px-3 text-[11px] text-[#344054] cursor-not-allowed select-none truncate"
    >
      {label || <span className="text-muted-foreground italic">Not Assigned</span>}
    </div>
  )
}

export function PersonalTimeStudyApportioningPanel({
  apportioningConfig,
  supervisorOwnMinutesToday,
  apportioningRecords,
}: ApportioningPanelProps) {
  const shouldRender = useMemo(
    () =>
      !!apportioningConfig &&
      apportioningConfig.apportioningRequired &&
      apportioningConfig.departments.length > 0,
    [apportioningConfig],
  )

  // ── Build flat program / activity lists from dropdownData ──────────────────
  const allPrograms = useMemo(() => {
    // Apportioning dropdowns should ONLY show programs from the actual reportee/supervising data (apportioningRecords)
    const list = (apportioningRecords || []).map((r) => ({
      id: String(r.programid),
      programCode: r.programcode,
      programName: r.programname,
      departmentCode: r.departmentcode,
    }))
    return Array.from(new Map(list.map((p: any) => [p.id, p])).values()) as any[]
  }, [apportioningRecords])

  const allActivities = useMemo(() => {
    // Apportioning dropdowns should ONLY show activities from the actual reportee/supervising data (apportioningRecords)
    const list = (apportioningRecords || []).map((r) => ({
      id: String(r.activityid),
      activityCode: r.activitycode,
      activityName: r.activityname,
      departmentCode: r.departmentcode,
    }))
    return Array.from(new Map(list.map((a: any) => [a.id, a])).values()) as any[]
  }, [apportioningRecords])

  // ── Build the flat list of display rows ───────────────────────────────────
  /**
   * For autoApportioning depts: one row PER backend record (may be > 1 per dept).
   * For manual depts:           one row per dept.
   */
  const displayRows = useMemo(() => {
    if (!apportioningConfig) return []
    const rows: Array<{
      rowKey: string
      deptId: number
      deptName: string
      deptCode: string
      autoApportioning: boolean
      apportioningPercent: number
      allowedMinutes: number
      /** For autoApportioning rows, the backend record driving this row */
      backendRecord?: any
    }> = []

    // 1. First, process all departments from the active config
    const processedDeptIds = new Set<number>()

    for (const dept of apportioningConfig.departments) {
      processedDeptIds.add(dept.departmentId)

      const deptRecords = (apportioningRecords || []).filter(
        (r) => Number(r.departmentId) === dept.departmentId,
      )

      if (dept.autoApportioning && deptRecords.length > 0) {
        deptRecords.forEach((rec) => {
          rows.push({
            rowKey: `rec_${rec.id}`,
            deptId: dept.departmentId,
            deptName: dept.departmentName,
            deptCode: rec.departmentcode ?? "",
            autoApportioning: true,
            apportioningPercent: dept.apportioningPercent,
            allowedMinutes: dept.allowedMinutes,
            backendRecord: rec,
          })
        })
      } else {
        // Manual or no backend records yet for this config-dept
        rows.push({
          rowKey: `dept_${dept.departmentId}`,
          deptId: dept.departmentId,
          deptName: dept.departmentName,
          deptCode: "",
          autoApportioning: dept.autoApportioning,
          apportioningPercent: dept.apportioningPercent,
          allowedMinutes: dept.allowedMinutes,
        })
      }
    }

    // 2. Add any records for departments NOT in the config (fallback)
    const extraRecords = (apportioningRecords || []).filter(
      (r) => !processedDeptIds.has(Number(r.departmentId))
    )

    extraRecords.forEach((rec) => {
      rows.push({
        rowKey: `rec_${rec.id}`,
        deptId: Number(rec.departmentId),
        deptName: rec.departmentname || `Dept ${rec.departmentId}`,
        deptCode: rec.departmentcode ?? "",
        autoApportioning: true, // If it's a saved record, treat as auto-apportioned/read-only
        apportioningPercent: 0,
        allowedMinutes: 0,
        backendRecord: rec,
      })
    })

    return rows
  }, [apportioningConfig, apportioningRecords])

  // ── Row selection state (UI-only) ─────────────────────────────────────────
  const [rowStates, setRowStates] = useState<Record<string, ApportioningRowState>>({})

  // Pre-fill from backend records whenever records or dropdown data change
  useMemo(() => {
    setRowStates(() => {
      const next: Record<string, ApportioningRowState> = {}
      for (const row of displayRows) {
        if (row.backendRecord) {
          const rec = row.backendRecord
          next[row.rowKey] = {
            selectedProgram: rec.programid ? String(rec.programid) : "",
            selectedActivity: rec.activityid ? String(rec.activityid) : "",
          }
        } else {
          next[row.rowKey] = { selectedProgram: "", selectedActivity: "" }
        }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRows])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProgramChange = (rowKey: string, value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [rowKey]: { selectedProgram: value, selectedActivity: "" },
    }))
  }

  const handleActivityChange = (rowKey: string, value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [rowKey]: { ...prev[rowKey], selectedActivity: value },
    }))
  }

  if (!shouldRender) return null

  return (
    <div className="mt-4 rounded-[8px] border border-[#6C5DD3]/20 bg-[#F8F7FF] p-4">
      {/* Panel title */}
      <h4 className="mb-3 text-[13px] font-semibold text-[#6C5DD3]">Apportioning</h4>

      {/* Column headers */}
      <div className="mb-1 grid grid-cols-[110px_150px_1fr_1fr_110px] items-end gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Department</span>
        <span className="text-[11px] font-medium text-muted-foreground">Auto Apportioning</span>
        <span className="text-[11px] font-medium text-[#6C5DD3]">
          Program <span className="text-destructive">*</span>
        </span>
        <span className="text-[11px] font-medium text-[#6C5DD3]">
          Service / Activity <span className="text-destructive">*</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">Remaining Time (Min.)</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {displayRows.map((row) => {
          const rowState = rowStates[row.rowKey] ?? { selectedProgram: "", selectedActivity: "" }
          const rec = row.backendRecord

          // Program options — non-multicode, formatted as dept-code - name
          const programOptions = allPrograms
            .filter((p: any) => !p.isMultiCode)
            .map((p: any) => {
              const deptPrefix = (p.departmentCode ?? "").split("-")[0]
              return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
            })

          // If current value not in list (e.g. loaded from record), inject fallback option
          if (
            rowState.selectedProgram &&
            !programOptions.some((o) => o.value === rowState.selectedProgram)
          ) {
            if (rec?.programcode || rec?.programname) {
              const deptPrefix = (row.deptCode ?? "").split("-")[0]
              programOptions.unshift({
                value: rowState.selectedProgram,
                label: `${deptPrefix}-${rec.programcode ?? ""} - ${rec.programname ?? ""}`,
              })
            }
          }

          // Activity options — filtered to selected program
          const activityOptions = rowState.selectedProgram
            ? allActivities.map((a: any) => ({
              value: String(a.id),
              label: `${a.code} - ${a.name}`,
            }))
            : []

          // Inject fallback for activity too
          if (
            rowState.selectedActivity &&
            !activityOptions.some((o) => o.value === rowState.selectedActivity)
          ) {
            if (rec?.activitycode || rec?.activityname) {
              activityOptions.unshift({
                value: rowState.selectedActivity,
                label: `${rec.activitycode ?? ""} - ${rec.activityname ?? ""}`,
              })
            }
          }

          // Remaining minutes: strictly from backend record for auto-apportioning.
          // Only show calculated split for MANUAL rows that don't have a record yet.
          const remainingMinutes = rec
            ? Number(rec.activitytime) || 0
            : row.autoApportioning
              ? 0
              : Math.round((supervisorOwnMinutesToday * row.apportioningPercent) / 100)

          return (
            <div
              key={row.rowKey}
              className="grid grid-cols-[110px_150px_1fr_1fr_110px] items-end gap-2"
            >
              {/* Department name */}
              <span className="text-[12px] font-medium text-[#344054] leading-snug pb-2">
                {row.deptName}
              </span>

              {/* Auto Apportioning toggle — READ-ONLY */}
              <div className="flex h-10 items-center">
                <ReadOnlyAutoToggle checked={row.autoApportioning} />
              </div>

              {/* Program — read-only when auto-apportioning is ON or a record exists */}
              {rec || row.autoApportioning ? (
                <ReadOnlyField
                  label={
                    rec && (rec.programcode || rec.programname)
                      ? `${(row.deptCode ?? "").split("-")[0]}-${rec.programcode ?? ""} - ${rec.programname ?? ""}`
                      : "No Data"
                  }
                />
              ) : (
                <SingleSelectSearchDropdown
                  value={rowState.selectedProgram}
                  placeholder="Not Assign"
                  options={programOptions}
                  onChange={(v) => handleProgramChange(row.rowKey, v)}
                  onBlur={() => { }}
                  className="h-10 text-[11px]"
                />
              )}

              {/* Service / Activity — read-only when auto-apportioning is ON or a record exists */}
              {rec || row.autoApportioning ? (
                <ReadOnlyField
                  label={
                    rec && (rec.activitycode || rec.activityname)
                      ? `${rec.activitycode ?? ""} - ${rec.activityname ?? ""}`
                      : "No Data"
                  }
                />
              ) : (
                <SingleSelectSearchDropdown
                  value={rowState.selectedActivity}
                  placeholder="Not Assign"
                  disabled={!rowState.selectedProgram}
                  options={activityOptions}
                  onChange={(v) => handleActivityChange(row.rowKey, v)}
                  onBlur={() => { }}
                  className={cn(
                    "h-10 text-[11px]",
                    !rowState.selectedProgram && "bg-[#F2F4F7] cursor-not-allowed",
                  )}
                />
              )}

              {/* Remaining Time (Min.) — read-only */}
              <RemainingTimeDisplay minutes={remainingMinutes} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
