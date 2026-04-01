import { Check } from "lucide-react"
import { toast } from "sonner"

import { MasterCodeFormModal } from "../components/mastercode-form-modal.tsx"
import { MasterCodePagination } from "../components/mastercode-pagination.tsx"
import { MasterCodeTable } from "../components/mastercode-table.tsx"
import { MasterCodeTabs } from "../components/mastercode-tabs.tsx"
import { MasterCodeToolbar } from "../components/mastercode-toolbar.tsx"
import { useMasterCodeUI } from "../hooks/use-mastercode-ui.ts"
import { useMasterCodes } from "../hooks/use-mastercode.ts"
import type { MasterCodeFormValues } from "../types.ts"

export function MasterCodePage() {
  const successToastOptions = {
    position: "top-center" as const,
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-3" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  // 1. UI State Controller
  const ui = useMasterCodeUI()

  // 2. Data Fetching & Mutations
  const masterCodes = useMasterCodes({
    codeType: ui.activeTab,
    page: ui.currentPage,
    pageSize: ui.pageSize,
    inactiveOnly: ui.inactiveOnly,
  })

  // 3. Derived State (Matches Old Logic)
  const allowMultiCodes =
    masterCodes.selectedTenantMaster != null
      ? masterCodes.selectedTenantMaster.allowMulticode
      : ui.allowMultiCodesLocal

  const isTableLoading =
    masterCodes.isLoading ||
    masterCodes.isCreating ||
    masterCodes.isUpdating ||
    masterCodes.isTenantLoading ||
    masterCodes.isTenantUpdating

  // 4. Action Handlers
  const handleSaveForm = (values: MasterCodeFormValues) => {
    if (!ui.activeTab) return
    if (ui.modalMode === "edit" && ui.selectedRow) {
      masterCodes.updateMasterCode(
        { id: ui.selectedRow.id, codeType: ui.activeTab, values },
        {
          onSuccess: () =>
            toast.success(`${ui.activeTab} updated successfully`, successToastOptions),
          onError: (error: Error) => toast.error(error.message),
        }
      )
      return
    }

    masterCodes.createMasterCode(
      { codeType: ui.activeTab, values },
      {
        onSuccess: () =>
          toast.success(`${ui.activeTab} created successfully`, successToastOptions),
        onError: (error: Error) => toast.error(error.message),
      }
    )
  }

  const handleToggleMultiCodes = () => {
    if (masterCodes.selectedTenantMaster != null) {
      masterCodes.updateTenantMaster(
        {
          id: masterCodes.selectedTenantMaster.id,
          body: { allowMulticode: !masterCodes.selectedTenantMaster.allowMulticode },
        },
        {
          onError: (error: Error) =>
            toast.error(error.message),
        }
      )
    } else {
      ui.toggleLocalMultiCodes()
    }
  }

  return (
    <section
      className="font-roboto *:font-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      <div className="-mx-5 -mt-5 md:-mx-6 md:-mt-6">
        <MasterCodeTabs
          tabs={ui.tabs}
          activeTab={ui.activeTab}
          onChange={ui.handleTabChange}
        />
      </div>
      <div className="mt-5">
        <MasterCodeToolbar
          codeType={ui.activeTab}
          allowMultiCodes={allowMultiCodes}
          inactiveOnly={ui.inactiveOnly}
          onToggleAllowMultiCodes={handleToggleMultiCodes}
          onToggleInactiveOnly={ui.toggleInactiveOnly}
          onAddFfp={ui.openAddModal}
        />
        <div className="mb-5">
          <MasterCodeTable
            codeType={ui.activeTab}
            rows={masterCodes.rows}
            isLoading={isTableLoading}
            onEditRow={ui.openEditModal}
          />
        </div>
        <MasterCodePagination
          totalItems={masterCodes.totalItems}
          currentPage={ui.currentPage}
          pageSize={ui.pageSize}
          onPageChange={ui.handlePageChange}
          onPageSizeChange={ui.handlePageSizeChange}
        />
      </div>
      <MasterCodeFormModal
        key={ui.modalSessionId}
        codeType={ui.activeTab}
        open={ui.modalOpen}
        mode={ui.modalMode}
        initialValues={ui.modalInitialValues}
        selectedRowId={ui.selectedRow?.id}
        onOpenChange={ui.setModalOpen}
        onSave={handleSaveForm}
      />
    </section>
  )
}
