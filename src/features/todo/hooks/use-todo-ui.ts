import { useCallback, useMemo, useState } from "react"
import { TodoStatusEnum } from "../enums/todo-status.enum"
import type { TodoFormMode, TodoFormValues, TodoRow } from "../types"

const emptyFormValues: TodoFormValues = {
  title: "",
  description: "",
  status: TodoStatusEnum.NEW,
}

export function useTodoUI() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<TodoFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<TodoRow | null>(null)
  const [modalSessionId, setModalSessionId] = useState(0)
  const [titleSortState, setTitleSortState] = useState<"none" | "asc" | "desc">("none")

  // Modal Actions
  const openAddModal = useCallback(() => {
    setModalMode("add")
    setSelectedRow(null)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((row: TodoRow) => {
    setModalMode("edit")
    setSelectedRow(row)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const toggleTitleSort = useCallback(() => {
    setTitleSortState((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"))
  }, [])

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

  return {
    // Modal State
    modalOpen,
    modalMode,
    selectedRow,
    modalSessionId,
    modalInitialValues,
    setModalOpen,
    
    // Sort State
    titleSortState,
    
    // Actions
    openAddModal,
    openEditModal,
    closeModal,
    toggleTitleSort,
  }
}
