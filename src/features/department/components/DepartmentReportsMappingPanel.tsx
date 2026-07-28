import { useMemo } from "react"
import { FormProvider, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { DEFAULT_SETTINGS } from "@/features/settings/constants"
import { ReportsForm } from "@/features/settings/components/Reports/ReportsForm"
import type { SettingsFormValues } from "@/features/settings/types"
import { useDepartmentReportsMappingSave } from "../hooks/useDepartmentReportsMappingSave"
import { DepartmentEditContextHeader } from "./DepartmentEditContextHeader"

type DepartmentReportsMappingPanelProps = {
  departmentId: string | null
  departmentCode?: string
  departmentName?: string
  countyName?: string
  isSubmitting?: boolean
  onExit: () => void
}

function DepartmentReportsMappingFormBody({
  departmentId,
  isOpen,
  isSubmitting,
  onExit,
}: {
  departmentId: string
  isOpen: boolean
  isSubmitting: boolean
  onExit: () => void
}) {
  const transferSave = useDepartmentReportsMappingSave()

  return (
    <>
      <ReportsForm
        isSaving={isSubmitting || transferSave.isSaving}
        isSectionOpen={isOpen}
        fixedDepartmentId={departmentId}
        useCountyMappedReports={false}
        transferSave={transferSave}
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-6">
        <Button
          type="button"
          disabled={isSubmitting || transferSave.isSaving}
          onClick={onExit}
          className="w-full sm:w-[140px] h-[48px] sm:h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[15px] sm:text-[16px] font-[500]"
        >
          Exit
        </Button>
      </div>
    </>
  )
}

/** Edit Department → Reports mapping: department-mapped reports + per-dept master codes / activities. */
export function DepartmentReportsMappingPanel({
  departmentId,
  departmentCode,
  departmentName,
  countyName,
  isSubmitting = false,
  onExit,
}: DepartmentReportsMappingPanelProps) {
  const defaultValues = useMemo<SettingsFormValues>(
    () =>
      ({
        ...DEFAULT_SETTINGS,
        reports: {
          ...DEFAULT_SETTINGS.reports,
          departmentId: departmentId ?? "",
        },
      }) as SettingsFormValues,
    [departmentId],
  )

  const form = useForm<SettingsFormValues>({
    defaultValues,
    mode: "onChange",
  })

  const showHeader = Boolean(departmentCode?.trim() || departmentName?.trim())
  const deptId = departmentId?.trim() ?? ""

  return (
    <div className="px-4 sm:px-6 pb-6">
      {showHeader ? (
        <DepartmentEditContextHeader
          countyName={countyName}
          code={departmentCode}
          departmentName={departmentName}
        />
      ) : null}

      {!deptId ? (
        <p className="py-8 text-[13px] text-[#6B7280]">
          Save department details before configuring report mapping.
        </p>
      ) : (
        <FormProvider {...form}>
          <DepartmentReportsMappingFormBody
            departmentId={deptId}
            isOpen
            isSubmitting={isSubmitting}
            onExit={onExit}
          />
        </FormProvider>
      )}
    </div>
  )
}
