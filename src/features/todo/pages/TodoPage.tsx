import { useMemo, useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { TodoFormModal } from "../components/TodoFormModal"
import { TodoTable } from "../components/TodoTable"
import { TodoToolbar } from "../components/TodoToolbar"
import { useTodoModule } from "../hooks/useTodoModule"
import { useTodoUI } from "../hooks/useTodoUi"
import type { TodoFormValues } from "../types"
import { useAuth } from "@/contexts/AuthContext"

export function TodoPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ""
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const todoModule = useTodoModule({ page, pageSize, userId })

  const isTableLoading = todoModule.isLoading || todoModule.isCreating || todoModule.isUpdating
  const rows = useMemo(() => {
    if (ui.titleSortState === "none") return todoModule.rows.slice(0, pageSize)

    return [...todoModule.rows]
      .sort((a, b) => {
      const compare = a.title.localeCompare(b.title)
      return ui.titleSortState === "asc" ? compare : -compare
      })
      .slice(0, pageSize)
  }, [pageSize, ui.titleSortState, todoModule.rows])

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
        footer={
          <MasterCodePagination
            totalItems={todoModule.totalItems}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={(next) => setPage(next)}
            onPageSizeChange={(nextSize) => {
              setPage(1)
              setPageSize(nextSize)
            }}
          />
        }
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
