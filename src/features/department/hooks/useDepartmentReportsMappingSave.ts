import { useCallback, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  upsertDepartmentReportConfig,
  type AssignedUnassignedReportsResDto,
} from "@/features/department/api/departmentReports"
import { departmentKeys } from "@/features/department/keys"
import { reportKeys } from "@/features/reports/keys"
import { buildReportMasterCodeSavePayload } from "@/features/reports/lib/reportMasterCodeData.utils"
import { mapRawReportsToReportOptions } from "@/features/settings/lib/reportOptions.utils"
import { isMcahTvtsReportKey } from "@/features/settings/components/Reports/reportsForm.utils"
import type { ReportOption, SettingsFormValues } from "@/features/settings/types"
import type { ReportsTransferDirection } from "@/features/settings/components/Reports/reportsTransfer.types"
import type { ReportsBucketMode, ReportsSaveScope } from "@/features/settings/types"

async function saveDepartmentReportBuckets(params: {
  departmentId: string
  report: ReportOption
  values: SettingsFormValues["reports"]
  saveScope: ReportsSaveScope
}): Promise<ReportOption | null> {
  const masterCodeExclusionMode =
    params.values.masterCodeExclusionMode === "include" ? "include" : "exclude"
  const inclusionType = masterCodeExclusionMode === "include" ? "included" : "excluded"

  if (params.saveScope === "programs" || isMcahTvtsReportKey(params.report.key)) {
    const putRow = await upsertDepartmentReportConfig(params.departmentId, params.report.id!, {
      type: inclusionType,
      category1Programs: params.values.category1Programs ?? [],
      category2Programs: params.values.category2Programs ?? [],
      category3Programs: params.values.category3Programs ?? [],
      includedProgramCodes: params.values.includedProgramCodes ?? [],
      excludedProgramCodes: params.values.excludedProgramCodes ?? [],
      excludedMasterCodeData: { masterCodeIds: [], activityCodes: [] },
      includedMasterCodeData: { masterCodeIds: [], activityCodes: [] },
    })
    return mapRawReportsToReportOptions([putRow])[0] ?? null
  }

  let finalExcludedIds = params.values.excludedMasterCodeIds ?? []
  let finalIncludedIds = params.values.includedMasterCodeIds ?? []
  let finalExcludedActivityCodes = params.values.excludedActivityCodes ?? []
  let finalIncludedActivityCodes = params.values.includedActivityCodes ?? []

  if (params.saveScope === "masterCodes") {
    finalIncludedActivityCodes = []
    finalExcludedActivityCodes = []
  }

  const { excludedMasterCodeData, includedMasterCodeData } = buildReportMasterCodeSavePayload(
    finalExcludedIds,
    finalExcludedActivityCodes,
    finalIncludedIds,
    finalIncludedActivityCodes,
  )

  const putRow = await upsertDepartmentReportConfig(params.departmentId, params.report.id!, {
    type: inclusionType,
    excludedMasterCodeData: {
      masterCodeIds: excludedMasterCodeData.masterCodeIds ?? [],
      activityCodes: excludedMasterCodeData.activityCodes ?? [],
    },
    includedMasterCodeData: {
      masterCodeIds: includedMasterCodeData.masterCodeIds ?? [],
      activityCodes: includedMasterCodeData.activityCodes ?? [],
    },
  })

  return mapRawReportsToReportOptions([putRow])[0] ?? null
}

/** Save master-code / activity / MCAH program buckets per department (department_report_config). */
export function useDepartmentReportsMappingSave() {
  const queryClient = useQueryClient()
  const { getValues, setValue } = useFormContext<SettingsFormValues>()
  const [isSaving, setIsSaving] = useState(false)
  const pendingScopeRef = useRef<{
    scope: ReportsSaveScope
    bucketMode: ReportsBucketMode
  } | null>(null)

  const runSave = useCallback(
    async (scope: ReportsSaveScope, _bucketMode: ReportsBucketMode) => {
      const reports = getValues("reports")
      const departmentId = reports.departmentId?.trim() ?? ""
      const reportKey = reports.reportKey?.trim() ?? ""
      if (!departmentId) {
        toast.error("Save department details before configuring report mapping")
        return
      }

      const deptMapped =
        queryClient.getQueryData<AssignedUnassignedReportsResDto>(
          departmentKeys.reportSettings.assignedUnassigned(departmentId),
        )
      const selectedMapped = deptMapped?.assigned?.find((r) => r.code === reportKey)
      const selectedReport: ReportOption | undefined = selectedMapped
        ? { key: selectedMapped.code, label: selectedMapped.label, id: selectedMapped.id }
        : undefined
      if (!selectedReport?.id) {
        toast.error("Please select a report before saving")
        return
      }

      setIsSaving(true)
      try {
        const updated = await saveDepartmentReportBuckets({
          departmentId,
          report: selectedReport,
          values: reports,
          saveScope: scope,
        })
        if (updated) {
          setValue(
            "reports.excludedMasterCodeIds",
            (updated.excludedMasterCodeData?.masterCodeIds ?? []).map(String),
          )
          setValue(
            "reports.includedMasterCodeIds",
            (updated.includedMasterCodeData?.masterCodeIds ?? []).map(String),
          )
          setValue(
            "reports.excludedActivityCodes",
            updated.excludedMasterCodeData?.activityCodes ?? [],
          )
          setValue(
            "reports.includedActivityCodes",
            updated.includedMasterCodeData?.activityCodes ?? [],
          )
          setValue("reports.includedProgramCodes", updated.includedProgramCodes ?? [])
          setValue("reports.excludedProgramCodes", updated.excludedProgramCodes ?? [])
          setValue("reports.category1Programs", updated.category1Programs ?? [])
          setValue("reports.category2Programs", updated.category2Programs ?? [])
          setValue("reports.category3Programs", updated.category3Programs ?? [])
          void queryClient.invalidateQueries({
            queryKey: departmentKeys.reportSettings.config(departmentId, selectedReport.id),
          })
          void queryClient.invalidateQueries({
            queryKey: reportKeys.byDepartment(departmentId),
          })
          void queryClient.invalidateQueries({
            queryKey: [...reportKeys.all, "activities-by-dept-users"],
          })
        }
        toast.success("Department report settings updated successfully")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update report settings")
      } finally {
        setIsSaving(false)
      }
    },
    [getValues, queryClient, setValue],
  )

  const saveMasterCodes = useCallback(
    (direction: ReportsTransferDirection) => {
      void runSave("masterCodes", direction === "assign" ? "include" : "exclude")
    },
    [runSave],
  )

  const saveActivities = useCallback(
    (direction: ReportsTransferDirection) => {
      void runSave("activities", direction === "assign" ? "include" : "exclude")
    },
    [runSave],
  )

  const savePrograms = useCallback(
    (direction: ReportsTransferDirection) => {
      void runSave("programs", direction === "assign" ? "include" : "exclude")
    },
    [runSave],
  )

  function ReportsTransferSaveTriggers() {
    return null
  }

  return {
    saveMasterCodes,
    saveActivities,
    savePrograms,
    ReportsTransferSaveTriggers,
    isSaving,
    pendingScopeRef,
  }
}
