import { useState } from "react"

import { Button } from "@/components/ui/button"
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown"
import { cn } from "@/lib/utils"
import { useDepartmentReportSettings } from "../hooks/useDepartmentReportSettings"
import type { DepartmentReportOption, DepartmentReportSettingsPanelProps } from "../types"
import { DepartmentEditContextHeader } from "./DepartmentEditContextHeader"

const labelClassName = "mb-2 block text-[13px] font-[500] text-[#374151]"
const multiSelectClassName =
  "!min-h-[57px] !w-full !max-w-[600px] !rounded-[8px] !border-[#E5E7EB] !px-[11px] !py-2 !pr-9 !text-[14px] !font-normal !leading-normal"

type DepartmentReportMultiSelectFieldProps = {
  reportOptions: DepartmentReportOption[]
  serverMappedReportIds: string
  isLoading: boolean
  onSelectedReportIdsChange: (reportIdsCsv: string) => void
}

function DepartmentReportMultiSelectField({
  reportOptions,
  serverMappedReportIds,
  isLoading,
  onSelectedReportIdsChange,
}: DepartmentReportMultiSelectFieldProps) {
  const [userReportIds, setUserReportIds] = useState<string | null>(null)
  const selectedValue = userReportIds ?? serverMappedReportIds

  const handleChange = (next: string) => {
    setUserReportIds(next)
    onSelectedReportIdsChange(next)
  }

  return (
    <MultiSelectDropdown
      value={selectedValue}
      onChange={handleChange}
      onBlur={() => {}}
      options={reportOptions.map((r) => ({
        value: String(r.id),
        label: r.label,
      }))}
      placeholder="Select reports"
      disabled={isLoading}
      isLoading={isLoading}
      maxVisibleItems={4}
      className={cn(
        multiSelectClassName,
        "[&_span]:!text-[13px]",
        isLoading && "cursor-not-allowed bg-[#F9FAFB] opacity-100",
      )}
    />
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
    <div className="px-6 pb-6">
      {showDepartmentSummary && (
        <DepartmentEditContextHeader
          countyName={countyNameDisplay}
          code={departmentCode}
          departmentName={departmentName}
        />
      )}

      <div className="py-8 min-h-[220px]">
        <label className={labelClassName}>Reports</label>
        <DepartmentReportMultiSelectField
          key={multiSelectKey}
          reportOptions={reportOptions}
          serverMappedReportIds={serverMappedReportIds}
          isLoading={isReportDataLoading}
          onSelectedReportIdsChange={setPendingReportIds}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          disabled={saveDisabled}
          onClick={() => void saveMappedReports()}
          className="w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
        >
          Save
        </Button>
        <Button
          type="button"
          disabled={saveDisabled}
          onClick={onExit}
          className="w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
        >
          Exit
        </Button>
      </div>
    </div>
  )
}
