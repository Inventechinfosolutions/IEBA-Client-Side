import { useState } from "react"
import { toast } from "sonner"

import {
  formatCountyDisplayName,
  parseDepartmentReportIdsForSave,
  serializeDepartmentReportIds,
} from "../lib/departmentReport.utils"
import { useMapDepartmentReports } from "../mutations/mapDepartmentReports"
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
  const [pendingReportIds, setPendingReportIds] = useState("")

  const departmentNameTrimmed = departmentName?.trim() ?? ""
  const mapReportsMutation = useMapDepartmentReports()

  const serverMappedReportIds = serializeDepartmentReportIds(
    mappedReports?.reportIds ?? [],
  )
  const countyNameDisplay = formatCountyDisplayName(mappedReports?.countyName)
  const selectedReportIdsCsv = pendingReportIds || serverMappedReportIds
  const multiSelectKey = `${departmentId ?? "new"}-${departmentNameTrimmed}`

  const saveMappedReports = async () => {
    const reportIds = parseDepartmentReportIdsForSave(selectedReportIdsCsv)
    if (reportIds.length === 0) {
      toast.error("Please select at least one report")
      return
    }

    let deptId = departmentId
    if (!deptId) {
      deptId = await onEnsureDepartmentId()
    }
    if (!deptId) {
      toast.error("Save department details before mapping reports")
      return
    }

    if (!departmentNameTrimmed) {
      toast.error("Department name is required to map reports")
      return
    }

    try {
      await mapReportsMutation.mutateAsync({
        departmentId: Number(deptId),
        name: departmentNameTrimmed,
        reportIds,
      })
      toast.success("Department reports mapped successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to map department reports")
    }
  }

  return {
    countyNameDisplay,
    serverMappedReportIds,
    multiSelectKey,
    isSaving: mapReportsMutation.isPending,
    setPendingReportIds,
    saveMappedReports,
  }
}
