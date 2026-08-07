import { useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { useDepartmentReportSettings } from "../hooks/useDepartmentReportSettings"
import { coerceReportVisibilityFlag } from "../lib/departmentReport.utils"
import type { DepartmentReportOption, DepartmentReportSettingsPanelProps } from "../types"
import { DepartmentEditContextHeader } from "./DepartmentEditContextHeader"
import { TransferPanel } from "./TransferPanel"

const labelClassName = "mb-2 block text-[13px] font-[500] text-[#374151]"

type AudienceFlagsMap = Record<string, { visibleToAdmin: boolean; visibleToUser: boolean }>

function buildAudienceFlagsFromOptions(options: DepartmentReportOption[]): AudienceFlagsMap {
  const map: AudienceFlagsMap = {}
  for (const opt of options) {
    map[String(opt.id)] = {
      visibleToAdmin: coerceReportVisibilityFlag(opt.visibleToAdmin, true),
      visibleToUser: coerceReportVisibilityFlag(opt.visibleToUser, true),
    }
  }
  return map
}

type DepartmentReportMultiSelectFieldProps = {
  reportOptions: DepartmentReportOption[]
  serverMappedReportIds: string
  isLoading: boolean
  onSelectedReportIdsChange: (reportIdsCsv: string) => void
  /** Called during render so parent Save can persist current draft. */
  bindSave: (saveFn: () => Promise<void>) => void
  onSave: (
    reportIds: number[],
    visibilityById: AudienceFlagsMap,
  ) => Promise<void>
}

function DepartmentReportMultiSelectField({
  reportOptions,
  serverMappedReportIds,
  isLoading,
  onSelectedReportIdsChange,
  bindSave,
  onSave,
}: DepartmentReportMultiSelectFieldProps) {
  const [userReportIds, setUserReportIds] = useState<string | null>(null)
  const [searchAvailable, setSearchAvailable] = useState("")
  const [searchSelected, setSearchSelected] = useState("")
  const [toggledAvailable, setToggledAvailable] = useState<string[]>([])
  const [toggledSelected, setToggledSelected] = useState<string[]>([])
  /** Local A/U edits only — server flags come from TanStack query `reportOptions`. */
  const [audienceOverrides, setAudienceOverrides] = useState<AudienceFlagsMap>({})

  const audienceFlags = useMemo(() => {
    return {
      ...buildAudienceFlagsFromOptions(reportOptions),
      ...audienceOverrides,
    }
  }, [reportOptions, audienceOverrides])

  const selectedIds = useMemo(() => {
    const raw = userReportIds ?? serverMappedReportIds
    return [
      ...new Set(
        raw
          .split(/[,;\n]+/g)
          .map((p) => p.trim())
          .filter(Boolean),
      ),
    ]
  }, [userReportIds, serverMappedReportIds])

  const { availableReports, selectedReports } = useMemo(() => {
    const selected = reportOptions.filter((opt) => selectedIds.includes(String(opt.id)))
    const available = reportOptions.filter((opt) => !selectedIds.includes(String(opt.id)))
    return { availableReports: available, selectedReports: selected }
  }, [reportOptions, selectedIds])

  const filteredAvailable = useMemo(() => {
    if (!searchAvailable.trim()) return availableReports
    const query = searchAvailable.toLowerCase()
    return availableReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query),
    )
  }, [availableReports, searchAvailable])

  const filteredSelected = useMemo(() => {
    if (!searchSelected.trim()) return selectedReports
    const query = searchSelected.toLowerCase()
    return selectedReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query),
    )
  }, [selectedReports, searchSelected])

  const handleToggleAvailable = (id: string) => {
    setToggledAvailable((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleToggleSelected = (id: string) => {
    setToggledSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSelectAllAvailable = (checked: boolean) => {
    if (checked) {
      setToggledAvailable(filteredAvailable.map((r) => String(r.id)))
    } else {
      setToggledAvailable([])
    }
  }

  const handleSelectAllSelected = (checked: boolean) => {
    if (checked) {
      setToggledSelected(filteredSelected.map((r) => String(r.id)))
    } else {
      setToggledSelected([])
    }
  }

  const applyLocalSelection = (nextIds: string[]) => {
    const csv = nextIds.join(", ")
    setUserReportIds(csv)
    onSelectedReportIdsChange(csv)
  }

  const handleMoveForward = () => {
    if (toggledAvailable.length === 0) return
    const addedOverrides: AudienceFlagsMap = {}
    for (const id of toggledAvailable) {
      addedOverrides[id] = { visibleToAdmin: true, visibleToUser: true }
    }
    setAudienceOverrides((prev) => ({ ...prev, ...addedOverrides }))
    const nextIds = [...new Set([...selectedIds, ...toggledAvailable])]
    setToggledAvailable([])
    applyLocalSelection(nextIds)
  }

  const handleMoveBack = () => {
    if (toggledSelected.length === 0) return
    setAudienceOverrides((prev) => {
      const next = { ...prev }
      for (const id of toggledSelected) {
        delete next[id]
      }
      return next
    })
    const nextIds = selectedIds.filter((id) => !toggledSelected.includes(id))
    setToggledSelected([])
    applyLocalSelection(nextIds)
  }

  const handleAudienceFlagChange = (
    reportId: string,
    flag: "visibleToAdmin" | "visibleToUser",
    value: boolean,
  ) => {
    const current = audienceFlags[reportId] ?? {
      visibleToAdmin: true,
      visibleToUser: true,
    }
    setAudienceOverrides((prev) => ({
      ...prev,
      [reportId]: {
        ...current,
        [flag]: value,
      },
    }))
  }

  // Bind Save to current draft (assignment + A/U) — no useEffect.
  bindSave(async () => {
    const reportIds = selectedIds
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
    const visibilityById: AudienceFlagsMap = {}
    for (const id of selectedIds) {
      visibilityById[id] = audienceFlags[id] ?? {
        visibleToAdmin: true,
        visibleToUser: true,
      }
    }
    await onSave(reportIds, visibilityById)
    // Drop local overrides so refetch from server is the source of truth.
    setAudienceOverrides({})
  })

  if (isLoading) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFBFD] px-3 py-2 text-sm text-gray-400">
        Loading reports…
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_60px_minmax(320px,1.15fr)] items-center gap-4 w-full">
      <TransferPanel
        title="Select Reports(Available)"
        items={filteredAvailable}
        selectedIds={toggledAvailable}
        onToggleItem={handleToggleAvailable}
        onSelectAll={handleSelectAllAvailable}
        searchValue={searchAvailable}
        onSearchChange={setSearchAvailable}
      />

      <div className="flex sm:flex-col gap-3 justify-center items-center py-2 sm:pt-8">
        <TransferListMoveButton
          direction="forward"
          disabled={toggledAvailable.length === 0}
          aria-label="Move selected to assigned"
          onClick={handleMoveForward}
          className="[&>svg]:rotate-90 sm:[&>svg]:rotate-0"
        />
        <TransferListMoveButton
          direction="back"
          disabled={toggledSelected.length === 0}
          aria-label="Move selected to unassigned"
          onClick={handleMoveBack}
          className="[&>svg]:-rotate-90 sm:[&>svg]:rotate-180"
        />
      </div>

      <TransferPanel
        title="Select Reports(Selected)"
        items={filteredSelected}
        selectedIds={toggledSelected}
        onToggleItem={handleToggleSelected}
        onSelectAll={handleSelectAllSelected}
        searchValue={searchSelected}
        onSearchChange={setSearchSelected}
        showAudienceFlags
        audienceFlags={audienceFlags}
        onAudienceFlagChange={handleAudienceFlagChange}
      />
    </div>
  )
}

export function DepartmentReportSettingsPanel({
  departmentId,
  departmentCode,
  departmentName,
  reportOptions,
  mappedReports,
  isReportOptionsLoading,
  isMappedReportsLoading,
  isSubmitting = false,
  onEnsureDepartmentId,
  onExit,
}: DepartmentReportSettingsPanelProps) {
  const saveFnRef = useRef<(() => Promise<void>) | null>(null)

  const {
    countyNameDisplay,
    serverMappedReportIds,
    multiSelectKey,
    isSaving,
    setPendingReportIds,
    handleImmediateUpdate,
  } = useDepartmentReportSettings({
    departmentId,
    departmentName,
    mappedReports,
    onEnsureDepartmentId,
  })

  const showDepartmentSummary = Boolean(departmentCode?.trim() || departmentName?.trim())
  const isReportDataLoading = isReportOptionsLoading || isMappedReportsLoading
  const actionsDisabled = isSubmitting || isSaving || isReportDataLoading

  const handleSave = async () => {
    await saveFnRef.current?.()
  }

  return (
    <div className="px-4 sm:px-6 pb-6">
      {showDepartmentSummary && (
        <DepartmentEditContextHeader
          countyName={countyNameDisplay}
          code={departmentCode}
          departmentName={departmentName}
        />
      )}

      <div className="py-4 sm:py-6 min-h-[220px]">
        <label className={labelClassName}>Reports</label>
        <p className="mb-3 rounded-[8px] border border-[#E8E4FF] bg-[#F8F6FF] px-3 py-2 text-[12px] leading-relaxed text-[#4B5563]">
          <span className="font-semibold text-[#6C5DD3]">Note:</span>
          <br />
          <span className="font-semibold">Admin</span> = Super Admin, Client Admin, Department
          Admin, Payroll Admin, Time Study Admin, Time Study Supervisor
          <br />
          <span className="font-semibold">User</span> = User
        </p>
        <DepartmentReportMultiSelectField
          key={`${multiSelectKey}-${serverMappedReportIds}`}
          reportOptions={reportOptions}
          serverMappedReportIds={serverMappedReportIds}
          isLoading={isReportDataLoading}
          onSelectedReportIdsChange={setPendingReportIds}
          bindSave={(fn) => {
            saveFnRef.current = fn
          }}
          onSave={handleImmediateUpdate}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4">
        <Button
          type="button"
          disabled={actionsDisabled}
          onClick={onExit}
          className="w-full sm:w-[140px] h-[48px] sm:h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[15px] sm:text-[16px] font-[500]"
        >
          Exit
        </Button>
        <Button
          type="button"
          disabled={actionsDisabled}
          onClick={() => void handleSave()}
          className="w-full sm:w-[140px] h-[48px] sm:h-[50px] bg-[#6C5DD3] hover:bg-[#5B4CC4] text-white rounded-[8px] text-[15px] sm:text-[16px] font-[500]"
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}
