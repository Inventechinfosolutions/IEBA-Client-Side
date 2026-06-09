import type { UseFormSetValue } from "react-hook-form"

import type { ReportOption, SettingsFormValues } from "@/features/settings/types"
import { resolveReportBucketsForForm } from "@/features/reports/lib/reportMasterCodeData.utils"

export function clearReportBuckets(setValue: UseFormSetValue<SettingsFormValues>) {
  setValue("reports.excludedMasterCodeIds", [])
  setValue("reports.includedMasterCodeIds", [])
  setValue("reports.excludedActivityCodes", [])
  setValue("reports.includedActivityCodes", [])
}

export function reportOptionToApiRow(report: ReportOption): Record<string, unknown> {
  return {
    type: report.type,
    reportdata: report.reportdata,
    excludedMasterCodeData: report.excludedMasterCodeData,
    includedMasterCodeData: report.includedMasterCodeData,
  }
}

export function applyReportBucketsToForm(
  setValue: UseFormSetValue<SettingsFormValues>,
  buckets: ReturnType<typeof resolveReportBucketsForForm>,
  masterCodeExclusionMode: "include" | "exclude",
  activityExclusionMode: "include" | "exclude",
) {
  setValue("reports.masterCodeExclusionMode", masterCodeExclusionMode)
  setValue("reports.activityExclusionMode", activityExclusionMode)
  setValue("reports.excludedMasterCodeIds", buckets.excludedMasterCodeIds)
  setValue("reports.includedMasterCodeIds", buckets.includedMasterCodeIds)
  setValue("reports.excludedActivityCodes", buckets.excludedActivityCodes)
  setValue("reports.includedActivityCodes", buckets.includedActivityCodes)
}

/** Load form from a mapped report row (call from dropdown onChange only — no useEffect). */
export function loadReportBucketsFromApiRow(
  setValue: UseFormSetValue<SettingsFormValues>,
  report: ReportOption,
  masterCatalogIds: number[],
  activityCatalogCodes: string[],
) {
  const buckets = resolveReportBucketsForForm(
    reportOptionToApiRow(report),
    masterCatalogIds,
    activityCatalogCodes,
  )
  const mode = report.type === "included" ? "include" : "exclude"
  applyReportBucketsToForm(setValue, buckets, mode, mode)
}

/** Load picker state from report row without requiring full catalogs (transfer GET APIs split buckets). */
export function loadReportBucketsFromReportOption(
  setValue: UseFormSetValue<SettingsFormValues>,
  report: ReportOption,
) {
  const mode = report.type === "included" ? "include" : "exclude"
  const includedMcIds = (report.includedMasterCodeData?.masterCodeIds ?? []).map(String)
  const excludedMcIds = (report.excludedMasterCodeData?.masterCodeIds ?? []).map(String)
  const includedActs = report.includedMasterCodeData?.activityCodes ?? []
  const excludedActs = report.excludedMasterCodeData?.activityCodes ?? []

  setValue("reports.masterCodeExclusionMode", mode)
  setValue("reports.activityExclusionMode", mode)
  setValue("reports.includedMasterCodeIds", includedMcIds)
  setValue("reports.excludedMasterCodeIds", excludedMcIds)
  setValue("reports.includedActivityCodes", includedActs)
  setValue("reports.excludedActivityCodes", excludedActs)
}
