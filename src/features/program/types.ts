import { z } from "zod"
import type React from "react"
import type { UseFormReturn } from "react-hook-form"

import { programFormSchema } from "./schemas.ts"

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
  hierarchyLevel?: 0 | 1 | 2 | 3
  parentId?: string
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

export type CreateProgramInput = {
  tab: ProgramTab
  values: ProgramFormValues
}

export type UpdateProgramInput = {
  id: string
  tab: ProgramTab
  values: ProgramFormValues
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
  resetRef?: React.MutableRefObject<((values: ProgramFormValues) => void) | null>
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
  isDepartmentOpen: boolean
  setIsDepartmentOpen: React.Dispatch<React.SetStateAction<boolean>>
  departmentDropdownRef: React.RefObject<HTMLDivElement | null>
  budgetUnitNameOptions: string[]
  budgetProgramNameOptions: string[]
  budgetProgramLookup: Record<string, { code: string; department: string }>
  budgetUnitLookup: Record<string, { code: string; department: string }>
  isBuNameOpen: boolean
  setIsBuNameOpen: React.Dispatch<React.SetStateAction<boolean>>
  buNameDropdownRef: React.RefObject<HTMLDivElement | null>
  isBudgetProgramOpen: boolean
  setIsBudgetProgramOpen: React.Dispatch<React.SetStateAction<boolean>>
  budgetProgramDropdownRef: React.RefObject<HTMLDivElement | null>
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
  budgetUnitNameOptions: string[]
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
export type TimeStudySelectShellProps = {
  value?: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  ariaLabel: string
  disabled?: boolean
}

export type ProgramActivityRelationFormProps = {
  form: UseFormReturn<ProgramFormValues>
}

export type TimeStudyProgramTableProps = {
  rows: ProgramRow[]
  isLoading: boolean
  onEditRow: (row: ProgramRow) => void
}

export type BudgetUnitTableProps = {
  rows: ProgramRow[]
  isLoading: boolean
  onEditRow: (row: ProgramRow) => void
  onAddSubProgramFromProgram?: (row: ProgramRow) => void
}

export type ProgramTableSortState = {
  key: ProgramSortKey
  direction: SortDirection
}

export type DisplayHierarchyRow =
  | { kind: "data"; row: ProgramRow }
  | { kind: "group"; budgetUnitId: string; label: string; hierarchyLevel: number }
