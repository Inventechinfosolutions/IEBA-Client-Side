import { z } from "zod"

import { TodoStatusEnum } from "./enums/todo-status.enum"
import { todoFormSchema } from "./schemas"

export type TodoFormMode = "add" | "edit"
export type TodoSortKey = "title" | "description" | "createdDate" | "completedDate" | "status"
export type SortDirection = "asc" | "desc"

/** Same values as backend `TodoStatusEnum`; alias kept for readable prop types. */
export type TodoStatus = TodoStatusEnum

export const TODO_STATUS_LABEL: Record<TodoStatusEnum, string> = {
  [TodoStatusEnum.NEW]: "New",
  [TodoStatusEnum.INPROGRESS]: "In progress",
  [TodoStatusEnum.COMPLETED]: "Completed",
}

export const TODO_STATUS_OPTIONS: TodoStatusEnum[] = [
  TodoStatusEnum.NEW,
  TodoStatusEnum.INPROGRESS,
  TodoStatusEnum.COMPLETED,
]

export type TodoFormValues = z.infer<typeof todoFormSchema>

export type TodoRow = {
  id: string
  title: string
  description: string
  createdDate: string
  completedDate: string
  status: TodoStatusEnum
}

export type GetTodosParams = {
  page: number
  pageSize: number
}

export type TodoListResponse = {
  items: TodoRow[]
  totalItems: number
}

export type CreateTodoInput = {
  values: TodoFormValues
}

export type UpdateTodoInput = {
  id: string
  values: TodoFormValues
}

export type TodoFormModalProps = {
  open: boolean
  mode: TodoFormMode
  initialValues: TodoFormValues
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: TodoFormValues) => void
}

export type TodoTableProps = {
  rows: TodoRow[]
  isLoading: boolean
  titleSortState: "none" | "asc" | "desc"
  onToggleTitleSort: () => void
  onEditRow: (row: TodoRow) => void
}

export type TodoToolbarProps = {
  onAddTodo: () => void
}

export type TodoPaginationProps = {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
}
