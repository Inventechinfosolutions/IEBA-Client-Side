import { z } from "zod"

import { todoFormSchema } from "./schemas"

export type TodoFormMode = "add" | "edit"
export type TodoSortKey = "title" | "description" | "createdDate" | "completedDate" | "status"
export type SortDirection = "asc" | "desc"
export type TodoStatus = "New" | "In progress" | "Completed"

export type TodoFormValues = z.infer<typeof todoFormSchema>

export type TodoRow = {
  id: string
  title: string
  description: string
  createdDate: string
  completedDate: string
  status: TodoStatus
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
