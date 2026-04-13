export const PayrollFrequency = {
  BI_WEEKLY: "biweekly",
  MONTHLY: "monthly",
  SEMI_MONTHLY: "semimontly",
  WEEKLY: "weekly",
} as const

export const PayrollFrequencyLabel = {
  [PayrollFrequency.BI_WEEKLY]: "Bi Weekly",
  [PayrollFrequency.MONTHLY]: "Monthly",
  [PayrollFrequency.SEMI_MONTHLY]: "Semi Monthly",
  [PayrollFrequency.WEEKLY]: "Weekly",
} as const

export const PAYROLL_FREQUENCY_OPTIONS = [
  { value: PayrollFrequency.BI_WEEKLY, label: PayrollFrequencyLabel[PayrollFrequency.BI_WEEKLY] },
  { value: PayrollFrequency.SEMI_MONTHLY, label: PayrollFrequencyLabel[PayrollFrequency.SEMI_MONTHLY] },
  { value: PayrollFrequency.MONTHLY, label: PayrollFrequencyLabel[PayrollFrequency.MONTHLY] },
  { value: PayrollFrequency.WEEKLY, label: PayrollFrequencyLabel[PayrollFrequency.WEEKLY] },
]

export type PayrollFrequencyType = (typeof PayrollFrequency)[keyof typeof PayrollFrequency]
