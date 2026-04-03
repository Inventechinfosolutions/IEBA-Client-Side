import { z } from "zod"
import type React from "react"
import type { UseFormReturn } from "react-hook-form"

import { programFormSchema } from "./schemas.ts"
export type {
  BudgetProgramTypeEnum,
  BudgetProgramStatusEnum,
  TimeStudyProgramMultiCodeTypeEnum,
} from "./enums/enums.ts"

export type ProgramFormMode = "add" | "edit"
export type ProgramSortKey = "code" | "name"
export type SortDirection = "asc" | "desc"
export type ProgramFormSection = "Budget Unit" | "BU Program" | "BU Sub-Program"
export type ProgramTab =
  | "Budget Units"
  | "Time Study programs"
  | "Program Activity Relation"

export type ProgramFormValues = z.infer<typeof programFormSchema>

export type ProgramRow = {
  id: string
  tab: ProgramTab
  code: string
  name: string
  medicalPct: string
  description: string
  department: string
  active: boolean
  parentBudgetUnitName?: string
  parentProgramName?: string
  parentProgramCode?: string
  hierarchyLevel?: 0 | 1 | 2 | 3
  parentId?: string
  type?: string
  timeStudyBudgetProgramId?: string
  costAllocation?: boolean
  isMultiCode?: boolean
}

export type GetProgramsParams = {
  tab: ProgramTab
  page: number
  pageSize: number
  search: string
  inactiveOnly: boolean
}

export type ProgramListResponse = {
  items: ProgramRow[]
  totalItems: number
}

export type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

export type PaginationMeta = {
  totalItems?: number
  totalPages?: number
  currentPage?: number
  itemsPerPage?: number
  itemCount?: number
}

export type BudgetUnitDepartmentResDto = {
  id?: number
  code?: string
  name?: string
  status?: unknown
}

export type BudgetUnitResDto = {
  id?: number
  code?: string
  name?: string | null
  description?: string | null
  status?: unknown
  medicalpercent?: string | null
  department?: BudgetUnitDepartmentResDto | null
}

export type BudgetUnitListResponseDto = {
  data?: BudgetUnitResDto[]
  meta?: PaginationMeta
}

export type BudgetProgramBudgetUnitResDto = {
  id?: number
  code?: string
  name?: string | null
  status?: unknown
}

export type BudgetProgramDepartmentResDto = {
  id?: number
  code?: string
  name?: string
  status?: unknown
}

export type BudgetProgramResDto = {
  id?: number
  code?: string
  name?: string | null
  description?: string | null
  status?: unknown
  type?: unknown
  medicalpercent?: string | null
  budgetUnit?: BudgetProgramBudgetUnitResDto | null
  department?: BudgetProgramDepartmentResDto | null
  parentId?: number | null
}

export type TimeStudyProgramBudgetProgramResDto = {
  id?: number
  code?: string
  name?: string | null
  status?: unknown
}

export type TimeStudyProgramDepartmentResDto = {
  id?: number
  code?: string
  name?: string
  status?: unknown
}

export type TimeStudyProgramResDto = {
  id?: number
  code?: string | null
  name?: string
  status?: unknown
  type?: unknown
  codeGroupId?: number | null
  groupMaster?: boolean
  costAllocation?: boolean
  isMultiCode?: boolean
  multiCodeType?: unknown
  budgetProgram?: TimeStudyProgramBudgetProgramResDto | null
  department?: TimeStudyProgramDepartmentResDto | null
  parentId?: number | null
}

export type TimeStudyProgramListResponseDto = {
  data?: TimeStudyProgramResDto[]
  meta?: PaginationMeta
}

export type ProgramCreateLookups = {
  departmentIdByName?: Record<string, number>
  budgetUnitIdByName?: Record<string, number>
  budgetProgramIdByName?: Record<string, number>
}

export type CreatedIdResponse = {
  id: number
}

export type CreatedIdWithCodeResponse = {
  id: number
  code?: string
}

export type CreateProgramInput = {
  tab: ProgramTab
  values: ProgramFormValues
  lookups?: {
    departmentIdByName?: Record<string, number>
    budgetUnitIdByName?: Record<string, number>
    budgetProgramIdByName?: Record<string, number>
  }
}

export type UpdateProgramInput = {
  id: string
  tab: ProgramTab
  values: ProgramFormValues
  lookups?: {
    departmentIdByName?: Record<string, number>
    budgetUnitIdByName?: Record<string, number>
    budgetProgramIdByName?: Record<string, number>
  }
}

export type ProgramFormModalProps = {
  open: boolean
  mode: ProgramFormMode
  initialValues: ProgramFormValues
  hideSectionTabs?: boolean
  lockSectionTabs?: boolean
  contextTab: ProgramTab
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: ProgramFormValues) => void
}

export type ProgramFormModalHandle = {
  reset: (values: ProgramFormValues) => void
}

export type ProgramTabsProps = {
  tabs: ProgramTab[]
  activeTab: ProgramTab
  onChange: (tab: ProgramTab) => void
}

export type BudgetUnitsFormProps = {
  form: UseFormReturn<ProgramFormValues>
  activeSection: ProgramFormSection
  formMode: ProgramFormMode
  quickAddSubProgramMode?: boolean
  departmentOptions: string[]
  budgetUnitNameOptions: string[]
  budgetProgramNameOptions: string[]
  budgetProgramLookup: Record<string, { code: string; department: string }>
  budgetUnitLookup: Record<string, { code: string; department: string }>
}

export type ProgramToolbarProps = {
  activeTabLabel: string
  searchValue: string
  inactiveOnly: boolean
  onSearchChange: (value: string) => void
  onToggleInactiveOnly: () => void
  onAddProgram: () => void
}

export type TimeStudyProgramFormProps = {
  form: UseFormReturn<ProgramFormValues>
  formMode: ProgramFormMode
  activeSection: ProgramFormSection
  departmentOptions: string[]
  budgetProgramNameOptions: string[]
  budgetProgramLookup: Record<string, { code: string; department: string }>
}

export type TimeStudyFieldLabelProps = { text: string }
export type TimeStudyInputShellProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder: string
  disabled?: boolean
}
export type ProgramActivityRelationFormProps = {
  form: UseFormReturn<ProgramFormValues>
}

export type TimeStudyProgramTableProps = {
  rows: ProgramRow[]
  isLoading: boolean
  onEditRow: (row: ProgramRow) => void
  lastUpdatedRow?: ProgramRow | null
}

export type BudgetUnitTableProps = {
  rows: ProgramRow[]
  isLoading: boolean
  onEditRow: (row: ProgramRow) => void
  onAddSubProgramFromProgram?: (row: ProgramRow) => void
  lastUpdatedRow?: ProgramRow | null
  expandedBudgetUnits?: Record<string, boolean>
  setExpandedBudgetUnits?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  expandedProgramGroups?: Record<string, boolean>
  setExpandedProgramGroups?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  expandedPrograms?: Record<string, boolean>
  setExpandedPrograms?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export type ProgramTableSortState = {
  key: ProgramSortKey
  direction: SortDirection | "none"
}

export type DisplayHierarchyRow =
  | { kind: "data"; row: ProgramRow }
  | { kind: "group"; budgetUnitId: string; label: string; hierarchyLevel: number }

export type TransferItem = {
  id: string
  name: string
  code?: string
}

export type TransferPanelProps = {
  title: string
  items: TransferItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll?: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  count: number
  isActivity?: boolean
  selectedDept?: string
}

/** Nest-style envelope from `ApiResponseDto.success(result, …)`. */
export type QueryApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

export type QueryPaginationMeta = {
  totalItems?: number
  totalPages?: number
  currentPage?: number
  itemsPerPage?: number
  hasNextPage?: boolean
  itemCount?: number
}

export type DepartmentResDto = {
  id?: number
  name?: string
  status?: unknown
}

export type QueryBudgetUnitResDto = {
  id?: number
  code?: string
  name?: string
  status?: unknown
  department?: DepartmentResDto | null
}

export type TimeStudyProgramOption = {
  id?: number
  code?: string
  name?: string
  status?: unknown
  type?: string
  department?: { id?: number; name?: string } | null
}
