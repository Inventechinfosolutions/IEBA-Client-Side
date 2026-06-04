export type ReportsSettingsModel = {
  departmentId: string
  reportKey: string
  masterCodeExclusionMode: "exclude" | "include"
  activityExclusionMode: "exclude" | "include"
  excludedMasterCodeIds: string[]
  includedMasterCodeIds: string[]
  excludedActivityCodes: string[]
  includedActivityCodes: string[]
}

