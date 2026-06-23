import { useState } from "react"
import { toast } from "sonner"

import {
  formatCountyDisplayName,
  parseDepartmentReportIdsForSave,
  serializeDepartmentReportIds,
} from "../lib/departmentReport.utils"
import { useMapDepartmentReports } from "../mutations/mapDepartmentReports"
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
  const mapReportsMutation = useMapDepartmentReports()
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

  const saveMappedReports = async () => {
    const reportIds = parseDepartmentReportIdsForSave(selectedReportIdsCsv)

    let deptId = departmentId
    if (!deptId) {
      deptId = await onEnsureDepartmentId()
    }
    if (!deptId) {
      toast.error("Save department details before mapping reports")
      return
    }

    try {
      await updateAssignedUnassignedMutation.mutateAsync({
        departmentId: deptId,
        reportIds,
      })
      toast.success("Department reports saved successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department reports")
    }
  }

  const handleImmediateUpdate = async (reportIds: number[]) => {
    let deptId = departmentId
    if (!deptId) {
      deptId = await onEnsureDepartmentId()
    }
    if (!deptId) {
      toast.error("Save department details before mapping reports")
      return
    }

    try {
      await updateAssignedUnassignedMutation.mutateAsync({
        departmentId: deptId,
        reportIds,
      })
      toast.success("Department reports updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update department reports")
    }
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
