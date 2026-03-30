import { API_BASE_URL } from "@/lib/config"

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

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as any
      message = data?.message || data?.error || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
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
  const url = new URL(`${API_BASE_URL}/todos`, window.location.origin)
  if (params.page) url.searchParams.set("page", String(params.page))
  if (params.pageSize) url.searchParams.set("limit", String(Math.min(100, params.pageSize)))
  const raw = await fetchJson<any>(url)
  // Backend wraps in ApiResponseDto { data, message, ... }
  return normalizeTodoListResponse(raw?.data ?? raw)
}

export async function apiCreateTodo(input: {
  title: string
  description: string
  userId?: string
  status: TodoStatusEnum
}) {
  const raw = await fetchJson<any>(`${API_BASE_URL}/todos`, {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      userId: input.userId,
      status: input.status,
    }),
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
  const raw = await fetchJson<any>(`${API_BASE_URL}/todos/${encodeURIComponent(input.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      userId: input.userId,
      status: input.status,
    }),
  })
  return normalizeTodoRow(raw)
}

