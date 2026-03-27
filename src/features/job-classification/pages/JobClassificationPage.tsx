import { useState } from "react"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { JobClassificationFormModal } from "../components/JobClassificationFormModal"
import { JobClassificationTable } from "../components/JobClassificationTable"
import { JobClassificationToolbar } from "../components/JobClassificationToolbar"
import { useJobClassificationModule } from "../hooks/useJobClassificationModule"
import type {
  JobClassificationFormMode,
  JobClassificationFormValues,
  JobClassificationRow,
} from "../types"



const DEFAULT_FORM_VALUES: JobClassificationFormValues = {
  code: "",
  name: "",
  active: true,
}

export function JobClassificationPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<JobClassificationFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<JobClassificationRow | null>(null)

  const { rows, totalItems, isLoading, isCreating, isUpdating, createJobClassificationAsync, updateJobClassificationAsync } =
    useJobClassificationModule({ page, pageSize, search, inactiveOnly })

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleToggleInactiveOnly() {
    setInactiveOnly((prev) => !prev)
    setPage(1)
  }

  function handleAdd() {
    setSelectedRow(null)
    setModalMode("add")
    setModalOpen(true)
  }

  function handleEditRow(row: JobClassificationRow) {
    setSelectedRow(row)
    setModalMode("edit")
    setModalOpen(true)
  }

  async function handleSave(values: JobClassificationFormValues) {
    if (modalMode === "edit" && selectedRow) {
      await updateJobClassificationAsync({ id: selectedRow.id, values })
    } else {
      await createJobClassificationAsync({ values })
    }
    setPage(1)
  }

  const initialValues: JobClassificationFormValues =
    modalMode === "edit" && selectedRow
      ? { code: selectedRow.code, name: selectedRow.name, active: selectedRow.active }
      : DEFAULT_FORM_VALUES

  return (
    <section
      className="ieba-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      <div className="mt-1">
        <JobClassificationToolbar
          searchValue={search}
          inactiveOnly={inactiveOnly}
          onSearchChange={handleSearchChange}
          onToggleInactiveOnly={handleToggleInactiveOnly}
          onAdd={handleAdd}
        />
        <div className="mt-[25px] mb-5">
          <JobClassificationTable
            rows={rows}
            isLoading={isLoading}
            onEditRow={handleEditRow}
          />
        </div>
        <MasterCodePagination
          totalItems={totalItems}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      </div>

      <JobClassificationFormModal
        open={modalOpen}
        mode={modalMode}
        initialValues={initialValues}
        isSubmitting={isCreating || isUpdating}
        onOpenChange={setModalOpen}
        onSave={handleSave}
      />
    </section>
  )
}

