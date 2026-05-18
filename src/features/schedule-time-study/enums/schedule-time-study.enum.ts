/** Matches backend `SchedulePayPeriodGroupStatus` (`erasableSyntaxOnly`-safe). */
export const SchedulePayPeriodGroupStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  INACTIVE: "inactive",
} as const

export type SchedulePayPeriodGroupStatus =
  (typeof SchedulePayPeriodGroupStatus)[keyof typeof SchedulePayPeriodGroupStatus]

export const RmtsGroupType = {
  JobPool: "job-pool",
  User: "user",
  CostPool: "cost-pool",
} as const

export type RmtsGroupTypeValue = (typeof RmtsGroupType)[keyof typeof RmtsGroupType]

/** Backend `UserListQueryDto.method` for Schedule Time Study participant user picklist. */
export const UserListMethodScheduleTime = "scheduletime" as const

/** Backend job pool list `method` for Schedule Time Study job pool + users picklist. */
export const JobPoolUsersMethodScheduleTime = "jobpoolusersscheduletime" as const
