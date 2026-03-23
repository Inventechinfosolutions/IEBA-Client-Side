import { z } from "zod"

import { masterCodeFormSchema } from "./schemas"

export type MasterCodeFormMode = "add" | "edit"

export type MasterCodeFormValues = z.infer<typeof masterCodeFormSchema>

export type MasterCodeRow = {
  id: string
  code?: string
  name: string
  spmp: boolean
  allocable: boolean
  ffpPercent: string
  match: "E" | "N"
  status: boolean
  activityDescription?: string
}

export type GetMasterCodesParams = {
  codeType: string
  page: number
  pageSize: number
  inactiveOnly: boolean
}

export type MasterCodeListResponse = {
  items: MasterCodeRow[]
  totalItems: number
}

export type CreateMasterCodeInput = {
  codeType: string
  values: MasterCodeFormValues
}

export type UpdateMasterCodeInput = {
  id: string
  codeType: string
  values: MasterCodeFormValues
}

export type MasterCodeTab = "FFP" | "MAA" | "TCM" | "INTERNAL" | "CDSS"

export type ActiveTools = {
  bold: boolean
  italic: boolean
  bullet: boolean
}

export type MasterCodeFormModalProps = {
  codeType: string
  open: boolean
  mode: MasterCodeFormMode
  initialValues: MasterCodeFormValues
  onOpenChange: (open: boolean) => void
  onSave: (values: MasterCodeFormValues) => void
}
