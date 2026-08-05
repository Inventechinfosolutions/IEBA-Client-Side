import { api } from "@/lib/api"

/**
 * Notification type enum — mirrors the backend DepartmentNotificationType.
 */
export const DepartmentNotificationType = {
  TIME_STUDY_1_WEEK_BEFORE: "TIME_STUDY_1_WEEK_BEFORE",
  TIME_STUDY_DAY_OF_START: "TIME_STUDY_DAY_OF_START",
  TIME_STUDY_END_NOT_SUBMITTED: "TIME_STUDY_END_NOT_SUBMITTED",
  TIME_STUDY_POST_CLOSE_REMINDER: "TIME_STUDY_POST_CLOSE_REMINDER",
  DAILY_TIME_STUDY_WEEKLY_REMINDER: "DAILY_TIME_STUDY_WEEKLY_REMINDER",
  SUPERVISOR_APPROVAL_NEEDED: "SUPERVISOR_APPROVAL_NEEDED",
} as const

export type DepartmentNotificationType =
  (typeof DepartmentNotificationType)[keyof typeof DepartmentNotificationType]

/**
 * Human-readable labels for each notification type.
 */
export const NOTIFICATION_TYPE_LABELS: Record<DepartmentNotificationType, string> = {
  [DepartmentNotificationType.TIME_STUDY_1_WEEK_BEFORE]: "1-Week Before Time Study Start",
  [DepartmentNotificationType.TIME_STUDY_DAY_OF_START]: "Day of Time Study Start",
  [DepartmentNotificationType.TIME_STUDY_END_NOT_SUBMITTED]: "End of Time Study (Not Submitted)",
  [DepartmentNotificationType.TIME_STUDY_POST_CLOSE_REMINDER]: "Post-Close Reminder (Every Other Day)",
  [DepartmentNotificationType.DAILY_TIME_STUDY_WEEKLY_REMINDER]: "Daily Time Study Weekly Reminder",
  [DepartmentNotificationType.SUPERVISOR_APPROVAL_NEEDED]: "Supervisor Approval After Submission",
}

/**
 * All notification types in display order.
 */
export const ALL_NOTIFICATION_TYPES: DepartmentNotificationType[] = [
  DepartmentNotificationType.TIME_STUDY_1_WEEK_BEFORE,
  DepartmentNotificationType.TIME_STUDY_DAY_OF_START,
  DepartmentNotificationType.TIME_STUDY_END_NOT_SUBMITTED,
  DepartmentNotificationType.TIME_STUDY_POST_CLOSE_REMINDER,
  DepartmentNotificationType.DAILY_TIME_STUDY_WEEKLY_REMINDER,
  DepartmentNotificationType.SUPERVISOR_APPROVAL_NEEDED,
]

export interface DepartmentNotificationConfigItem {
  id?: number
  departmentId: number
  notificationType: DepartmentNotificationType
  emailEnabled: boolean
  inAppEnabled: boolean
  active: boolean
}

export interface DepartmentNotificationConfigResponse {
  success: boolean
  message: string
  data: DepartmentNotificationConfigItem[]
}

/**
 * Fetch notification config for a department.
 */
export async function getDepartmentNotificationConfig(
  departmentId: string | number,
): Promise<DepartmentNotificationConfigResponse> {
  return api.get<DepartmentNotificationConfigResponse>(
    `/departments/${departmentId}/notification-config`,
  )
}

/**
 * Save notification config for a department.
 */
export async function updateDepartmentNotificationConfig(
  departmentId: string | number,
  configs: Array<{
    notificationType: DepartmentNotificationType
    emailEnabled: boolean
    inAppEnabled: boolean
    active: boolean
  }>,
): Promise<DepartmentNotificationConfigResponse> {
  return api.put<DepartmentNotificationConfigResponse>(
    `/departments/${departmentId}/notification-config`,
    { configs },
  )
}
