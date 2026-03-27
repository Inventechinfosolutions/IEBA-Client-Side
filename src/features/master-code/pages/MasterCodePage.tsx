import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Check } from "lucide-react"

import { MasterCodeFormModal } from "../components/MasterCodeFormModal.tsx"
import { MasterCodePagination } from "../components/MasterCodePagination.tsx"
import { MasterCodeTable } from "../components/MasterCodeTable.tsx"
import { MasterCodeTabs } from "../components/MasterCodeTabs.tsx"
import { MasterCodeToolbar } from "../components/MasterCodeToolbar.tsx"
import { useMasterCodes } from "../hooks/useMasterCodes"
import { DEFAULT_ACTIVITY_DESCRIPTION } from "../mock"
import {
  type MasterCodeFormMode,
  type MasterCodeFormValues,
  type MasterCodeRow,
  type MasterCodeTab,
} from "../types"

const tabs: MasterCodeTab[] = ["FFP", "MAA", "TCM", "INTERNAL", "CDSS"]

const emptyFormValues: MasterCodeFormValues = {
  code: "",
  name: "",
  ffpPercent: "0.00",
  match: "",
  spmp: false,
  allocable: false,
  active: true,
  activityDescription: "",
}

export function MasterCodePage() {
  const successToastOptions = {
    position: "top-center" as const,
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-[3]" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  const [activeTab, setActiveTab] = useState<MasterCodeTab>("FFP")
  const [allowMultiCodes, setAllowMultiCodes] = useState(true)
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<MasterCodeFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<MasterCodeRow | null>(null)
  const [modalSessionId, setModalSessionId] = useState(0)

  const masterCodes = useMasterCodes({
    codeType: activeTab,
    page,
    pageSize,
    inactiveOnly,
  })
  const rows = masterCodes.rows
  const isTableLoading =
    masterCodes.isLoading || masterCodes.isCreating || masterCodes.isUpdating

  const modalInitialValues = useMemo<MasterCodeFormValues>(() => {
    if (modalMode === "edit" && selectedRow) {
      return {
        code: selectedRow.code ?? "",
        name: selectedRow.name,
        ffpPercent: selectedRow.ffpPercent,
        match: selectedRow.match,
        spmp: selectedRow.spmp,
        allocable: selectedRow.allocable,
        active: selectedRow.status,
        activityDescription:
          selectedRow.activityDescription ?? DEFAULT_ACTIVITY_DESCRIPTION,
      }
    }
    return emptyFormValues
  }, [modalMode, selectedRow])

  const handleAddFfp = () => {
    setModalMode("add")
    setSelectedRow(null)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleTabChange = (nextTab: MasterCodeTab) => {
    setActiveTab(nextTab)
    setPage(1)
  }

  const handleEditRow = (row: MasterCodeRow) => {
    setModalMode("edit")
    setSelectedRow(row)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleSaveForm = (values: MasterCodeFormValues) => {
    if (modalMode === "edit" && selectedRow) {
      masterCodes.updateMasterCode(
        { id: selectedRow.id, codeType: activeTab, values },
        {
          onSuccess: () =>
            toast.success(`${activeTab} updated successfully`, successToastOptions),
          onError: (error) => toast.error(error.message),
        }
      )
      return
    }

    masterCodes.createMasterCode(
      { codeType: activeTab, values },
      {
        onSuccess: () =>
          toast.success(`${activeTab} created successfully`, successToastOptions),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <section
      className="ieba-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      <div className="-mx-5 -mt-5 md:-mx-6 md:-mt-6">
        <MasterCodeTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </div>
      <div className="mt-5">
        <MasterCodeToolbar
          codeType={activeTab}
          allowMultiCodes={allowMultiCodes}
          inactiveOnly={inactiveOnly}
          onToggleAllowMultiCodes={() => setAllowMultiCodes((prev) => !prev)}
          onToggleInactiveOnly={() => setInactiveOnly((prev) => !prev)}
          onAddFfp={handleAddFfp}
        />
        <div className="mb-5">
          <MasterCodeTable
            codeType={activeTab}
            rows={rows}
            isLoading={isTableLoading}
            onEditRow={handleEditRow}
          />
        </div>
        <MasterCodePagination
          totalItems={masterCodes.totalItems}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      </div>
      <MasterCodeFormModal
        key={modalSessionId}
        codeType={activeTab}
        open={modalOpen}
        mode={modalMode}
        initialValues={modalInitialValues}
        onOpenChange={setModalOpen}
        onSave={handleSaveForm}
      />
    </section>
  )
}
