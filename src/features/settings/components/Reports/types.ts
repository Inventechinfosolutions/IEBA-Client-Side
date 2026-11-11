export type ReportsSettingsModel = {
  departmentId: string
  reportKey: string
  masterCodeExclusionMode: "exclude" | "include"
  activityExclusionMode: "exclude" | "include"
  excludedMasterCodeIds: string[]
  includedMasterCodeIds: string[]
  excludedActivityCodes: string[]
  includedActivityCodes: string[]
  /** MCAH-TVTS only — program codes on the Assigned side (union of categories) */
  includedProgramCodes: string[]
  /** MCAH-TVTS only — program codes on the Unassigned side */
  excludedProgramCodes: string[]
  /** MCAH-TVTS only — Category 1 program codes */
  category1Programs: string[]
  /** MCAH-TVTS only — Category 2 program codes */
  category2Programs: string[]
  /** MCAH-TVTS only — Category 3 program codes */
  category3Programs: string[]
  /** CLPPP Layer 1 — programs whose mapped activities stay on their own rows */
  clpppEligibleProgramCodes: string[]
  /** CLPPP Layer 2 — programs that roll into row 11B. `*` means all non-eligible programs. */
  clpppNonClpppProgramCodes: string[]
  /** CLPPP Layer 2 — activity codes that always roll into row 11B */
  clpppNonClpppActivityCodes: string[]
  /** CLPPP Layer 2 — programs whose PTO consolidates into row 12. `*` means all programs. */
  clpppPtoProgramCodes: string[]
}
