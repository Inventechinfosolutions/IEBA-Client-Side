import { useState } from "react"
import { toast } from "sonner"

import {
  buildReportVisibilityPayload,
  formatCountyDisplayName,
  parseDepartmentReportIdsForSave,
  serializeDepartmentReportIds,
} from "../lib/departmentReport.utils"
import { useUpdateAssignedUnassignedReports } from "../mutations/updateAssignedUnassignedReports"
import type { DepartmentReportsMapResDto } from "../types"

type UseDepartmentReportSettingsParams = {
  departmentId: string | null
  departmentName?: string
  mappedReports: DepartmentReportsMapResDto | undefined
  onEnsureDepartmentId: () => Promise<string | null>
}

export function useDepartmentReportSettings({
  departmentId,
  departmentName,
  mappedReports,
  onEnsureDepartmentId,
}: UseDepartmentReportSettingsParams) {
  const [pendingReportIds, setPendingReportIds] = useState<string | null>(null)

  const departmentNameTrimmed = departmentName?.trim() ?? ""
  const updateAssignedUnassignedMutation = useUpdateAssignedUnassignedReports()

  const serverMappedReportIds = serializeDepartmentReportIds(
    mappedReports?.reportIds ?? [],
  )

  const [prevServerIds, setPrevServerIds] = useState(serverMappedReportIds)
  if (serverMappedReportIds !== prevServerIds) {
    setPrevServerIds(serverMappedReportIds)
    setPendingReportIds(null)
  }

  const countyNameDisplay = formatCountyDisplayName(mappedReports?.countyName)
  const selectedReportIdsCsv = pendingReportIds !== null ? pendingReportIds : serverMappedReportIds
  const multiSelectKey = `${departmentId ?? "new"}-${departmentNameTrimmed}`

  const persistMappedReports = async (
    reportIds: number[],
    visibilityById: Record<string, { visibleToAdmin: boolean; visibleToUser: boolean }>,
  ) => {
    let deptId = departmentId
    if (!deptId) {
      deptId = await onEnsureDepartmentId()
    }
    if (!deptId) {
      toast.error("Save department details before mapping reports")
      return
    }

    const reportVisibility = buildReportVisibilityPayload(reportIds, visibilityById)

    try {
      await updateAssignedUnassignedMutation.mutateAsync({
        departmentId: deptId,
        reportIds,
        reportVisibility,
      })
      toast.success("Department reports updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update department reports")
    }
  }

  const saveMappedReports = async (
    visibilityById: Record<string, { visibleToAdmin: boolean; visibleToUser: boolean }>,
  ) => {
    const reportIds = parseDepartmentReportIdsForSave(selectedReportIdsCsv)
    await persistMappedReports(reportIds, visibilityById)
  }

  const handleImmediateUpdate = async (
    reportIds: number[],
    visibilityById: Record<string, { visibleToAdmin: boolean; visibleToUser: boolean }>,
  ) => {
    await persistMappedReports(reportIds, visibilityById)
  }

  return {
    countyNameDisplay,
    serverMappedReportIds,
    multiSelectKey,
    isSaving: updateAssignedUnassignedMutation.isPending,
    setPendingReportIds,
    saveMappedReports,
    handleImmediateUpdate,
  }
}
