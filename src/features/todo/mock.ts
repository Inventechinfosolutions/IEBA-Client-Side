import type {
  CreateTodoInput,
  GetTodosParams,
  TodoListResponse,
  TodoRow,
  UpdateTodoInput,
} from "./types"

const MOCK_DELAY_MS = 250

function seedInitialTodosIfEmpty() {
  if (todoRows.length > 0) return

  const now = new Date()

  const initial: TodoRow[] = [
    {
      id: crypto.randomUUID(),
      title: "Test 01",
      description: "Test data",
      createdDate: formatDate(now),
      completedDate: formatDate(now),
      status: "New",
    },
    {
      id: crypto.randomUUID(),
      title: "Test 02",
      description: "Test data",
      createdDate: formatDate(now),
      completedDate: formatDate(now),
      status: "In progress",
    },
    {
      id: crypto.randomUUID(),
      title: "Test 03",
      description: "Test data",
      createdDate: formatDate(now),
      completedDate: formatDate(now),
      status: "Completed",
    },
    {
      id: crypto.randomUUID(),
      title: "Test 04",
      description: "Test data",
      createdDate: formatDate(now),
      completedDate: formatDate(now),
      status: "New",
    },
    {
      id: crypto.randomUUID(),
      title: "Test 05",
      description: "Test data",
      createdDate: formatDate(now),
      completedDate: formatDate(now),
      status: "In progress",
    },
  ]

  todoRows = initial
}

let todoRows: TodoRow[] = []
seedInitialTodosIfEmpty()

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function toRow(input: CreateTodoInput["values"]): TodoRow {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    createdDate: formatDate(new Date()),
    completedDate: "",
    status: input.status,
  }
}

function seedMoreTodosIfFirstCreate() {
  // Requirement: after the first created item, seed total list with 5 mock rows.
  if (todoRows.length !== 1) return
  if (todoRows.some((row) => row.title.startsWith("Mock To Do"))) return

  const seeded: TodoRow[] = Array.from({ length: 4 }, (_, index) => {
    const title = `Mock To Do ${index + 1}`
    const status: TodoRow["status"] =
      index === 0 ? "New" : index === 1 ? "In progress" : index === 2 ? "Completed" : "In progress"
    return {
      id: crypto.randomUUID(),
      title,
      description: "Test data",
      createdDate: formatDate(new Date()),
      completedDate: formatDate(new Date()),
      status,
    }
  })

  todoRows = [...todoRows, ...seeded]
}

export async function getMockTodos(params: GetTodosParams): Promise<TodoListResponse> {
  await wait(MOCK_DELAY_MS)
  seedMoreTodosIfFirstCreate()

  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize
  return {
    items: todoRows.slice(start, end),
    totalItems: todoRows.length,
  }
}

export async function createMockTodo(input: CreateTodoInput): Promise<TodoRow> {
  await wait(MOCK_DELAY_MS)
  const row = toRow(input.values)
  todoRows = [row, ...todoRows]
  seedMoreTodosIfFirstCreate()
  return row
}

export async function updateMockTodo(input: UpdateTodoInput): Promise<TodoRow> {
  await wait(MOCK_DELAY_MS)
  const idx = todoRows.findIndex((row) => row.id === input.id)
  if (idx < 0) {
    throw new Error("To Do item not found")
  }
  const existing = todoRows[idx]
  const isCompleted = input.values.status === "Completed"
  const updated: TodoRow = {
    ...existing,
    title: input.values.title.trim(),
    description: input.values.description?.trim() ?? "",
    status: input.values.status,
    completedDate:
      isCompleted && !existing.completedDate ? formatDate(new Date()) : existing.completedDate,
  }
  todoRows = [...todoRows.slice(0, idx), updated, ...todoRows.slice(idx + 1)]
  return updated
}
