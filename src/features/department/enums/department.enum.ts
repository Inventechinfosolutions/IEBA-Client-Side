/** Top-level tabs on the department add / edit dialog. */
export const DepartmentMainTab = {
  Details: "details",
  Settings: "settings",
} as const

/** Sub-tabs under Department Details (address + contact roles). */
export const DepartmentDetailsSubTab = {
  Address: "address",
  Primary: "primary",
  Secondary: "secondary",
  Billing: "billing",
} as const

/** List / filter status sent to the departments API (`?status=`). */
export const DepartmentApiRecordStatus = {
  Active: "active",
  Inactive: "inactive",
} as const

export type DepartmentApiRecordStatus =
  (typeof DepartmentApiRecordStatus)[keyof typeof DepartmentApiRecordStatus]

/** Sort order for department list queries (`?sort=`). */
export const DepartmentApiListSortOrder = {
  Asc: "ASC",
  Desc: "DESC",
} as const

export type DepartmentApiListSortOrder =
  (typeof DepartmentApiListSortOrder)[keyof typeof DepartmentApiListSortOrder]
