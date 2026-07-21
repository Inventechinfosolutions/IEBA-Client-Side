import { useState, useRef } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { guardNoChanges, getChangedFields } from "@/lib/formGuard"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePermissions } from "@/hooks/usePermissions"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { JobPoolFormModal } from "../components/add-pool/JobPoolFormModal"
import { JobPoolTable } from "../components/JobPoolTable"
import { JobPoolToolbar } from "../components/JobPoolToolbar"
import { JobPoolHistoryTable } from "../components/JobPoolHistoryTable"
import { useJobPoolModule } from "../hooks/useJobPoolModule"
import { useGetJobPoolById } from "../queries/getJobPoolById"
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
  const [historySearch, setHistorySearch] = useState("")
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [modalMode, setModalMode]     = useState<JobPoolFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<JobPoolRow | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyJobPool, setHistoryJobPool] = useState<JobPoolRow | null>(null)
  const formRef = useRef<any>(null)

  const { isDepartmentAdmin, assignedDepartmentIds, canView } = usePermissions()
  const canViewJobPool = canView("jobpool")
  const deptFilter = isDepartmentAdmin ? assignedDepartmentIds.join(",") : undefined

  const {
    rows,
    totalItems,
    isLoading,
    isCreating,
    isUpdating,
    createJobPoolAsync,
    updateJobPoolAsync,
  } = useJobPoolModule({ page, pageSize, search, inactiveOnly, departmentId: deptFilter })

  const { data: fetchedJobPool, isFetching: isFetchingDetail, refetch } = useGetJobPoolById(
    modalMode === "edit" && modalOpen && selectedRow ? selectedRow.id : undefined
  )

  function handleSearchChange(value: string) {
    if (showHistory) {
      setHistorySearch(value)
    } else {
      setSearch(value)
      setPage(1)
    }
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

  function handleHistoryRow(row: JobPoolRow) {
    setHistoryJobPool(row)
    setHistoryDialogOpen(true)
  }

  async function handleSave(values: JobPoolFormValues) {
    try {
      if (modalMode === "edit" && selectedRow) {
        if (guardNoChanges(values, initialValues)) {
          return
        }
        const changedFields = getChangedFields(values, initialValues)
        await updateJobPoolAsync({ id: selectedRow.id, values: changedFields })
        toast.success("Job Pool updated successfully", successToastOptions)
      } else {
        await createJobPoolAsync({ values })
        toast.success("Job Pool created successfully", successToastOptions)
        setPage(1)
      }
      setModalOpen(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Operation failed"
      toast.error(message)
      if (modalMode === "edit" && selectedRow) {
        await refetch()
        formRef.current?.reset()
      }
    }
  }

  const sourceRow = modalMode === "edit" ? (fetchedJobPool || selectedRow) : null
  const initialValues: JobPoolFormValues =
    modalMode === "edit" && sourceRow
      ? {
          name: sourceRow.name,
          // Prefer raw department id when available so dependent lookups (job classifications)
          // can correctly call APIs that expect `departmentId`.
          department: sourceRow.departmentId ?? sourceRow.department,
          active: sourceRow.active,
          assignedJobClassificationIds: sourceRow.assignedJobClassificationIds || sourceRow.jobClassifications.map(c => c.id),
          assignedActivityIds: sourceRow.assignedActivityIds || [], 
          assignedEmployeeIds: sourceRow.assignedEmployeeIds || [], 
        }
      : emptyFormValues


  return (
    <section
      className="font-roboto *:font-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{ zoom: 1.2, "--primary": "#6C5DD3" } as React.CSSProperties}
    >
      <div className="mt-1">
        <JobPoolToolbar
          searchValue={showHistory ? historySearch : search}
          inactiveOnly={inactiveOnly}
          onSearchChange={handleSearchChange}
          onToggleInactiveOnly={handleToggleInactiveOnly}
          onAdd={handleAdd}
          showHistory={showHistory}
          onToggleHistory={() => {
            setShowHistory((prev) => {
              if (prev) setHistorySearch("")
              return !prev
            })
          }}
        />
        {showHistory ? (
          <div className="mt-[25px]">
            <JobPoolHistoryTable assignmentKind={historySearch} />
          </div>
        ) : (
          <>
            <div className="mt-[25px] mb-5">
              <JobPoolTable
                rows={rows}
                isLoading={isLoading}
                onEditRow={handleEditRow}
                onHistoryRow={canViewJobPool ? handleHistoryRow : undefined}
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
          </>
        )}
      </div>

      {modalOpen && (
        <JobPoolFormModal
          key={`${modalMode}-${selectedRow?.id ?? "new"}`}
          open={modalOpen}
          mode={modalMode}
          initialValues={initialValues}
          isSubmitting={isCreating || isUpdating}
          isLoadingDetails={isFetchingDetail}
          onOpenChange={setModalOpen}
          onSave={handleSave}
          formRef={formRef}
          assignedActivityDetails={sourceRow?.assignedActivityDetails}
          unassignedActivityDetails={sourceRow?.unassignedActivityDetails}
          assignedJobClassificationDetails={sourceRow?.assignedJobClassificationDetails}
          unassignedJobClassificationDetails={sourceRow?.unassignedJobClassificationDetails}
          assignedUserDetails={sourceRow?.assignedUserDetails}
          unassignedUserDetails={sourceRow?.unassignedUserDetails}
          assigned={sourceRow?.assigned}
          assignedToOtherPoolsInDept={sourceRow?.assignedToOtherPoolsInDept}
          unassigned={sourceRow?.unassigned}
          departmentName={sourceRow?.departmentName}
        />
      )}

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-[980px] overflow-hidden rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#09090b] p-0 shadow-2xl">
          <DialogHeader className="border-b border-[#E5E7EB] dark:border-[#27272a] bg-[#FAFAFC] dark:bg-[#18181b] px-6 py-4 text-left">
            <DialogTitle className="text-[18px] font-[600] text-[#111827] dark:text-[#f4f4f5]">
              Job Pool History
            </DialogTitle>
            {historyJobPool?.name ? (
              <p className="text-[13px] text-[#6B7280] dark:text-[#a1a1aa]">{historyJobPool.name}</p>
            ) : null}
          </DialogHeader>
          <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-4 bg-white dark:bg-[#09090b]">
            {historyDialogOpen && historyJobPool?.id ? (
              <JobPoolHistoryTable jobPoolId={historyJobPool.id} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default JobPoolPage



