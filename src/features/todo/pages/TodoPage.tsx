import { useMemo, useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { TodoFormModal } from "../components/TodoFormModal"
import { TodoTable } from "../components/TodoTable"
import { TodoToolbar } from "../components/TodoToolbar"
import { useTodoModule } from "../hooks/useTodoModule"
import { apiGetTodoById } from "../api"
import { TodoStatusEnum } from "../enums/todo-status.enum"
import type { TodoFormMode, TodoFormValues, TodoRow } from "../types"

const page = 1
const pageSize = 1000

const emptyFormValues: TodoFormValues = {
  title: "",
  description: "",
  status: TodoStatusEnum.NEW,
}

export function TodoPage() {
  const getToastOptions = () => {
    const bg = "#22c55e"
    return {
      position: "top-center" as const,
      icon: (
        <span
          className="inline-flex size-4 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: bg }}
        >
          <Check className="size-3 stroke-[3]" />
        </span>
      ),
      className:
        "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    }
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<TodoFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<TodoRow | null>(null)
  const [modalSessionId, setModalSessionId] = useState(0)
  const [isEditDetailLoading, setIsEditDetailLoading] = useState(false)
  const [titleSortState, setTitleSortState] = useState<"none" | "asc" | "desc">(
    "none"
  )

  const todoModule = useTodoModule({ page, pageSize })
  const isTableLoading =
    todoModule.isLoading || todoModule.isCreating || todoModule.isUpdating || isEditDetailLoading
  const rows = useMemo(() => {
    if (titleSortState === "none") return todoModule.rows

    return [...todoModule.rows].sort((a, b) => {
      const compare = a.title.localeCompare(b.title)
      return titleSortState === "asc" ? compare : -compare
    })
  }, [titleSortState, todoModule.rows])

  const modalInitialValues = useMemo<TodoFormValues>(() => {
    if (modalMode === "edit" && selectedRow) {
      return {
        title: selectedRow.title,
        description: selectedRow.description,
        status: selectedRow.status,
      }
    }
    return emptyFormValues
  }, [modalMode, selectedRow])

  const handleAddTodo = () => {
    setModalMode("add")
    setSelectedRow(null)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleEditRow = async (row: TodoRow) => {
    try {
      setIsEditDetailLoading(true)
      const fresh = await apiGetTodoById(row.id)
      setModalMode("edit")
      setSelectedRow(fresh)
      setModalSessionId((prev) => prev + 1)
      setModalOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load To Do")
    } finally {
      setIsEditDetailLoading(false)
    }
  }

  const handleSaveForm = (values: TodoFormValues) => {
    if (modalMode === "edit" && selectedRow) {
      todoModule.updateTodo(
        { id: selectedRow.id, values },
        {
          onSuccess: () => {
            toast.success("To Do updated successfully", getToastOptions())
            setModalOpen(false)
          },
          onError: (error) => toast.error(error.message),
        }
      )
      return
    }

    todoModule.createTodo(
      { values },
      {
        onSuccess: () => {
          toast.success("To Do created successfully", getToastOptions())
          setModalOpen(false)
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <section
      className="font-roboto *:font-roboto w-full"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      <TodoToolbar onAddTodo={handleAddTodo} />
      <TodoTable
        rows={rows}
        isLoading={isTableLoading}
        titleSortState={titleSortState}
        onToggleTitleSort={() => {
          setTitleSortState((prev) =>
            prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"
          )
        }}
        onEditRow={handleEditRow}
      />
      <TodoFormModal
        key={modalSessionId}
        open={modalOpen}
        mode={modalMode}
        initialValues={modalInitialValues}
        isSubmitting={todoModule.isCreating || todoModule.isUpdating}
        onOpenChange={setModalOpen}
        onSave={handleSaveForm}
      />
    </section>
  )
}
