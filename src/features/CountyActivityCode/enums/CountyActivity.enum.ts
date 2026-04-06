/** Activity `type` from `GET /activities/*` and activity-department payloads. */
export const ApiActivityTypeEnum = {
  PRIMARY: "Primary",
  SECONDARY: "Secondary",
} as const

export type ApiActivityType =
  (typeof ApiActivityTypeEnum)[keyof typeof ApiActivityTypeEnum]

/** County grid / hierarchy: root vs nested activity row. */
export const CountyActivityGridRowType = {
  PRIMARY: "primary",
  SUB: "sub",
} as const

export type CountyActivityGridRowType =
  (typeof CountyActivityGridRowType)[keyof typeof CountyActivityGridRowType]

/** Add / edit modal for county activity code. */
export const CountyActivityAddPageMode = {
  ADD: "add",
  EDIT: "edit",
} as const

export type CountyActivityAddPageMode =
  (typeof CountyActivityAddPageMode)[keyof typeof CountyActivityAddPageMode]

/** Master activity-code type tab labels (matches county primary “Code Type” select). */
export const CountyActivityMasterCodeTypeOptions = [
  "CDSS",
  "FFP",
  "INTERNAL",
  "MAA",
  "TCM",
] as const

export type CountyActivityMasterCodeTypeOption =
  (typeof CountyActivityMasterCodeTypeOptions)[number]

/** Default catalog `match` when empty / invalid (aligned with master-code form). */
export const CountyActivityCatalogMatchDefault = {
  NONE: "N",
} as const

/** Table pagination page-size options. */
export const CountyActivityTablePageSizeOptions = [10, 20, 30, 50] as const

export type CountyActivityTablePageSizeOption =
  (typeof CountyActivityTablePageSizeOptions)[number]
