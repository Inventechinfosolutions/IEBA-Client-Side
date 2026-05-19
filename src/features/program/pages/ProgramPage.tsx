import { lazy, Suspense, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { usePermissions } from "@/hooks/usePermissions"
import { queryClient } from "@/main"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { Spinner } from "@/components/ui/spinner"
import { BudgetUnitTable } from "../components/BudgetUnitTable"
import { ProgramActivityRelationForm } from "../components/program-activity-relation/ProgramActivityRelationForm"
import { ProgramFormModal } from "../components/ProgramFormModal"
import { ProgramTabs } from "../components/ProgramTabs"
import { TimeStudyProgramTable } from "../components/TimeStudyProgramTable"
import { ProgramToolbar } from "../components/ProgramToolbar"
import { useProgramModule } from "../hooks/useProgramModule"
import { apiGetProgramRowById } from "../api"
import { useGetProgramFormOptions } from "../queries/getProgramFormOptions"
import { programFormSchema } from "../schemas"
import { programKeys } from "../keys"
import type {
  BudgetUnitTableHandle,
  ProgramFormModalHandle,
  ProgramFormMode,
  ProgramFormSection,
  ProgramFormValues,
  ProgramRow,
  ProgramTab,
  TimeStudyProgramTableHandle,
  ProgramCreateLookups,
} from "../types"

const UserProgramHistoryTable = lazy(() =>
  import("../components/UserProgramHistoryTable").then((m) => ({ default: m.UserProgramHistoryTable }))
)

const tabs: ProgramTab[] = [
  "Budget Units",
  "Time Study programs",
  "Program Activity Relation",
]



const emptyFormValues: ProgramFormValues = {
  formSection: "Budget Unit",
  active: true,
  costAllocation: false,
  budgetUnitDepartment: "",
  budgetUnitCode: "",
  budgetUnitName: "",
  budgetUnitDescription: "",
  budgetUnitMedicalPct: "0.0",
  buProgramBudgetUnitName: "",
  buProgramCode: "",
  buProgramDepartment: "",
  buProgramProgramCode: "",
  buProgramProgramName: "",
  buProgramDescription: "",
  buProgramMedicalPct: "0.0",
  buSubProgramBudgetUnitProgramName: "",
  buSubProgramBudgetCode: "",
  buSubProgramDepartment: "",
  buSubProgramCode: "",
  buSubProgramName: "",
  buSubProgramDescription: "",
  buSubProgramMedicalPct: "0.0",
  programActivityRelationDepartment: "",
  programActivityRelationProgram: "",
  programActivityRelationSort: "",
}

function mapProgramTabToSection(tab: ProgramTab): ProgramFormSection {
  if (tab === "Budget Units") return "Budget Unit"
  if (tab === "Time Study programs") return "BU Program"
  return "BU Sub-Program"
}

function getSaveSuccessMessage(
  formSection: ProgramFormSection,
  isEdit: boolean,
  activeTab: ProgramTab
): string {
  if (activeTab === "Time Study programs") {
    if (formSection === "BU Program") {
      return isEdit
        ? "TS Primary Program updated Successfully"
        : "TS Primary Program created Successfully"
    }
    if (formSection === "BU Sub-Program") {
      return isEdit
        ? "TS Sub Program One updated Successfully"
        : "TS Sub Program One Saved Successfully"
    }
    return isEdit
      ? "TS Sub Program Two updated Successfully"
      : "TS Sub Program Two Saved Successfully"
  }

  if (formSection === "BU Program") return "Budget Program Saved Successfully"
  if (formSection === "Budget Unit")
    return isEdit ? "Budget Unit updated successfully" : "Budget Unit saved successfully"
  return "Budget Sub Program Saved Successfully"
}

function detectSection(row: ProgramRow): ProgramFormSection {
  if (row.tab === "Budget Units") {
    const isBackendSubprogram = typeof row.type === "string" && row.type.toLowerCase() === "subprogram"

    if (row.hierarchyLevel === 0 || row.type === "bu") {
      return "Budget Unit"
    } else if (isBackendSubprogram || row.hierarchyLevel === 3) {
      return "BU Sub-Program"
    } else {
      return "BU Program"
    }
  } else {
    // Time Study tab — use row.type exclusively, never hierarchyLevel:
    const tsType = (row.type ?? "").toLowerCase().trim()
    if (tsType === "secondary") {
      return "BU Sub-Program"
    } else if (tsType === "subprogram") {
      return "Budget Unit"
    } else {
      return "BU Program"
    }
  }
}

export function ProgramPage() {
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

  const [activeTab, setActiveTab] = useState<ProgramTab>("Budget Units")
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ProgramFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<ProgramRow | null>(null)
  const [selectedProgramForSubAdd, setSelectedProgramForSubAdd] = useState<ProgramRow | null>(
    null
  )
  const [isEditDetailLoading, setIsEditDetailLoading] = useState(false)
  const [modalSessionId, setModalSessionId] = useState(0)
  const modalResetRef = useRef<ProgramFormModalHandle | null>(null)
  const [expandedBudgetUnits, setExpandedBudgetUnits] = useState<Record<string, boolean>>({})
  const [expandedProgramGroups, setExpandedProgramGroups] = useState<Record<string, boolean>>({})
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})
  const budgetUnitTableRef = useRef<BudgetUnitTableHandle | null>(null)
  const tsTableRefInner = useRef<TimeStudyProgramTableHandle | null>(null)
  const [activeChildrenFlags, setActiveChildrenFlags] = useState({ one: false, two: false, parentActive: undefined as boolean | undefined })
  const [showHistory, setShowHistory] = useState(false)
  const [historySearch, setHistorySearch] = useState("")

  const isSubProgramQuickAdd = modalMode === "add" && Boolean(selectedProgramForSubAdd)

  // Shared lookups (departments, budget units, budget programs) used by all
  // create/update flows, including Time Study tab. We pass activeTab so that
  // the inner fetch can selectively ignore heavy lookups (like budgetunits)
  // if they are not needed for that tab context. We also pass the initial
  // section for the current add-mode so that when opening "Add Budget Unit"
  // we only load departments, and defer Budget Units / Budget Programs until
  // the user switches to the corresponding sections.
  const currentSectionForLookups = useMemo<ProgramFormSection | undefined>(() => {
    if (!modalOpen) return undefined
    if (modalMode === "add") {
      return isSubProgramQuickAdd
        ? activeTab === "Time Study programs"
          ? "Budget Unit"     // TS Sub-Program Two
          : "BU Sub-Program"  // Budget Units sub-program
        : mapProgramTabToSection(activeTab)
    }
    return selectedRow ? detectSection(selectedRow) : undefined
  }, [modalOpen, modalMode, isSubProgramQuickAdd, activeTab, selectedRow])

  const { user, isSuperAdmin, isDepartmentAdmin } = usePermissions()

  const isRestrictedRole = (user?.roles?.some(role => {
    const r = role.toLowerCase();
    return r.includes("payroll admin") ||
           r.includes("time study admin") ||
           r.includes("time study supervisor") ||
           r.toLowerCase() === "user";
  }) ?? false) && !isSuperAdmin && !isDepartmentAdmin;

  const assignedDepartmentIds = useMemo(() => {
    if (isSuperAdmin) return undefined;
    const ids = new Set<number>();
    user?.departmentRoles?.forEach(dr => {
      if (dr.departmentId) ids.add(dr.departmentId);
    });
    return Array.from(ids);
  }, [user, isSuperAdmin]);

  const filteredTabs = useMemo(() => {
    if (isRestrictedRole) {
      return ["Budget Units", "Time Study programs"] as ProgramTab[]
    }
    return tabs
  }, [isRestrictedRole])

  const formOptionsQuery = useGetProgramFormOptions(
    modalOpen && modalMode === "add",
    activeTab,
    currentSectionForLookups,
    assignedDepartmentIds
  )

  const programModule = useProgramModule({
    tab: activeTab,
    page,
    pageSize,
    search,
    inactiveOnly,
    departmentIds: assignedDepartmentIds
  })

  const programActivityRelationFilterForm = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: emptyFormValues,
  })
  const isTableLoading =
    programModule.isLoading || programModule.isCreating || programModule.isUpdating || isEditDetailLoading

  const modalInitialValues = useMemo<ProgramFormValues>(() => {
    if (modalMode === "edit" && selectedRow) {

      const section = detectSection(selectedRow)
      const buNameForProgramTab =
        selectedRow.tab === "Budget Units"
          ? (selectedRow.hierarchyLevel === 0 
              ? selectedRow.name 
              : selectedRow.parentBudgetUnitName?.trim() || "")
          : selectedRow.tab === "Program Activity Relation"
            ? selectedRow.parentBudgetUnitName?.trim() || ""
            : selectedRow.parentBudgetUnitName?.trim() ?? ""
      const parentBU = programModule.rows.find(
        r => r.name.trim().toLowerCase() === selectedRow.parentBudgetUnitName?.trim().toLowerCase()
      )
      
      const buCodeForProgramTab =
        selectedRow.tab === "Budget Units"
          ? (selectedRow.hierarchyLevel === 0
              ? selectedRow.code
              : selectedRow.parentBudgetUnitCode?.trim() || parentBU?.code || "")
          : parentBU?.code || ""
      
      const effectiveParentName = 
          selectedRow.parentProgramName?.trim() || 
          selectedRow.parentBudgetUnitName?.trim() || ""
          
      const effectiveParentCode = 
          selectedRow.parentProgramCode?.trim() || 
          parentBU?.code || ""

      const isTsSecondary = selectedRow.tab === "Time Study programs" && section === "BU Sub-Program"

      const buSubProgramInitial = {
        buSubProgramBudgetUnitProgramName: isTsSecondary
          ? selectedRow.parentProgramName?.trim() ?? ""  // Level 1 TS Program name
          : effectiveParentName,
        buSubProgramBudgetCode: isTsSecondary
          ? selectedRow.parentBudgetUnitCode?.trim() ?? ""  // linked BU Program code
          : effectiveParentCode,
        buSubProgramDepartment: selectedRow.department,
        buSubProgramCode: selectedRow.code,
        buSubProgramName: selectedRow.name,
        buSubProgramDescription: selectedRow.description,
        buSubProgramMedicalPct: selectedRow.medicalPct,
      }

      // For TS Sub-Program Two edit, we need special field mapping:
      // budgetUnitName        → parent TS program name (Level 2)
      // budgetUnitCode        → parent TS program code (Level 2)
      // budgetUnitDescription → linked BU Program code
      const isTsSubProgramTwo = selectedRow.tab === "Time Study programs" && section === "Budget Unit"

      return {
        ...emptyFormValues,
        formSection: section,
        active: selectedRow.active,
        costAllocation: selectedRow.costAllocation ?? false,
        budgetUnitDepartment: selectedRow.department,
        budgetUnitCode: isTsSubProgramTwo
          ? selectedRow.parentProgramCode?.trim() ?? ""  // parent TS sub-program code (Level 2)
          : selectedRow.code,
        budgetUnitName: isTsSubProgramTwo
          ? selectedRow.parentProgramName?.trim() ?? ""  // parent TS sub-program name (Level 2)
          : selectedRow.name,
        budgetUnitDescription: isTsSubProgramTwo
          ? selectedRow.parentBudgetUnitCode?.trim() ?? ""  // linked BU Program code
          : selectedRow.description,
        budgetUnitMedicalPct: selectedRow.medicalPct,
        buProgramBudgetUnitName: buNameForProgramTab,
        buProgramDepartment: selectedRow.department,
        buProgramCode: buCodeForProgramTab,
        buProgramProgramCode: selectedRow.code,
        buProgramProgramName: selectedRow.name,
        buProgramDescription: selectedRow.description,
        buProgramMedicalPct: selectedRow.medicalPct,
        hasActiveSubProgramOne: activeChildrenFlags.one,
        hasActiveSubProgramTwo: activeChildrenFlags.two,
        isMultiCode: selectedRow.isMultiCode,
        multiCodeType: selectedRow.multiCodeType,
        parentActive: activeChildrenFlags.parentActive,
        ...buSubProgramInitial,
      }
    }
    if (modalMode === "add" && selectedProgramForSubAdd) {
      // Time Study tab: adding Sub-Program Two from a Sub-Program One parent
      // → opens "Budget Unit" section (mapped to TS Sub-Program Two form)
      if (activeTab === "Time Study programs") {
        return {
          ...emptyFormValues,
          formSection: "Budget Unit",
          active: true,
          budgetUnitName: selectedProgramForSubAdd.name,
          budgetUnitCode: selectedProgramForSubAdd.code,
          budgetUnitDepartment: selectedProgramForSubAdd.department,
          budgetUnitDescription: selectedProgramForSubAdd.parentBudgetUnitName ?? "",
          budgetUnitMedicalPct: "0.0",
        }
      }
      // Budget Units tab: adding BU Sub-Program from a BU Program parent
      return {
        ...emptyFormValues,
        formSection: "BU Sub-Program",
        active: true,
        buSubProgramBudgetUnitProgramName: selectedProgramForSubAdd.name,
        buSubProgramBudgetCode: selectedProgramForSubAdd.code,
        buSubProgramDepartment: selectedProgramForSubAdd.department,
        buSubProgramMedicalPct: "0.0",
      }
    }
    return {
      ...emptyFormValues,
      formSection: mapProgramTabToSection(activeTab),
    }
  }, [activeTab, modalMode, selectedProgramForSubAdd, selectedRow, formOptionsQuery.data, activeChildrenFlags])
  const shouldLockModalSectionTabs = modalMode === "edit"

  const handleTabChange = (nextTab: ProgramTab) => {
    setActiveTab(nextTab)
    setPage(1)
    setSearch("")
    setInactiveOnly(false)
    // Collapse all expanded rows so returning to Budget Units starts fresh
    setExpandedBudgetUnits({})
    setExpandedProgramGroups({})
    setExpandedPrograms({})
    setShowHistory(false)
    setHistorySearch("")
  }

  // Called only when the modal is dismissed via Exit (not after Save).
  // This is the single place the table list API is re-triggered for all 6 form sections.
  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      // Invalidate all list queries across all tabs when Exit is clicked.
      queryClient.invalidateQueries({ queryKey: programKeys.lists() })
    }
  }

  const handleSearchChange = (value: string) => {
    if (showHistory) {
      setHistorySearch(value)
    } else {
      setSearch(value)
      setPage(1)
    }
  }

  const handleAddProgram = () => {
    setModalMode("add")
    setSelectedRow(null)
    setSelectedProgramForSubAdd(null)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleEditRow = async (row: ProgramRow) => {
    try {
      setIsEditDetailLoading(true)
      // Capture parentActive from the table row BEFORE the API fetch,
      // since the freshRow returned by the API won't carry this field
      // (it's stamped by the table hierarchy builder at render time).
      const parentActive = row.parentActive
      const freshRow = await apiGetProgramRowById({ activeTab, row })
      
      setActiveChildrenFlags({ one: false, two: false, parentActive })

      setModalMode("edit")
      setSelectedRow(freshRow)
      setSelectedProgramForSubAdd(null)
      setModalSessionId((prev) => prev + 1)
      setModalOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load row")
    } finally {
      setIsEditDetailLoading(false)
    }
  }

  const handleAddSubProgramFromProgram = (row: ProgramRow) => {
    setModalMode("add")
    setSelectedRow(null)
    setSelectedProgramForSubAdd(row)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleSaveForm = (values: ProgramFormValues, modalLookups?: ProgramCreateLookups) => {
    // Use the currently active main tab to decide which backend flow to use.
    // This ensures that when we're in the "Budget Units" tab and on the "BU Program"
    // section, we hit the Budget Program create/update paths (not Time Study).
    const targetTab = activeTab
    const successMessage = getSaveSuccessMessage(
      values.formSection,
      Boolean(modalMode === "edit" && selectedRow),
      activeTab
    )
    const handleSaveSuccess = (updatedRow?: ProgramRow) => {
      toast.success(successMessage, successToastOptions)
      const nextEmptyValues: ProgramFormValues = {
        ...emptyFormValues,
        formSection: values.formSection,
      }
      modalResetRef.current?.reset(nextEmptyValues)
      const shouldCloseModal =
        modalMode === "edit" || Boolean(selectedProgramForSubAdd)
      if (shouldCloseModal) {
        setModalOpen(false)
      }
      setModalMode("add")
      setSelectedRow(null)
      setSelectedProgramForSubAdd(null)

      if (updatedRow) {
        if (activeTab === "Budget Units") {
          budgetUnitTableRef.current?.patchBudgetProgramRow(updatedRow)
          // User requested: "when we update any parent > close this so we can refetch crt data"
          // Collapse the row so when they expand it again, children are fresh.
          budgetUnitTableRef.current?.collapseRow(updatedRow.id, updatedRow.parentId)
        } else if (activeTab === "Time Study programs") {
          tsTableRefInner.current?.patchTimeStudyProgramRow(updatedRow)
          // Same for TS table
          tsTableRefInner.current?.collapseRow(updatedRow.id)
          // If this was a quick-add Sub-Program Two from a Sub-Program One row,
          // collapse the parent so re-expand triggers a fresh fetch showing the new record.
          if (selectedProgramForSubAdd) {
            tsTableRefInner.current?.collapseRow(selectedProgramForSubAdd.id)
          }
        }
      }
    }

    if (modalMode === "edit" && selectedRow) {
      programModule.updateProgram(
        {
          id: selectedRow.id,
          tab: targetTab,
          values,
          lookups: {
            departmentIdByName: modalLookups?.departmentIdByName ?? formOptionsQuery.data?.departmentIdByName,
            budgetUnitIdByName: modalLookups?.budgetUnitIdByName ?? formOptionsQuery.data?.budgetUnitIdByName,
            budgetProgramIdByName: modalLookups?.budgetProgramIdByName ?? formOptionsQuery.data?.budgetProgramIdByName,
            budgetProgramLookup: modalLookups?.budgetProgramLookup ?? formOptionsQuery.data?.budgetProgramLookup,
          },
        },
        {
          onSuccess: (updatedRow) => handleSaveSuccess(updatedRow),
          onError: (error) => toast.error(error.message),
        }
      )
      return
    }

    programModule.createProgram(
      {
        tab: targetTab,
        values,
        parentRowId: selectedProgramForSubAdd?.id,
        lookups: {
          departmentIdByName: modalLookups?.departmentIdByName ?? formOptionsQuery.data?.departmentIdByName,
          budgetUnitIdByName: modalLookups?.budgetUnitIdByName ?? formOptionsQuery.data?.budgetUnitIdByName,
          budgetProgramIdByName: modalLookups?.budgetProgramIdByName ?? formOptionsQuery.data?.budgetProgramIdByName,
          budgetProgramLookup: modalLookups?.budgetProgramLookup ?? formOptionsQuery.data?.budgetProgramLookup,
        },
      },
      {
        onSuccess: handleSaveSuccess,
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <section
      className="font-roboto *:font-roboto w-full rounded-[10px] border border-[#e6e7ef] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      {!showHistory && (
        <div className="-mx-5 -mt-5 md:-mx-6 md:-mt-6">
          <ProgramTabs tabs={filteredTabs} activeTab={activeTab} onChange={handleTabChange} />
        </div>
      )}
      <div className="mt-5">
        {activeTab !== "Program Activity Relation" ? (
          <ProgramToolbar
            activeTabLabel={activeTab}
            searchValue={showHistory ? historySearch : search}
            inactiveOnly={inactiveOnly}
            onSearchChange={handleSearchChange}
            onToggleInactiveOnly={() => setInactiveOnly((prev) => !prev)}
            onAddProgram={handleAddProgram}
            hideAdd={isRestrictedRole}
            showHistory={showHistory}
            onToggleHistory={
              activeTab === "Time Study programs"
                ? () => {
                    setShowHistory((prev) => {
                      if (prev) setHistorySearch("")
                      return !prev
                    })
                  }
                : undefined
            }
          />
        ) : null}
        {activeTab === "Program Activity Relation" ? (
          <div className="mb-5">
            <ProgramActivityRelationForm 
              form={programActivityRelationFilterForm} 
              departmentIds={assignedDepartmentIds}
            />
          </div>
        ) : null}
        {activeTab !== "Program Activity Relation" ? (
          <>
            <div className="mb-5">
              {showHistory && activeTab === "Time Study programs" ? (
                <Suspense
                  fallback={
                    <div className="relative flex min-h-[300px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white">
                      <Spinner className="text-[#6C5DD3]" />
                    </div>
                  }
                >
                  <UserProgramHistoryTable userId="" programCode={historySearch} />
                </Suspense>
              ) : activeTab === "Budget Units" ? (
                <BudgetUnitTable
                  ref={budgetUnitTableRef}
                  rows={programModule.rows}
                  isLoading={isTableLoading}
                  onEditRow={handleEditRow}
                  onAddSubProgramFromProgram={handleAddSubProgramFromProgram}
                  expandedBudgetUnits={expandedBudgetUnits}
                  setExpandedBudgetUnits={setExpandedBudgetUnits}
                  expandedProgramGroups={expandedProgramGroups}
                  setExpandedProgramGroups={setExpandedProgramGroups}
                  expandedPrograms={expandedPrograms}
                  setExpandedPrograms={setExpandedPrograms}
                  readonly={isRestrictedRole}
                />
              ) : (
                <TimeStudyProgramTable
                  ref={tsTableRefInner}
                  rows={programModule.rows}
                  isLoading={isTableLoading}
                  onEditRow={handleEditRow}
                  onAddSubProgramFromParent={handleAddSubProgramFromProgram}
                  readonly={isRestrictedRole}
                />
              )}
            </div>
            {!showHistory && (
              <MasterCodePagination
                totalItems={programModule.totalItems}
                currentPage={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                }}
              />
            )}
          </>
        ) : null}
      </div>
      <ProgramFormModal
        key={`modal-${modalSessionId}`}
        open={modalOpen}
        mode={modalMode}
        initialValues={modalInitialValues}
        hideSectionTabs={isSubProgramQuickAdd}
        lockSectionTabs={shouldLockModalSectionTabs}
        contextTab={activeTab}
        isSubmitting={programModule.isCreating || programModule.isUpdating}
        isLoading={isEditDetailLoading}
        onOpenChange={handleModalClose}
        onSave={handleSaveForm}
        departmentIds={assignedDepartmentIds}
        ref={modalResetRef}
      />
    </section>
  )
}

export default ProgramPage

