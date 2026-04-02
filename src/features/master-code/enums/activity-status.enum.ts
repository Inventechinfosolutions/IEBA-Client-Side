/** Mirrors backend `generaladmin/activity/entity/enums/activity-status.enum.ts`. */
export const ActivityStatusEnum = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type ActivityStatusEnum = (typeof ActivityStatusEnum)[keyof typeof ActivityStatusEnum]
