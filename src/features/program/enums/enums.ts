export const BudgetProgramTypeEnum = {
  PROGRAM: "program",
  SUBPROGRAM: "subprogram",
  BU: "bu",
} as const

export type BudgetProgramTypeEnum =
  (typeof BudgetProgramTypeEnum)[keyof typeof BudgetProgramTypeEnum]

export const BudgetProgramStatusEnum = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type BudgetProgramStatusEnum =
  (typeof BudgetProgramStatusEnum)[keyof typeof BudgetProgramStatusEnum]

export const TimeStudyProgramMultiCodeTypeEnum = {
  FFP: "FFP",
  MAA: "MAA",
  TCM: "TCM",
  INTERNAL: "INTERNAL",
  CDSS: "CDSS",
  NORMAL: "NORMAL",
} as const

export type TimeStudyProgramMultiCodeTypeEnum =
  (typeof TimeStudyProgramMultiCodeTypeEnum)[keyof typeof TimeStudyProgramMultiCodeTypeEnum]

export const TimeStudyProgramTypeEnum = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  SUBPROGRAM: "subprogram",
} as const

export type TimeStudyProgramTypeEnum =
  (typeof TimeStudyProgramTypeEnum)[keyof typeof TimeStudyProgramTypeEnum]

export const TimeStudyProgramStatusEnum = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export type TimeStudyProgramStatusEnum =
  (typeof TimeStudyProgramStatusEnum)[keyof typeof TimeStudyProgramStatusEnum]

