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

/** Read-only at county level but editable on Department → Reports mapping. */
const DEPARTMENT_EDITABLE_MAPPING_KEYS = new Set(["DSSRPT1"])

type MappingScopeOptions = {
  /** True on Department → Reports mapping (department_report_config). */
  departmentLevel?: boolean
}

export function isReportsMappingReadOnlyKey(
  reportKey: string | null | undefined,
  { departmentLevel = false }: MappingScopeOptions = {},
): boolean {
  const key = String(reportKey ?? "").trim().toUpperCase()
  if (departmentLevel && DEPARTMENT_EDITABLE_MAPPING_KEYS.has(key)) return false
  return REPORTS_MAPPING_READ_ONLY_KEYS.has(key)
}

/**
 * Hard-coded report behavior that cannot be changed via department mapping.
 * Shown next to Code / Department name on the Reports mapping tab.
 */
export function getReportHardCodedMappingNotes(
  reportKey: string | null | undefined,
  { departmentLevel = false }: MappingScopeOptions = {},
): string[] {
  const key = String(reportKey ?? "").trim().toUpperCase()
  if (!key) return []

  const notes: string[] = []

  if (key === "DSSRPT1") {
    notes.push("9000 – Non Allocable (set by the system)")
    notes.push("9999 – Social Services Supervisor / apportioned time (set by the system)")
    notes.push(
      departmentLevel
        ? "Include / exclude master codes and activities for this department's DSSRPT1 activity list"
        : "Master-code / activity mapping is configured per department (Department → Reports)",
    )
  } else if (key === "DSSRPT3" || key === "DSSRPT4") {
    notes.push("Based on Cost Pool selection — activities come from the selected cost pool")
    notes.push("No master-code / activity mapping on this screen")
  } else if (key === "DSSRPT5") {
    notes.push("Based on Payroll — salary, FICA, benefits, and related payroll data")
    notes.push("No master-code or activity-code settings")
  } else if (key === "MAATCM" || key === "TCM_MAA_ADHOC") {
    notes.push("No master-code mapping on this screen")
    notes.push("In the report UI you can only select activities")
  } else if (isReportsMappingReadOnlyKey(key, { departmentLevel })) {
    notes.push("Master-code / activity mapping is locked for this report")
  }

  return notes
}

export type ClpppProgramRouting = {
  eligibleProgramCodes: string[]
  nonClpppProgramCodes: string[]
  nonClpppActivityCodes: string[]
  ptoProgramCodes: string[]
}

export const DEFAULT_CLPPP_ROUTING: ClpppProgramRouting = {
  eligibleProgramCodes: [],
  nonClpppProgramCodes: ["*"],
  nonClpppActivityCodes: [],
  ptoProgramCodes: ["*"],
}

function criteriaCodes(
  criteria: Record<string, unknown>,
  key: keyof ClpppProgramRouting,
  fallback: string[],
): string[] {
  const value = criteria[key]
  if (value === undefined) return fallback
  if (!Array.isArray(value) || value.some((code) => typeof code !== "string")) {
    throw new Error(`CLPPP criteria field "${key}" must be an array of codes.`)
  }
  const codes = [...new Set(value.map((code) => String(code).trim()).filter(Boolean))]
  if (codes.includes("*")) return ["*"]
  return codes.length ? codes : fallback
}

function readClpppObject(raw?: string | null): Record<string, unknown> | null {
  if (!raw?.trim()) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
  const clppp = (parsed as Record<string, unknown>).clppp
  if (!clppp || typeof clppp !== "object" || Array.isArray(clppp)) return null
  return clppp as Record<string, unknown>
}

export function parseClpppProgramRouting(criteriaRaw?: string | null, reportdataRaw?: string | null): ClpppProgramRouting {
  const fromReportData = readClpppObject(reportdataRaw)
  if (fromReportData) {
    return {
      eligibleProgramCodes: criteriaCodes(fromReportData, "eligibleProgramCodes", []).filter((code) => code !== "*"),
      nonClpppProgramCodes: criteriaCodes(fromReportData, "nonClpppProgramCodes", ["*"]),
      nonClpppActivityCodes: criteriaCodes(fromReportData, "nonClpppActivityCodes", []).filter((code) => code !== "*"),
      ptoProgramCodes: criteriaCodes(fromReportData, "ptoProgramCodes", ["*"]),
    }
  }
  if (!criteriaRaw?.trim()) return { ...DEFAULT_CLPPP_ROUTING }
  let criteria: unknown
  try {
    criteria = JSON.parse(criteriaRaw)
  } catch {
    throw new Error("CLPPP report criteria is not valid JSON.")
  }
  if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) {
    throw new Error("CLPPP report criteria must be a JSON object.")
  }
  const parsed = criteria as Record<string, unknown>
  return {
    eligibleProgramCodes: criteriaCodes(parsed, "eligibleProgramCodes", []).filter((code) => code !== "*"),
    nonClpppProgramCodes: criteriaCodes(parsed, "nonClpppProgramCodes", ["*"]),
    nonClpppActivityCodes: criteriaCodes(parsed, "nonClpppActivityCodes", []).filter((code) => code !== "*"),
    ptoProgramCodes: criteriaCodes(parsed, "ptoProgramCodes", ["*"]),
  }
}

function applyClpppRouting(setValue: UseFormSetValue<SettingsFormValues>, routing: ClpppProgramRouting) {
  setValue("reports.clpppEligibleProgramCodes", routing.eligibleProgramCodes)
  setValue("reports.clpppNonClpppProgramCodes", routing.nonClpppProgramCodes)
  setValue("reports.clpppNonClpppActivityCodes", routing.nonClpppActivityCodes)
  setValue("reports.clpppPtoProgramCodes", routing.ptoProgramCodes)
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
  applyClpppRouting(setValue, DEFAULT_CLPPP_ROUTING)
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
  if (String(report.key).trim().toUpperCase() === "CLPPP") {
    applyClpppRouting(setValue, parseClpppProgramRouting(report.criteria, report.reportdata))
  } else {
    applyClpppRouting(setValue, DEFAULT_CLPPP_ROUTING)
  }
}
