/** View modes for the Personal Time Study feature. */
export const PersonalTimeStudyViewMode = {
  LIST: "list",
  DETAIL: "detail",
} as const

export type PersonalTimeStudyViewMode =
  (typeof PersonalTimeStudyViewMode)[keyof typeof PersonalTimeStudyViewMode]

/** Status of a time study record. */
export const TimeStudyRecordStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  OPENED: "opened",
  NOTIFY: "notify",
  DELETED: "deleted",
} as const

export type TimeStudyRecordStatus =
  (typeof TimeStudyRecordStatus)[keyof typeof TimeStudyRecordStatus]

/** Type of a time study record (standard vs multi-code). */
export const TimeStudyRecordType = {
  NORMAL: "NORMAL",
  MULTI_CODE: "MULTI_CODE",
} as const

export type TimeStudyRecordType =
  (typeof TimeStudyRecordType)[keyof typeof TimeStudyRecordType]

/** Leave indicators used in time study. */
export const TimeStudyLeaveType = {
  APPROVED: "approved",
  WITHDRAW: "withdraw",
  NULL: "null",
} as const

export type TimeStudyLeaveType =
  (typeof TimeStudyLeaveType)[keyof typeof TimeStudyLeaveType]
