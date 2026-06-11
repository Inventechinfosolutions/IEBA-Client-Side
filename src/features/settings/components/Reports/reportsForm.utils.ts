import type { UseFormSetValue } from "react-hook-form"

import type { ReportOption, SettingsFormValues } from "@/features/settings/types"

export function clearReportBuckets(setValue: UseFormSetValue<SettingsFormValues>) {
  setValue("reports.excludedMasterCodeIds", [])
  setValue("reports.includedMasterCodeIds", [])
  setValue("reports.excludedActivityCodes", [])
  setValue("reports.includedActivityCodes", [])
}

export function loadReportBucketsFromReportOption(
  setValue: UseFormSetValue<SettingsFormValues>,
  report: ReportOption,
) {
  const mode = report.type === "included" ? "include" : "exclude"

  setValue("reports.masterCodeExclusionMode", mode)
  setValue("reports.activityExclusionMode", mode)
  setValue("reports.includedMasterCodeIds", (report.includedMasterCodeData?.masterCodeIds ?? []).map(String))
  setValue("reports.excludedMasterCodeIds", (report.excludedMasterCodeData?.masterCodeIds ?? []).map(String))
  setValue("reports.includedActivityCodes", report.includedMasterCodeData?.activityCodes ?? [])
  setValue("reports.excludedActivityCodes", report.excludedMasterCodeData?.activityCodes ?? [])
}
