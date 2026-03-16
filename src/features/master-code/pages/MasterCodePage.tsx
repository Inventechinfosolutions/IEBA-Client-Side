import { useEffect, useMemo, useState } from "react"

import {
  MasterCodeFormModal,
  type MasterCodeFormMode,
  type MasterCodeFormValues,
} from "../components/MasterCodeFormModal.tsx"
import { MasterCodePagination } from "../components/MasterCodePagination.tsx"
import {
  MasterCodeTable,
  type MasterCodeRow,
} from "../components/MasterCodeTable.tsx"
import { MasterCodeTabs, type MasterCodeTab } from "../components/MasterCodeTabs.tsx"
import { MasterCodeToolbar } from "../components/MasterCodeToolbar.tsx"

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

const allRows: MasterCodeRow[] = [
  { id: "1", name: "Outreach", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "2", name: "SPMP Administrative Medical Case Management", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "3", name: "SPMP Intra/Interagency Coordination, Collaboration and Administration", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "4", name: "Non-SPMP Intra/Interagency Collaboration and Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "5", name: "Program Specific Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "6", name: "SPMP Training", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "7", name: "Non-SPMP Training", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "8", name: "SPMP Program Planning and Policy Development", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "9", name: "Quality Management by Skilled Professional Medical Personnel", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "10", name: "Non-Program Specific General Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
]

export function MasterCodePage() {
  const [activeTab, setActiveTab] = useState<MasterCodeTab>("FFP")
  const [allowMultiCodes, setAllowMultiCodes] = useState(true)
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<MasterCodeFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<MasterCodeRow | null>(null)

  useEffect(() => {
    setIsTableLoading(true)
    const timer = window.setTimeout(() => {
      setIsTableLoading(false)
    }, 800)

    return () => {
      window.clearTimeout(timer)
    }
  }, [activeTab])

  const rows = useMemo(() => {
    if (inactiveOnly) {
      return allRows.filter((row) => !row.status)
    }
    return allRows
  }, [inactiveOnly])

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
    setModalOpen(true)
  }

  const handleEditRow = (row: MasterCodeRow) => {
    setModalMode("edit")
    setSelectedRow(row)
    setModalOpen(true)
  }

  const handleSaveForm = (_values: MasterCodeFormValues) => {
    // UI-only modal for pixel-parity workflow. Save wiring can be added when API is ready.
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
        onChange={setActiveTab}
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
          totalItems={rows.length}
          currentPage={page}
          pageSize={10}
          onPageChange={setPage}
        />
      </div>
      <MasterCodeFormModal
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
