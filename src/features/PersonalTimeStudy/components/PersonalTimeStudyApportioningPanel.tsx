import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import type { UserAssignedDepartmentsSettingChecks } from "../queries/getUserAssignedDepartmentsSettingChecks"
import { AlertCircle } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { buildDecimalMinMessage, DecimalActivityTimeHint } from "../utils/decimalTimeHint"

// ── Types ──────────────────────────────────────────────────────────────────

export type ApportioningPanelProps = {
  apportioningConfig: UserAssignedDepartmentsSettingChecks | null | undefined
  supervisorOwnMinutesToday: number
  /** Saved apportioning TSRs from backend (apportioning=true). Pre-fills rows when autoApportioning=true. */
  apportioningRecords?: any[]
  /** Whether auto-apportioning is enabled — comes from the config API (checkSettings.autoApportioning). */
  autoApportioning?: boolean
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
        checked ? "bg-[#6C5DD3]" : "bg-gray-300 dark:bg-zinc-700",
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

/** Computed remaining-time display — read-only, colour-coded. Icon slot on the right. */
function RemainingTimeDisplay({ minutes, children }: { minutes: number; children?: React.ReactNode }) {
  const isOver = minutes < 0
  return (
    <div
      aria-readonly="true"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-[6px] border bg-[#F2F4F7] px-3 text-[11px] font-semibold cursor-not-allowed select-none dark:bg-[#18181b] dark:border-[#27272a] dark:text-[#f4f4f5]",
        isOver ? "border-red-300 text-red-600 dark:border-red-900/50 dark:text-red-400" : "border-input text-[#344054]",
      )}
    >
      <span>{minutes}</span>
      {children}
    </div>
  )
}

/** Read-only text field shown in place of a dropdown when the row is backend-owned. */
function ReadOnlyField({ label }: { label: string }) {
  return (
    <div
      aria-readonly="true"
      title="Set automatically by the system — cannot be changed"
      className="flex h-10 w-full items-center rounded-[6px] border border-input bg-[#F2F4F7] px-3 text-[11px] text-[#344054] cursor-not-allowed select-none truncate dark:bg-[#18181b] dark:border-[#27272a] dark:text-[#f4f4f5]"
    >
      {label || <span className="text-muted-foreground italic">Not Assigned</span>}
    </div>
  )
}

export function PersonalTimeStudyApportioningPanel({
  apportioningConfig,
  supervisorOwnMinutesToday,
  apportioningRecords,
  autoApportioning,
}: ApportioningPanelProps) {
  const shouldRender = useMemo(
    () => (apportioningRecords || []).length > 0,
    [apportioningRecords],
  )

  // ── Build flat program / activity lists from apportioningRecords ──────────────────
  const allPrograms = useMemo(() => {
    const list = (apportioningRecords || []).map((r) => ({
      id: String(r.programid),
      code: r.programcode,
      name: r.programname,
      departmentCode: r.departmentcode,
    }))
    return Array.from(new Map(list.map((p: any) => [p.id, p])).values()) as any[]
  }, [apportioningRecords])

  const allActivities = useMemo(() => {
    const list = (apportioningRecords || []).map((r) => ({
      id: String(r.activityid),
      code: r.activitycode,
      name: r.activityname,
      departmentCode: r.departmentcode,
    }))
    return Array.from(new Map(list.map((a: any) => [a.id, a])).values()) as any[]
  }, [apportioningRecords])

  // ── Build the flat list of display rows ───────────────────────────────────
  const displayRows = useMemo(() => {
    const rows: Array<{
      rowKey: string
      deptId: number
      deptName: string
      deptCode: string
      autoApportioning: boolean
      apportioningPercent: number
      allowedMinutes: number
      backendRecord?: any
    }> = []

    for (const rec of (apportioningRecords || [])) {
      const dept = apportioningConfig?.departments?.find(
        (d) => Number(d.departmentId) === Number(rec.departmentId)
      )
      rows.push({
        rowKey: `rec_${rec.id}`,
        deptId: Number(rec.departmentId),
        deptName: rec.departmentname || rec.departmentName || dept?.departmentName || dept?.departmentname || `Dept ${rec.departmentId}`,
        deptCode: rec.departmentcode ?? "",
        autoApportioning: rec.apportioningType
          ? rec.apportioningType === "AUTO"
          : (dept ? (autoApportioning ?? dept.autoApportioning) : true),
        apportioningPercent: dept?.apportioningPercent ?? 0,
        allowedMinutes: dept?.allowedMinutes ?? 0,
        backendRecord: rec,
      })
    }

    return rows
  }, [apportioningConfig, apportioningRecords, autoApportioning])

  // ── Row selection state (UI-only) ─────────────────────────────────────────
  const [rowStates, setRowStates] = useState<Record<string, ApportioningRowState>>({})

  // Pre-fill from backend records whenever rows change
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
    <div className="mt-4 rounded-[8px] border border-[#6C5DD3]/20 bg-[#F8F7FF] p-4 dark:bg-[#12111a] dark:border-[#6C5DD3]/30">
      {/* Panel title */}
      <h4 className="mb-3 text-[13px] font-semibold text-[#6C5DD3]">Apportioning</h4>

      {/* Column headers */}
      <div className="mb-1 grid grid-cols-[110px_150px_1fr_1fr_160px] items-end gap-2">
        <span className="text-[11px] font-medium text-muted-foreground"></span>
        <span className="text-[11px] font-medium text-muted-foreground">Auto Apportioning</span>
        <span className="text-[11px] font-medium text-[#6C5DD3]">
          Time Study Program <span className="text-destructive">*</span>
        </span>
        <span className="text-[11px] font-medium text-[#6C5DD3]">
          Service/Activity <span className="text-destructive">*</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">Apportioned Time(Min.)</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {displayRows.map((row) => {
          const rowState = rowStates[row.rowKey] ?? { selectedProgram: "", selectedActivity: "" }
          const rec = row.backendRecord

          // Program options
          const programOptions = allPrograms
            .filter((p: any) => !p.isMultiCode)
            .map((p: any) => {
              const deptPrefix = (p.departmentCode ?? "").split("-")[0]
              return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
            })

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

          // Activity options
          const activityOptions = rowState.selectedProgram
            ? allActivities.map((a: any) => ({
                value: String(a.id),
                label: `${a.code} - ${a.name}`,
              }))
            : []

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

          // Remaining minutes: from backend record for auto, split for manual
          const remainingMinutes = rec
            ? Number(rec.activitytime) || 0
            : row.autoApportioning
              ? 0
              : Math.round((supervisorOwnMinutesToday * row.apportioningPercent) / 100)

          const rowDept = apportioningConfig?.departments?.find(
            (d) => Number(d.departmentId) === row.deptId,
          )
          const showDecimalHint =
            !!rec?.message || rowDept?.requiresStartEndTime === false
          const decimalHintMessage = showDecimalHint
            ? rec?.message ?? buildDecimalMinMessage(remainingMinutes)
            : null

          return (
            <div
              key={row.rowKey}
              className="grid grid-cols-[110px_150px_1fr_1fr_160px] items-end gap-2"
            >
              {/* Department name */}
              <span className="text-[12px] font-bold text-[#111827] leading-snug pb-3 dark:text-[#f4f4f5]">
                {row.deptName}
              </span>

              {/* Auto Apportioning toggle — READ-ONLY, driven by config API */}
              <div className="flex h-10 items-center">
                <ReadOnlyAutoToggle checked={row.autoApportioning} />
              </div>

              {/* Program — read-only when auto-apportioning or record exists */}
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
                  placeholder="Not Assigned"
                  options={programOptions}
                  onChange={(v) => handleProgramChange(row.rowKey, v)}
                  onBlur={() => {}}
                  className="h-10 text-[11px]"
                />
              )}

              {/* Service / Activity — read-only when auto-apportioning or record exists */}
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
                  placeholder="Not Assigned"
                  disabled={!rowState.selectedProgram}
                  options={activityOptions}
                  onChange={(v) => handleActivityChange(row.rowKey, v)}
                  onBlur={() => {}}
                  className={cn(
                    "h-10 text-[11px]",
                    !rowState.selectedProgram && "bg-[#F2F4F7] cursor-not-allowed",
                  )}
                />
              )}

              {/* Remaining Time (Min.) — read-only, icon inside box on the right */}
              <div className="pb-0.5">
                <RemainingTimeDisplay minutes={remainingMinutes}>
                  <div className="flex items-center gap-1 shrink-0">
                    {decimalHintMessage ? (
                      <DecimalActivityTimeHint message={decimalHintMessage} />
                    ) : null}
                    <HoverCard openDelay={0} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors flex items-center shrink-0">
                          <AlertCircle className="size-3.5" />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-fit max-w-xs p-3 z-[100] bg-white border border-gray-100 shadow-xl rounded-[8px] text-[#111827] dark:bg-[#18181b] dark:border-[#27272a] dark:text-[#f4f4f5]" align="end" side="top">
                        <div className="text-[12px] font-medium leading-relaxed">
                          {rec?.apportioningDesc || "No description available"}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </RemainingTimeDisplay>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
