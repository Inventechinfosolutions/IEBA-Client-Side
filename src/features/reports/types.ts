import type { Control, Path } from "react-hook-form"
import { z } from "zod"

import {
  reportDownloadTypeSchema,
  reportFormSchema,
  reportQuarterSchema,
} from "./schemas"

export type ReportFormValues = z.infer<typeof reportFormSchema>

export type ReportQuarter = z.infer<typeof reportQuarterSchema>

export type ReportDownloadType = z.infer<typeof reportDownloadTypeSchema>

/** Dropdown option for report definitions (from catalog query). */
export type ReportCatalogItem = {
  key: string
  label: string
}

/** Normalized payload sent to view/download APIs. */
export type ReportRunPayload = {
  reportKey: string
  selectMonthBy: "qtr" | "dates"
  fiscalYearId?: string
  quarter?: string
  dateFrom?: string
  dateTo?: string
  departmentId?: string
  /** Resolved from multi-select (comma-separated form value). */
  employeeIds?: string[]
  /** Comma-separated ids for APIs that expect a single field. */
  employeeId?: string
  activityIds?: string[]
  activityId?: string
  costPoolIds?: string[]
  costPoolId?: string
  includeActiveEmployees: boolean
  includeInactiveEmployees: boolean
  includeActiveActivities?: boolean
  includeInactiveActivities?: boolean
  includeActiveCostPools?: boolean
  includeInactiveCostPools?: boolean
  includeUnapprovedTime: boolean
  downloadType: ReportDownloadType
  fileName?: string
}

/** Mock catalog row with active/inactive filtering. */
export type ReportMockActiveRow = {
  id: string
  label: string
  active: boolean
}

export type ReportMockFiscalYear = {
  id: string
  label: string
}

export type ReportMockDepartment = {
  id: string
  label: string
}

/** Single-value dropdown option used by report form selects. */
export type ReportSelectOption = {
  value: string
  label: string
}

export type ReportSecondaryLayout = "employee" | "employee-activities" | "cost-pool-employee"

export type ReportEmployeeMultiSelectProps = {
  value: string
  onChange: (next: string) => void
  onBlur: () => void
  options: readonly ReportSelectOption[]
  placeholder: string
  disabled?: boolean
  maxVisibleItems?: number
  className?: string
  emptyListMessage?: string
}

export type ReportSecondaryPickBlockProps = {
  control: Control<ReportFormValues>
  title: string
  activeLabel: string
  inactiveLabel: string
  activeField: Path<ReportFormValues>
  inactiveField: Path<ReportFormValues>
  idsField: Path<ReportFormValues>
  options: readonly ReportSelectOption[]
  placeholder: string
  emptyListMessage: string
  maxVisibleChips?: number
}
