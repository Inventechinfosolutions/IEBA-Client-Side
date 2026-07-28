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
}
