import { api } from "@/lib/api"

import { TodoStatusEnum } from "./enums/todo-status.enum"
import type { TodoListResponse, TodoRow } from "./types"

function normalizeStatus(status: unknown): TodoStatusEnum {
  if (
    status === TodoStatusEnum.NEW ||
    status === TodoStatusEnum.INPROGRESS ||
    status === TodoStatusEnum.COMPLETED
  ) {
    return status
  }
  return TodoStatusEnum.NEW
}

function formatDateLabel(value: unknown): string {
  if (value == null || value === "") return ""
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function normalizeTodoRow(raw: any): TodoRow {
  const status = normalizeStatus(raw?.status)
  const createdAt = raw?.createdDate ?? raw?.createdAt ?? ""
  const completedAt = raw?.updatedAt ?? raw?.completedDate ?? raw?.completedAt ?? ""
  return {
    id: String(raw?.id ?? raw?._id ?? ""),
    title: String(raw?.title ?? ""),
    description: String(raw?.description ?? ""),
    createdDate: formatDateLabel(createdAt),
    completedDate: formatDateLabel(completedAt),
    status,
  }
}

function normalizeTodoListResponse(raw: any): TodoListResponse {
  // Backend TodoListResponseDto: { data: TodoResDto[]; meta: { totalItems, ... } }
  if (raw && Array.isArray(raw.data) && raw.meta && typeof raw.meta.totalItems === "number") {
    return {
      items: raw.data.map(normalizeTodoRow),
      totalItems: raw.meta.totalItems,
    }
  }

  if (raw && Array.isArray(raw.items) && typeof raw.totalItems === "number") {
    return {
      items: raw.items.map(normalizeTodoRow),
      totalItems: raw.totalItems,
    }
  }

  if (Array.isArray(raw)) {
    const items = raw.map(normalizeTodoRow)
    return { items, totalItems: items.length }
  }

  // fallback: unknown shape
  const items: TodoRow[] = []
  return { items, totalItems: 0 }
}

export async function apiGetTodos(params: { page?: number; pageSize?: number }) {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.pageSize) search.set("limit", String(Math.min(100, params.pageSize)))
  const raw = await api.get<any>(`/todos?${search.toString()}`)
  // Backend wraps in ApiResponseDto { data, message, ... }
  return normalizeTodoListResponse(raw?.data ?? raw)
}

export async function apiCreateTodo(input: {
  title: string
  description: string
  userId?: string
  status: TodoStatusEnum
}) {
  const raw = await api.post<any>("/todos", {
    title: input.title,
    description: input.description,
    userId: input.userId,
    status: input.status,
  })
  return normalizeTodoRow(raw)
}

export async function apiUpdateTodo(input: {
  id: string
  title: string
  description: string
  userId?: string
  status: TodoStatusEnum
}) {
  const raw = await api.put<any>(`/todos/${encodeURIComponent(input.id)}`, {
    title: input.title,
    description: input.description,
    userId: input.userId,
    status: input.status,
  })
  return normalizeTodoRow(raw)
}

export async function apiGetTodoById(id: string): Promise<TodoRow> {
  const raw = await api.get<any>(`/todos/${encodeURIComponent(id)}`)
  return normalizeTodoRow(raw?.data ?? raw)
}

