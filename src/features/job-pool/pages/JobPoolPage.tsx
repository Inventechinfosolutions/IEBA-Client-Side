import { useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { JobPoolFormModal } from "../components/add-pool/JobPoolFormModal"
import { JobPoolTable } from "../components/JobPoolTable"
import { JobPoolToolbar } from "../components/JobPoolToolbar"
import { useJobPoolModule } from "../hooks/useJobPoolModule"
import type {
  JobPoolFormMode,
  JobPoolFormValues,
  JobPoolRow,
} from "../types"



const emptyFormValues: JobPoolFormValues = {
  name: "",
  department: "",
  active: true,
  assignedJobClassificationIds: [],
  assignedActivityIds: [],
  assignedEmployeeIds: [],
}

const successToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
      <Check className="size-3 stroke-3" />
    </span>
  ),
  className:
    "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
}

export function JobPoolPage() {
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(10)
  const [search, setSearch]           = useState("")
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [modalMode, setModalMode]     = useState<JobPoolFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<JobPoolRow | null>(null)

  const {
    rows,
    totalItems,
    isLoading,
    isCreating,
    isUpdating,
    createJobPoolAsync,
    updateJobPoolAsync,
  } = useJobPoolModule({ page, pageSize, search, inactiveOnly })

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

  function handleEditRow(row: JobPoolRow) {
    setSelectedRow(row)
    setModalMode("edit")
    setModalOpen(true)
  }

  async function handleSave(values: JobPoolFormValues) {
    try {
      if (modalMode === "edit" && selectedRow) {
        await updateJobPoolAsync({ id: selectedRow.id, values })
        toast.success("Job Pool updated successfully", successToastOptions)
      } else {
        await createJobPoolAsync({ values })
        toast.success("Job Pool created successfully", successToastOptions)
      }
      setModalOpen(false)
      setPage(1)
    } catch (error: any) {
      toast.error(error.message || "Operation failed")
    }
  }

  const initialValues: JobPoolFormValues =
    modalMode === "edit" && selectedRow
      ? {
          name: selectedRow.name,
          department: selectedRow.department,
          active: selectedRow.active,
          assignedJobClassificationIds: selectedRow.jobClassifications.map(c => c.id),
          assignedActivityIds: selectedRow.assignedActivityIds || [], 
          assignedEmployeeIds: selectedRow.assignedEmployeeIds || [], 
        }
      : emptyFormValues


  return (
    <section
      className="font-roboto *:font-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{ zoom: 1.2, "--primary": "#6C5DD3" } as React.CSSProperties}
    >
      <div className="mt-1">
        <JobPoolToolbar
          searchValue={search}
          inactiveOnly={inactiveOnly}
          onSearchChange={handleSearchChange}
          onToggleInactiveOnly={handleToggleInactiveOnly}
          onAdd={handleAdd}
        />
        <div className="mt-[25px] mb-5">
          <JobPoolTable
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

      <JobPoolFormModal
        key={`${modalMode}-${selectedRow?.id ?? "new"}`}
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
