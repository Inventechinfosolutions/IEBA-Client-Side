import type { UseFormSetValue } from "react-hook-form"

import type { ReportOption, SettingsFormValues } from "@/features/settings/types"

export function isMcahTvtsReportKey(reportKey: string | null | undefined): boolean {
  return String(reportKey ?? "").trim().toUpperCase() === "MCAH-TVTS"
}

/** Reports that can be selected but must not be mapped (Exclusion / transfers locked). */
const REPORTS_MAPPING_READ_ONLY_KEYS = new Set([
  "DSSRPT1",
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

/**
 * Hard-coded report behavior that cannot be changed via department mapping.
 * Shown next to Code / Department name on the Reports mapping tab.
 */
export function getReportHardCodedMappingNotes(reportKey: string | null | undefined): string[] {
  const key = String(reportKey ?? "").trim().toUpperCase()
  if (!key) return []

  const notes: string[] = []

  if (key === "DSSRPT1") {
    notes.push("9000 – Non Allocable (set by the system)")
    notes.push("9999 – Social Services Supervisor / apportioned time (set by the system)")
    notes.push("No master-code / activity mapping — report settings are not used for DSSRPT1")
  } else if (key === "DSSRPT3" || key === "DSSRPT4") {
    notes.push("Based on Cost Pool selection — activities come from the selected cost pool")
    notes.push("No master-code / activity mapping on this screen")
  } else if (key === "DSSRPT5") {
    notes.push("Based on Payroll — salary, FICA, benefits, and related payroll data")
    notes.push("No master-code or activity-code settings")
  } else if (key === "MAATCM" || key === "TCM_MAA_ADHOC") {
    notes.push("No master-code mapping on this screen")
    notes.push("In the report UI you can only select activities")
  } else if (isReportsMappingReadOnlyKey(key)) {
    notes.push("Master-code / activity mapping is locked for this report")
  }

  return notes
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
