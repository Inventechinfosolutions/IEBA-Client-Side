import { useMemo, useState } from "react"
import { toast } from "sonner"

import { MasterCodeFormModal } from "../components/MasterCodeFormModal.tsx"
import { MasterCodePagination } from "../components/MasterCodePagination.tsx"
import { MasterCodeTable } from "../components/MasterCodeTable.tsx"
import { MasterCodeTabs } from "../components/MasterCodeTabs.tsx"
import { MasterCodeToolbar } from "../components/MasterCodeToolbar.tsx"
import { useMasterCodes } from "../hooks/useMasterCodes"
import {
  type MasterCodeFormMode,
  type MasterCodeFormValues,
  type MasterCodeRow,
  type MasterCodeTab,
} from "../types"

const tabs: MasterCodeTab[] = ["FFP", "MAA", "TCM", "INTERNAL", "CDSS"]
const pageSize = 10

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
  const [activeTab, setActiveTab] = useState<MasterCodeTab>("FFP")
  const [allowMultiCodes, setAllowMultiCodes] = useState(true)
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [page, setPage] = useState(1)
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
        code: selectedRow.id,
        name: selectedRow.name,
        ffpPercent: selectedRow.ffpPercent,
        match: selectedRow.match,
        spmp: selectedRow.spmp,
        allocable: selectedRow.allocable,
        active: selectedRow.status,
        activityDescription:
          "This function code is to be used by all staff (SPMP and Non-SPMP) when performing activities that inform Medi-Cal eligible or potentially eligible individuals, as well as other clients, about health services covered by Medi-Cal and how to access the health programs.",
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
          onSuccess: () => toast.success(`${activeTab} updated successfully`),
          onError: (error) => toast.error(error.message),
        }
      )
      return
    }

    masterCodes.createMasterCode(
      { codeType: activeTab, values },
      {
        onSuccess: () => toast.success(`${activeTab} created successfully`),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <section
      className="w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{
        zoom: 1.2,
        "--primary": "#6554C0",
      } as React.CSSProperties}
    >
      <MasterCodeTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
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
