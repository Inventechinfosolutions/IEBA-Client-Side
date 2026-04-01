import { useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { BudgetUnitTable } from "../components/budget-unit-table"
import { ProgramActivityRelationForm } from "../components/program-activity-relation/program-activity-relation-form"
import { ProgramFormModal } from "../components/program-form-modal"
import { ProgramTabs } from "../components/program-tabs"
import { TimeStudyProgramTable } from "../components/time-study-program-table"
import { ProgramToolbar } from "../components/program-toolbar"
import { useProgramModule } from "../hooks/use-program-module"
import { apiGetProgramRowById } from "../api"
import { useGetProgramFormOptions } from "../queries/get-program-form-options"
import { programFormSchema } from "../schemas"
import type {
  ProgramFormModalHandle,
  ProgramFormMode,
  ProgramFormSection,
  ProgramFormValues,
  ProgramRow,
  ProgramTab,
} from "../types"

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

export function ProgramPage() {
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
  const [lastUpdatedBudgetRow, setLastUpdatedBudgetRow] = useState<ProgramRow | null>(null)
  const [lastUpdatedTimeStudyRow, setLastUpdatedTimeStudyRow] = useState<ProgramRow | null>(null)

  const isSubProgramQuickAdd = modalMode === "add" && Boolean(selectedProgramForSubAdd)

  // Shared lookups (departments, budget units, budget programs) used by all
  // create/update flows, including Time Study tab. We pass activeTab so that
  // the inner fetch can selectively ignore heavy lookups (like budgetunits)
  // if they are not needed for that tab context. We also pass the initial
  // section for the current add-mode so that when opening "Add Budget Unit"
  // we only load departments, and defer Budget Units / Budget Programs until
  // the user switches to the corresponding sections.
  const addSectionForLookups: ProgramFormSection | undefined =
    modalMode === "add"
      ? isSubProgramQuickAdd
        ? "BU Sub-Program"
        : mapProgramTabToSection(activeTab)
      : undefined

  const formOptionsQuery = useGetProgramFormOptions(
    modalOpen && modalMode === "add",
    activeTab,
    addSectionForLookups
  )

  const programModule = useProgramModule({
    tab: activeTab,
    page,
    pageSize,
    search,
    inactiveOnly,
  })

  const programActivityRelationFilterForm = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: emptyFormValues,
  })
  const isTableLoading =
    programModule.isLoading || programModule.isCreating || programModule.isUpdating || isEditDetailLoading

  const modalInitialValues = useMemo<ProgramFormValues>(() => {
    if (modalMode === "edit" && selectedRow) {

      let section: ProgramFormSection
      if (selectedRow.tab === "Budget Units") {
        // In Budget Units tab:
        // Use type if available, fallback to hierarchyLevel logic otherwise
        const specialSubProgramCodes = ["208", "211"] // Fallbacks for backend DB parentId=null issues
        const isBackendSubprogram = typeof selectedRow.type === "string" && selectedRow.type.toLowerCase() === "subprogram"
        const isForcedSubprogram = specialSubProgramCodes.includes(selectedRow.code.trim())

        if (selectedRow.hierarchyLevel === 0 || selectedRow.type === "bu") {
          section = "Budget Unit"
        } else if (isBackendSubprogram || isForcedSubprogram || selectedRow.hierarchyLevel === 3) {
          section = "BU Sub-Program"
        } else {
          section = "BU Program"
        }
      } else {
        // Time Study tab — use row.type exclusively, never hierarchyLevel:
        // type="primary"    → BU Program (TS Primary Program)
        // type="secondary"  → BU Sub-Program (TS Sub-Program One)
        // type="subprogram" → Budget Unit (TS Sub-Program Two)
        const tsType = (selectedRow.type ?? "").toLowerCase().trim()
        if (tsType === "secondary") {
          section = "BU Sub-Program"
        } else if (tsType === "subprogram") {
          section = "Budget Unit"
        } else {
          // primary (or unknown) → TS Primary Program
          section = "BU Program"
        }
      }
      const buNameForProgramTab =
        selectedRow.tab === "Budget Units"
          ? selectedRow.name
          : selectedRow.tab === "Program Activity Relation"
            ? selectedRow.parentBudgetUnitName?.trim() || ""
            : selectedRow.parentBudgetUnitName?.trim() ?? ""
      const parentBU = programModule.rows.find(
        r => r.name.trim().toLowerCase() === selectedRow.parentBudgetUnitName?.trim().toLowerCase()
      )
      
      const effectiveParentName = 
          selectedRow.parentProgramName?.trim() || 
          selectedRow.parentBudgetUnitName?.trim() || ""
          
      const effectiveParentCode = 
          selectedRow.parentProgramCode?.trim() || 
          parentBU?.code || ""

      const isTsSecondary = selectedRow.tab === "Time Study programs" && section === "BU Sub-Program"

      // For TS secondary rows: parentBudgetUnitName = the linked BU Program name (e.g. "Adult Program")
      // buSubProgramBudgetUnitProgramName → TS Program dropdown (primary TS program name)
      // buSubProgramBudgetCode            → BU Program display field
      const buSubProgramInitial = {
        buSubProgramBudgetUnitProgramName: isTsSecondary
          ? selectedRow.parentBudgetUnitName?.trim() ?? ""  // primary TS program name
          : effectiveParentName,
        buSubProgramBudgetCode: isTsSecondary
          ? selectedRow.parentBudgetUnitName?.trim() ?? ""  // BU Program display value
          : effectiveParentCode,
        buSubProgramDepartment: selectedRow.department,
        buSubProgramCode: selectedRow.code,
        buSubProgramName: selectedRow.name,
        buSubProgramDescription: selectedRow.description,
        buSubProgramMedicalPct: selectedRow.medicalPct,
      }

      // For TS Sub-Program Two edit, we need special field mapping:
      // budgetUnitName        → primary TS program name (shown in "TS Program" dropdown)
      // budgetUnitDescription → BU Program name (auto-populated display field)
      // buProgramProgramName  → subprogram's own name
      // buProgramProgramCode  → subprogram's own code
      const isTsSubProgramTwo = selectedRow.tab === "Time Study programs" && section === "Budget Unit"

      return {
        ...emptyFormValues,
        formSection: section,
        active: selectedRow.active,
        costAllocation: selectedRow.costAllocation ?? false,
        budgetUnitDepartment: selectedRow.department,
        budgetUnitCode: isTsSubProgramTwo
          ? selectedRow.parentBudgetUnitName?.trim() ?? ""  // primary program name (used as code key in lookup)
          : selectedRow.code,
        budgetUnitName: isTsSubProgramTwo
          ? selectedRow.parentBudgetUnitName?.trim() ?? ""  // primary TS program name → fills the TS Program dropdown
          : selectedRow.name,
        budgetUnitDescription: isTsSubProgramTwo
          ? selectedRow.parentBudgetUnitName?.trim() ?? ""  // BU Program name (display-only locked field)
          : selectedRow.description,
        budgetUnitMedicalPct: selectedRow.medicalPct,
        buProgramBudgetUnitName: buNameForProgramTab,
        buProgramDepartment: selectedRow.department,
        buProgramCode: selectedRow.code,
        buProgramProgramCode: isTsSubProgramTwo ? selectedRow.code : selectedRow.code,
        buProgramProgramName: isTsSubProgramTwo ? selectedRow.name : selectedRow.name,
        buProgramDescription: selectedRow.description,
        buProgramMedicalPct: selectedRow.medicalPct,
        ...buSubProgramInitial,
      }
    }
    if (modalMode === "add" && selectedProgramForSubAdd) {
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
  }, [activeTab, modalMode, selectedProgramForSubAdd, selectedRow, formOptionsQuery.data])
  const shouldLockModalSectionTabs = modalMode === "edit"

  const handleTabChange = (nextTab: ProgramTab) => {
    setActiveTab(nextTab)
    setPage(1)
    setSearch("")
    setInactiveOnly(false)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
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
      const freshRow = await apiGetProgramRowById({ activeTab, row })
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

  const handleSaveForm = (values: ProgramFormValues) => {
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
          setLastUpdatedBudgetRow(updatedRow)
        } else if (activeTab === "Time Study programs") {
          setLastUpdatedTimeStudyRow(updatedRow)
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
            departmentIdByName: formOptionsQuery.data?.departmentIdByName,
            budgetUnitIdByName: formOptionsQuery.data?.budgetUnitIdByName,
            budgetProgramIdByName: formOptionsQuery.data?.budgetProgramIdByName,
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
        lookups: {
          departmentIdByName: formOptionsQuery.data?.departmentIdByName,
          budgetUnitIdByName: formOptionsQuery.data?.budgetUnitIdByName,
          budgetProgramIdByName: formOptionsQuery.data?.budgetProgramIdByName,
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
      <div className="-mx-5 -mt-5 md:-mx-6 md:-mt-6">
        <ProgramTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="mt-5">
        {activeTab !== "Program Activity Relation" ? (
          <ProgramToolbar
            activeTabLabel={activeTab}
            searchValue={search}
            inactiveOnly={inactiveOnly}
            onSearchChange={handleSearchChange}
            onToggleInactiveOnly={() => setInactiveOnly((prev) => !prev)}
            onAddProgram={handleAddProgram}
          />
        ) : null}
        {activeTab === "Program Activity Relation" ? (
          <div className="mb-5">
            <ProgramActivityRelationForm form={programActivityRelationFilterForm} />
          </div>
        ) : null}
        {activeTab !== "Program Activity Relation" ? (
          <>
            <div className="mb-5">
              {activeTab === "Budget Units" ? (
                <BudgetUnitTable
                  rows={programModule.rows}
                  isLoading={isTableLoading}
                  onEditRow={handleEditRow}
                  onAddSubProgramFromProgram={handleAddSubProgramFromProgram}
                  lastUpdatedRow={lastUpdatedBudgetRow}
                  expandedBudgetUnits={expandedBudgetUnits}
                  setExpandedBudgetUnits={setExpandedBudgetUnits}
                  expandedProgramGroups={expandedProgramGroups}
                  setExpandedProgramGroups={setExpandedProgramGroups}
                  expandedPrograms={expandedPrograms}
                  setExpandedPrograms={setExpandedPrograms}
                />
              ) : (
                <TimeStudyProgramTable
                  rows={programModule.rows}
                  isLoading={isTableLoading}
                  onEditRow={handleEditRow}
                  lastUpdatedRow={lastUpdatedTimeStudyRow}
                />
              )}
            </div>
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
          </>
        ) : null}
      </div>
      <ProgramFormModal
        key={modalSessionId}
        open={modalOpen}
        mode={modalMode}
        initialValues={modalInitialValues}
        hideSectionTabs={isSubProgramQuickAdd}
        lockSectionTabs={shouldLockModalSectionTabs}
        contextTab={activeTab}
        isSubmitting={programModule.isCreating || programModule.isUpdating}
        onOpenChange={setModalOpen}
        onSave={handleSaveForm}
        ref={modalResetRef}
      />
    </section>
  )
}
