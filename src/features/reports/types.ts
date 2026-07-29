import type { Control, Path, UseFormSetValue } from "react-hook-form"
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
  criteria?: {
    monthly?: boolean
    multipleEmployees?: boolean
    showProgramSelect?: boolean
    showActivitySelect?: boolean
    showCostPoolSelect?: boolean
    showCostPool?: boolean
    showDepartmentSelect?: boolean
    showFiscalYearSelect?: boolean
    showFiscalYear?: boolean
    showQuarterSelect?: boolean
    showYear?: boolean
    showDate?: boolean
    showWeekSelect?: boolean
    showEmployeeFirst?: boolean
    filterProgramsByUser?: boolean
    showMonthBy?: { type: string }[]
    showmasterCodes?: boolean
    showDates?: boolean
    showMonthly?: boolean
    showQtr?: boolean
    /** MCAH-style Week 1 start/end (replaces Quarter for payroll-aligned monthly weeks). */
    showWeek?: boolean
    showTimeStudy?: boolean
    showScheduleTime?: boolean
  }
}

/** Normalized payload sent to view/download APIs. */
export type ReportRunPayload = {
  reportKey: string
  selectMonthBy: "qtr" | "dates" | "month" | "year" | "scheduled" | "week"
  month?: string
  year?: string
  weekId?: string
  fiscalYearId?: string
  quarter?: string
  dateFrom?: string
  dateTo?: string
  departmentId?: string
  masterCode?: string
  /** Resolved from multi-select (comma-separated form value). */
  employeeIds?: string[]
  /** Comma-separated ids for APIs that expect a single field. */
  employeeId?: string
  activityIds?: string[]
  activityId?: string
  costPoolIds?: string[]
  costPoolId?: string
  programIds?: string[]
  programId?: string
  includeActiveEmployees: boolean
  includeInactiveEmployees: boolean
  includeActiveActivities?: boolean
  includeInactiveActivities?: boolean
  includeActiveCostPools?: boolean
  includeInactiveCostPools?: boolean
  includeActivePrograms?: boolean
  includeInactivePrograms?: boolean
  includeUnapprovedTime: boolean
  downloadType: ReportDownloadType
  fileName?: string
  maaTcmReportingPeriodType?: string
  /** Selected payroll check date for DSSRPT5. */
  checkDateId?: string
  /** Passed to client-side PDF rendering (not sent to backend). */
  countyName?: string
  countyLogoDataUrl?: string
  /** Employee picker page the user was on when viewing/downloading. */
  employeeListPage?: number
  employeeListTotalPages?: number
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
  startDate?: string
  endDate?: string
}

export type ReportSecondaryLayout = 
  | "employee" 
  | "employee-activities" 
  | "cost-pool-employee" 
  | "program-employee"
  | "dynamic"


export type ReportEmployeeListPagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
}

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
  /** When set, list is server-paginated; Select All applies to the current page. */
  pagination?: ReportEmployeeListPagination
  /** Labels for selected values not present in the current page of `options`. */
  optionLabelByValue?: ReadonlyMap<string, string>
  /** Controlled search text for server-backed search (paginated lists). */
  searchValue?: string
  /** Called when the search box changes; when set, client-side option filtering is skipped. */
  onSearchChange?: (next: string) => void
}

export type ReportSecondaryPickBlockProps = {
  control: Control<ReportFormValues>
  setValue: UseFormSetValue<ReportFormValues>
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
  onValuesChange?: (next: string) => void
  pagination?: ReportEmployeeListPagination
  optionLabelByValue?: ReadonlyMap<string, string>
  /** When true, keep selected ids that are not in the current `options` page. */
  retainSelectionsOutsideOptions?: boolean
  searchValue?: string
  onSearchChange?: (next: string) => void
}
