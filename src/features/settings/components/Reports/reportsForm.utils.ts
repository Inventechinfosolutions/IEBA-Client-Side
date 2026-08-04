import type { UseFormSetValue } from "react-hook-form"

import type { ReportOption, SettingsFormValues } from "@/features/settings/types"

export function isMcahTvtsReportKey(reportKey: string | null | undefined): boolean {
  return String(reportKey ?? "").trim().toUpperCase() === "MCAH-TVTS"
}

/** Reports that can be selected but must not be mapped (Exclusion / transfers locked). */
const REPORTS_MAPPING_READ_ONLY_KEYS = new Set([
  "MAATCM",
  "TCM_MAA_ADHOC",
  "DSSRPT3",
  "DSSRPT4",
  "DSSRPT5",
  "WIC",
])

export function isReportsMappingReadOnlyKey(reportKey: string | null | undefined): boolean {
  return REPORTS_MAPPING_READ_ONLY_KEYS.has(String(reportKey ?? "").trim().toUpperCase())
}

export function clearReportBuckets(setValue: UseFormSetValue<SettingsFormValues>) {
  setValue("reports.excludedMasterCodeIds", [])
  setValue("reports.includedMasterCodeIds", [])
  setValue("reports.excludedActivityCodes", [])
  setValue("reports.includedActivityCodes", [])
  setValue("reports.excludedProgramCodes", [])
  setValue("reports.includedProgramCodes", [])
  setValue("reports.category1Programs", [])
  setValue("reports.category2Programs", [])
  setValue("reports.category3Programs", [])
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
  setValue("reports.includedProgramCodes", report.includedProgramCodes ?? [])
  setValue("reports.excludedProgramCodes", report.excludedProgramCodes ?? [])

  const hasExplicitCategories =
    (report.category1Programs?.length ?? 0) > 0 ||
    (report.category2Programs?.length ?? 0) > 0 ||
    (report.category3Programs?.length ?? 0) > 0

  if (hasExplicitCategories) {
    setValue("reports.category1Programs", report.category1Programs ?? [])
    setValue("reports.category2Programs", report.category2Programs ?? [])
    setValue("reports.category3Programs", report.category3Programs ?? [])
  } else {
    // Legacy: includedProgramCodes hard-mapped MCAH-1/2/3 → categories
    const included = new Set(
      (report.includedProgramCodes ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean),
    )
    setValue("reports.category1Programs", included.has("MCAH-1") ? ["MCAH-1"] : [])
    setValue("reports.category2Programs", included.has("MCAH-2") ? ["MCAH-2"] : [])
    setValue("reports.category3Programs", included.has("MCAH-3") ? ["MCAH-3"] : [])
  }
}
