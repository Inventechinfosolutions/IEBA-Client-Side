/** Placeholder enums for Personal Time Study — extend when wiring APIs. */
export const PersonalTimeStudyViewMode = {
  LIST: "list",
  DETAIL: "detail",
} as const

export type PersonalTimeStudyViewMode =
  (typeof PersonalTimeStudyViewMode)[keyof typeof PersonalTimeStudyViewMode]
