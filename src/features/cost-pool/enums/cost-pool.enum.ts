
export const CostPoolStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type CostPoolStatus = (typeof CostPoolStatus)[keyof typeof CostPoolStatus]


export const CostPoolUpsertMode = {
  ADD: "add",
  EDIT: "edit",
} as const

export type CostPoolUpsertMode =
  (typeof CostPoolUpsertMode)[keyof typeof CostPoolUpsertMode]


export const CostPoolActivityAssignmentStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type CostPoolActivityAssignmentStatus =
  (typeof CostPoolActivityAssignmentStatus)[keyof typeof CostPoolActivityAssignmentStatus]


export const CostPoolRequestMethod = {
  FETCH_CP_ASSIGNED_ACTIVITIES: "fetchcpassignedactivities",
} as const

export type CostPoolRequestMethod =
  (typeof CostPoolRequestMethod)[keyof typeof CostPoolRequestMethod]
