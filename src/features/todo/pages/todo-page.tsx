import { useMemo } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { TodoFormModal } from "../components/todo-form-modal"
import { TodoTable } from "../components/todo-table"
import { TodoToolbar } from "../components/todo-toolbar"
import { useTodoModule } from "../hooks/use-todo-module"
import { useTodoUI } from "../hooks/use-todo-ui"
import type { TodoFormValues } from "../types"

const page = 1
const pageSize = 1000

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
          <Check className="size-3 stroke-3" />
        </span>
      ),
      className:
        "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    }
  }

  const ui = useTodoUI()
  const todoModule = useTodoModule({ page, pageSize })

  const isTableLoading = todoModule.isLoading || todoModule.isCreating || todoModule.isUpdating
  const rows = useMemo(() => {
    if (ui.titleSortState === "none") return todoModule.rows

    return [...todoModule.rows].sort((a, b) => {
      const compare = a.title.localeCompare(b.title)
      return ui.titleSortState === "asc" ? compare : -compare
    })
  }, [ui.titleSortState, todoModule.rows])

  const handleSaveForm = (values: TodoFormValues) => {
    if (ui.modalMode === "edit" && ui.selectedRow) {
      todoModule.updateTodo(
        { id: ui.selectedRow.id, values },
        {
          onSuccess: () => {
            toast.success("To Do updated successfully", getToastOptions())
            ui.setModalOpen(false)
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
          ui.setModalOpen(false)
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
      <TodoToolbar onAddTodo={ui.openAddModal} />
      <TodoTable
        rows={rows}
        isLoading={isTableLoading}
        titleSortState={ui.titleSortState}
        onToggleTitleSort={ui.toggleTitleSort}
        onEditRow={ui.openEditModal}
      />
      <TodoFormModal
        key={ui.modalSessionId}
        open={ui.modalOpen}
        mode={ui.modalMode}
        todoId={ui.selectedRow?.id}
        initialValues={ui.modalInitialValues}
        isSubmitting={todoModule.isCreating || todoModule.isUpdating}
        onOpenChange={ui.setModalOpen}
        onSave={handleSaveForm}
      />
    </section>
  )
}
