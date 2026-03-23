import { z } from "zod"

import { userModuleFormSchema } from "@/features/user/schemas"

export type UserModuleFormMode = "add" | "edit"
export type UserFormTab = "employee" | "security" | "supervisor" | "timeStudy"

export type UserModuleFormValues = z.infer<typeof userModuleFormSchema>

export type UserModuleRow = {
  id: string
  employee: string
  employeeNo?: string
  positionNo?: string
  location?: string
  firstName?: string
  lastName?: string
  phone?: string
  loginId?: string
  password?: string
  emailAddress?: string
  jobClassification?: string
  claimingUnit?: string
  multilingual?: boolean
  allowMultiCodes?: boolean
  pkiUser?: boolean
  department: string
  roleAssignments?: string[]
  supervisorPrimary: string
  supervisorSecondary?: string
  spmp: boolean
  tsMinDay: string
  programs: boolean
  activities: boolean
  supervisorApportioning: boolean
  multicodesEnabled: boolean
  assignedMultiCodes: string
  active: boolean
}

export type GetUserModuleParams = {
  page: number
  pageSize: number
  inactiveOnly: boolean
}

export type UserModuleListResponse = {
  items: UserModuleRow[]
  totalItems: number
}

export type CreateUserModuleInput = {
  values: UserModuleFormValues
}

export type UpdateUserModuleInput = {
  id: string
  values: UserModuleFormValues
}

export type UserFormPanelProps = {
  mode: UserModuleFormMode
  initialValues: UserModuleFormValues
  onCancel: () => void
  onSave: (values: UserModuleFormValues) => void
}
