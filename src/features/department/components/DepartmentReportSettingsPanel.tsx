import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { useDepartmentReportSettings } from "../hooks/useDepartmentReportSettings"
import type { DepartmentReportOption, DepartmentReportSettingsPanelProps } from "../types"
import { DepartmentEditContextHeader } from "./DepartmentEditContextHeader"
import { TransferPanel } from "./TransferPanel"

const labelClassName = "mb-2 block text-[13px] font-[500] text-[#374151]"

type DepartmentReportMultiSelectFieldProps = {
  reportOptions: DepartmentReportOption[]
  serverMappedReportIds: string
  isLoading: boolean
  onSelectedReportIdsChange: (reportIdsCsv: string) => void
  onImmediateUpdate?: (reportIds: number[]) => void
}

function DepartmentReportMultiSelectField({
  reportOptions,
  serverMappedReportIds,
  isLoading,
  onSelectedReportIdsChange,
  onImmediateUpdate,
}: DepartmentReportMultiSelectFieldProps) {
  const [userReportIds, setUserReportIds] = useState<string | null>(null)
  const [searchAvailable, setSearchAvailable] = useState("")
  const [searchSelected, setSearchSelected] = useState("")
  const [toggledAvailable, setToggledAvailable] = useState<string[]>([])
  const [toggledSelected, setToggledSelected] = useState<string[]>([])

  const selectedIds = useMemo(() => {
    const raw = userReportIds ?? serverMappedReportIds
    return raw
      .split(/[,;\n]+/g)
      .map((p) => p.trim())
      .filter(Boolean)
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
        r.code.toLowerCase().includes(query)
    )
  }, [availableReports, searchAvailable])

  const filteredSelected = useMemo(() => {
    if (!searchSelected.trim()) return selectedReports
    const query = searchSelected.toLowerCase()
    return selectedReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query)
    )
  }, [selectedReports, searchSelected])

  const handleToggleAvailable = (id: string) => {
    setToggledAvailable((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelected = (id: string) => {
    setToggledSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

  const handleMoveForward = () => {
    if (toggledAvailable.length === 0) return
    const nextIds = [...new Set([...selectedIds, ...toggledAvailable])]
    const csv = nextIds.join(", ")
    setUserReportIds(csv)
    onSelectedReportIdsChange(csv)
    setToggledAvailable([])
    if (onImmediateUpdate) {
      onImmediateUpdate(nextIds.map(Number))
    }
  }

  const handleMoveBack = () => {
    if (toggledSelected.length === 0) return
    const nextIds = selectedIds.filter((id) => !toggledSelected.includes(id))
    const csv = nextIds.join(", ")
    setUserReportIds(csv)
    onSelectedReportIdsChange(csv)
    setToggledSelected([])
    if (onImmediateUpdate) {
      onImmediateUpdate(nextIds.map(Number))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFBFD] px-3 py-2 text-sm text-gray-400">
        Loading reports…
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_60px_1fr] items-center gap-4 w-full">
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
  const {
    countyNameDisplay,
    serverMappedReportIds,
    multiSelectKey,
    isSaving,
    setPendingReportIds,
    saveMappedReports,
    handleImmediateUpdate,
  } = useDepartmentReportSettings({
    departmentId,
    departmentName,
    mappedReports,
    onEnsureDepartmentId,
  })

  const showDepartmentSummary = Boolean(departmentCode?.trim() || departmentName?.trim())
  const isReportDataLoading = isReportOptionsLoading || isMappedReportsLoading
  const saveDisabled = isSubmitting || isSaving || isReportDataLoading

  return (
    <div className="px-4 sm:px-6 pb-6">
      {showDepartmentSummary && (
        <DepartmentEditContextHeader
          countyName={countyNameDisplay}
          code={departmentCode}
          departmentName={departmentName}
        />
      )}

      <div className="py-4 sm:py-8 min-h-[220px]">
        <label className={labelClassName}>Reports</label>
        <DepartmentReportMultiSelectField
          key={`${multiSelectKey}-${serverMappedReportIds}`}
          reportOptions={reportOptions}
          serverMappedReportIds={serverMappedReportIds}
          isLoading={isReportDataLoading}
          onSelectedReportIdsChange={setPendingReportIds}
          onImmediateUpdate={handleImmediateUpdate}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4">
        <Button
          type="button"
          disabled={saveDisabled}
          onClick={onExit}
          className="w-full sm:w-[140px] h-[48px] sm:h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[15px] sm:text-[16px] font-[500]"
        >
          Exit
        </Button>
      </div>
    </div>
  )
}
