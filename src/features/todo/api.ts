import { api } from "@/lib/api"

import { TodoStatusEnum } from "./enums/todoStatus"
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
  let date: Date
  if (value instanceof Date) {
    date = value
  } else {
    const s = String(value)
    const parts = s.split("-")
    if (parts.length === 3 && !s.includes("T")) {
      // It's a YYYY-MM-DD string, parse as local midnight
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    } else {
      date = new Date(s)
    }
  }

  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function normalizeTodoRow(raw: unknown): TodoRow {
  const o = raw as Record<string, unknown>
  const status = normalizeStatus(o?.status)
  const createdAt = (o?.createdDate as string) ?? (o?.createdAt as string) ?? ""
  const completedAt =
    (o?.updatedAt as string) ?? (o?.completedDate as string) ?? (o?.completedAt as string) ?? ""
  return {
    id: String(o?.id ?? o?._id ?? ""),
    title: String(o?.title ?? ""),
    description: String(o?.description ?? ""),
    createdDate: formatDateLabel(createdAt),
    completedDate: formatDateLabel(completedAt),
    status,
  }
}

function normalizeTodoListResponse(raw: unknown): TodoListResponse {
  const o = raw as {
    data?: unknown[]
    meta?: { totalItems?: number }
    items?: unknown[]
    totalItems?: number
  }

  // Backend TodoListResponseDto: { data: TodoResDto[]; meta: { totalItems, ... } }
  if (o && Array.isArray(o.data) && o.meta && typeof o.meta.totalItems === "number") {
    return {
      items: o.data.map(normalizeTodoRow),
      totalItems: o.meta.totalItems,
    }
  }

  if (o && Array.isArray(o.items) && typeof o.totalItems === "number") {
    return {
      items: o.items.map(normalizeTodoRow),
      totalItems: o.totalItems,
    }
  }

  if (Array.isArray(raw)) {
    const items = raw.map(normalizeTodoRow)
    return { items, totalItems: items.length }
  }

  // fallback: unknown shape
  return { items: [], totalItems: 0 }
}

export async function apiGetTodos(params: { page?: number; pageSize?: number; userId: string | number }) {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.pageSize) search.set("limit", String(Math.min(100, params.pageSize)))
  search.set("userId", String(params.userId))
  const raw = await api.get<unknown>(`/todos?${search.toString()}`)
  const res = raw as { data?: unknown }
  // Backend wraps in ApiResponseDto { data, message, ... }
  return normalizeTodoListResponse(res?.data ?? raw)
}

export async function apiCreateTodo(input: {
  title: string
  description: string
  userId?: string
  status: TodoStatusEnum
}) {
  const raw = await api.post<unknown>("/todos", {
    title: input.title,
    description: input.description,
    userId: input.userId,
    status: input.status,
  })
  const res = raw as { data?: unknown }
  return normalizeTodoRow(res?.data ?? raw)
}

import { getChangedFields } from "@/utils/diff"

export async function apiUpdateTodo(input: {
  id: string
  title: string
  description: string
  userId?: string
  status: TodoStatusEnum
  initialValues?: {
    title: string
    description: string
    status: TodoStatusEnum
  }
}) {
  const currentTitle = input.title.trim()
  const currentDesc = input.description.trim()
  const currentStatus = input.status

  const currentValues = {
    title: currentTitle,
    description: currentDesc,
    status: currentStatus,
  }

  let body: Record<string, unknown> = {
    ...currentValues,
  }

  if (input.userId != null) {
    body.userId = input.userId
  }

  if (input.initialValues) {
    const initialValues = {
      title: input.initialValues.title.trim(),
      description: input.initialValues.description.trim(),
      status: input.initialValues.status,
    }

    const diff = getChangedFields(initialValues, currentValues)
    if (!diff) {
      throw new Error("No changes to save")
    }

    body = { ...diff }
    if (input.userId != null) {
      body.userId = input.userId
    }
  }

  const raw = await api.put<unknown>(`/todos/${encodeURIComponent(input.id)}`, body)
  const res = raw as { data?: unknown }
  return normalizeTodoRow(res?.data ?? raw)
}

export async function apiGetTodoById(id: string) {
  const raw = await api.get<unknown>(`/todos/${encodeURIComponent(id)}`)
  const res = raw as { data?: unknown }
  return normalizeTodoRow(res?.data ?? raw)
}

