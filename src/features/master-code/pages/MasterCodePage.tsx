import { Check } from "lucide-react"
import { toast } from "sonner"
import { guardNoChanges, getChangedFields } from "@/lib/formGuard"
import { useState } from "react"

import { MasterCodeFormModal } from "../components/MasterCodeFormModal"
import { MasterCodePagination } from "../components/MasterCodePagination"
import { MasterCodeTable } from "../components/MasterCodeTable"
import { MasterCodeTabs } from "../components/MasterCodeTabs"
import { MasterCodeToolbar } from "../components/MasterCodeToolbar"
import { useMasterCodeUI } from "../hooks/useMasterCodeUi"
import { useMasterCodes } from "../hooks/useMasterCode"
import type { MasterCodeFormValues } from "../types"
import { usePermissions } from "@/hooks/usePermissions"
import { Spinner } from "@/components/ui/spinner"

export function MasterCodePage() {
  const { isSuperAdmin, canAdd, canUpdate, canView } = usePermissions()

  const hasAddPermission = isSuperAdmin || canAdd("activity")
  const hasEditPermission = isSuperAdmin || canUpdate("activity")

  if (!isSuperAdmin && !canView("activity")) {
    return null
  }

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
  const [isSaving, setIsSaving] = useState(false)

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
    setIsSaving(true)
    if (ui.modalMode === "edit" && ui.selectedRow) {
      if (
        guardNoChanges(
          values as unknown as Record<string, unknown>,
          ui.modalInitialValues as unknown as Record<string, unknown>
        )
      ) {
        setIsSaving(false)
        return
      }

      const changedFields = getChangedFields(
        values as unknown as Record<string, unknown>,
        ui.modalInitialValues as unknown as Record<string, unknown>
      ) as Partial<MasterCodeFormValues>

      masterCodes.updateMasterCode(
        {
          id: ui.selectedRow.id,
          codeType: ui.activeTab,
          values: changedFields,
          originalValues: ui.modalInitialValues,
        },
        {
          onSuccess: () => {
            toast.success(`${ui.activeTab} updated successfully`, successToastOptions)
            ui.setModalOpen(false)
          },
          onError: (error: Error) => toast.error(error.message),
          onSettled: () => setIsSaving(false),
        }
      )
      return
    }

    masterCodes.createMasterCode(
      { codeType: ui.activeTab, values },
      {
        onSuccess: () => {
          toast.success(`${ui.activeTab} created successfully`, successToastOptions)
          ui.setModalOpen(false)
        },
        onError: (error: Error) => toast.error(error.message),
        onSettled: () => setIsSaving(false),
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
      className="master-code-container font-roboto *:font-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      {ui.isTabLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}
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
            canAdd={hasAddPermission}
          />
        <div className="mb-5">
          <MasterCodeTable
            codeType={ui.activeTab}
            rows={masterCodes.rows}
            isLoading={isTableLoading}
            onEditRow={ui.openEditModal}
            canEdit={hasEditPermission}
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
        isSubmitting={isSaving}
      />
    </section>
  )
}

export default MasterCodePage

