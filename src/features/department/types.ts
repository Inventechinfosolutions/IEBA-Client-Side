import type { z } from "zod"
import { 
  departmentSchema, 
  departmentFilterSchema, 
  departmentUpsertSchema,
  departmentContactSchema 
} from "./schemas"

export type DepartmentUpsertValues = z.infer<typeof departmentUpsertSchema>

export type DepartmentContact = z.infer<typeof departmentContactSchema>
export type Department = z.infer<typeof departmentSchema>
export type DepartmentFilter = z.infer<typeof departmentFilterSchema>

export type SortColumn = "code" | "name" | null
export type SortDirection = "asc" | "desc" | null

export const PAGE_SIZES = [10, 20, 30, 50] as const

export interface DepartmentTableProps {
  departments: Department[]
  totalItems: number
  isLoading: boolean
  pagination: {
    pageIndex: number
    pageSize: number
  }
  filters: DepartmentFilter
  onSearchChange: (search: string) => void
  onInactiveChange: (inactive: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onAdd: () => void
  onEdit?: (id: string) => void
}

export interface DepartmentAddPageProps {
  id: string | null
  onClose: () => void
}

export type ActiveTab = "details" | "settings"
export type DetailsTab = "address" | "primary" | "secondary" | "billing"

export type PendingTabChange = 
  | { type: 'active'; value: ActiveTab }
  | { type: 'details'; value: DetailsTab }

export type ModifiedContacts = Record<DetailsTab, boolean>

export type HandleTabChange = (value: string) => Promise<void>
export type HandleDetailsTabChange = (tabId: DetailsTab) => void

export interface DetailTabConfig {
  id: DetailsTab
  label: string
  width: string
}

export const DETAIL_TABS: readonly DetailTabConfig[] = [
  { id: "address", label: "Address", width: "160px" },
  { id: "primary", label: "Primary Contact", width: "214px" },
  { id: "secondary", label: "Secondary Contact", width: "214px" },
  { id: "billing", label: "Billing Contact", width: "214px" },
] as const
