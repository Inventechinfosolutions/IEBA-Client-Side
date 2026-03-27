import { useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { BudgetUnitTable } from "../components/BudgetUnitTable"
import { ProgramActivityRelationForm } from "../components/ProgramActivityRelationForm"
import { ProgramFormModal } from "../components/ProgramFormModal"
import { ProgramTabs } from "../components/ProgramTabs"
import { TimeStudyProgramTable } from "../components/TimeStudyProgramTable"
import { ProgramToolbar } from "../components/ProgramToolbar"
import { useProgramModule } from "../hooks/useProgramModule"
import {
  getMockParentBudgetUnitNameForProgram,
  getMockProgramBudgetProgramLookup,
  getMockProgramBudgetUnitLookup,
  getMockTimeStudyProgramByName,
} from "../mock"
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
  budgetUnitMedicalPct: "0.00",
  buProgramBudgetUnitName: "",
  buProgramCode: "",
  buProgramDepartment: "",
  buProgramProgramCode: "",
  buProgramProgramName: "",
  buProgramDescription: "",
  buProgramMedicalPct: "0.00",
  buSubProgramBudgetUnitProgramName: "",
  buSubProgramBudgetCode: "",
  buSubProgramDepartment: "",
  buSubProgramCode: "",
  buSubProgramName: "",
  buSubProgramDescription: "",
  buSubProgramMedicalPct: "0.00",
  programActivityRelationDepartment: "",
  programActivityRelationProgram: "",
  programActivityRelationSort: "",
}

function mapProgramTabToSection(tab: ProgramTab): ProgramFormSection {
  if (tab === "Budget Units") return "Budget Unit"
  if (tab === "Time Study programs") return "BU Program"
  return "BU Sub-Program"
}

function mapSectionToProgramTab(section: ProgramFormSection): ProgramTab {
  if (section === "Budget Unit") return "Budget Units"
  if (section === "BU Program") return "Time Study programs"
  return "Program Activity Relation"
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
  const [modalSessionId, setModalSessionId] = useState(0)
  const modalResetRef = useRef<ProgramFormModalHandle | null>(null)

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
    programModule.isLoading || programModule.isCreating || programModule.isUpdating
  const isSubProgramQuickAdd = modalMode === "add" && Boolean(selectedProgramForSubAdd)

  const modalInitialValues = useMemo<ProgramFormValues>(() => {
    if (modalMode === "edit" && selectedRow) {
      const isTimeStudyChildRow = selectedRow.hierarchyLevel === 1
      const isSubProgramTwoRow =
        selectedRow.name.toLowerCase().includes("sub program two") ||
        selectedRow.code.toLowerCase().includes("901")
      const section =
        isTimeStudyChildRow
          ? isSubProgramTwoRow
            ? "Budget Unit"
            : "BU Sub-Program"
          : mapProgramTabToSection(selectedRow.tab)
      const budgetUnitLookup = getMockProgramBudgetUnitLookup()
      const buNameForProgramTab =
        selectedRow.tab === "Budget Units"
          ? selectedRow.name
          : selectedRow.tab === "Program Activity Relation"
            ? getMockParentBudgetUnitNameForProgram(selectedRow.parentProgramName ?? "") ||
              selectedRow.parentBudgetUnitName?.trim() ||
              ""
            : selectedRow.parentBudgetUnitName?.trim() ?? ""

      const linkedBu =
        buNameForProgramTab && budgetUnitLookup[buNameForProgramTab]
          ? budgetUnitLookup[buNameForProgramTab]
          : null

      const buProgramCodeLinked =
        linkedBu && selectedRow.tab !== "Budget Units" ? linkedBu.code : selectedRow.code
      const buProgramDepartmentLinked =
        linkedBu && selectedRow.tab !== "Budget Units"
          ? linkedBu.department
          : selectedRow.department

      const budgetProgramLookup = getMockProgramBudgetProgramLookup()
      const subProgramParentName = selectedRow.parentProgramName?.trim() ?? ""
      const parentTimeStudyProgram =
        selectedRow.tab === "Program Activity Relation"
          ? getMockTimeStudyProgramByName(subProgramParentName)
          : undefined
      const linkedProgram =
        subProgramParentName && budgetProgramLookup[subProgramParentName]
          ? budgetProgramLookup[subProgramParentName]
          : null
      const isProgramActivityRelationEdit = selectedRow.tab === "Program Activity Relation"
      const tsProgramNameForSubProgramTwo = subProgramParentName || parentTimeStudyProgram?.name || ""

      const buSubProgramInitial =
        isProgramActivityRelationEdit
          ? {
              buSubProgramBudgetUnitProgramName: subProgramParentName,
              buSubProgramBudgetCode: linkedProgram?.code ?? "",
              buSubProgramDepartment: linkedProgram?.department ?? selectedRow.department,
              buSubProgramCode: selectedRow.code,
              buSubProgramName: selectedRow.name,
              buSubProgramDescription: selectedRow.description,
              buSubProgramMedicalPct: selectedRow.medicalPct,
            }
          : {}

      return {
        ...emptyFormValues,
        formSection: section,
        active: selectedRow.active,
        budgetUnitDepartment: isProgramActivityRelationEdit
          ? linkedProgram?.department ?? selectedRow.department
          : selectedRow.department,
        budgetUnitCode: isProgramActivityRelationEdit
          ? tsProgramNameForSubProgramTwo
          : selectedRow.code,
        budgetUnitName: isProgramActivityRelationEdit ? tsProgramNameForSubProgramTwo : selectedRow.name,
        budgetUnitDescription: isProgramActivityRelationEdit
          ? linkedProgram?.code ?? ""
          : selectedRow.description,
        budgetUnitMedicalPct: selectedRow.medicalPct,
        buProgramBudgetUnitName: buNameForProgramTab,
        buProgramDepartment: buProgramDepartmentLinked,
        buProgramCode: buProgramCodeLinked,
        buProgramProgramCode: isProgramActivityRelationEdit
          ? selectedRow.code
          : parentTimeStudyProgram?.code ?? selectedRow.code,
        buProgramProgramName: isProgramActivityRelationEdit
          ? selectedRow.name
          : parentTimeStudyProgram?.name ?? selectedRow.name,
        buProgramDescription: isProgramActivityRelationEdit
          ? selectedRow.description
          : parentTimeStudyProgram?.description ?? selectedRow.description,
        buProgramMedicalPct: isProgramActivityRelationEdit
          ? selectedRow.medicalPct
          : parentTimeStudyProgram?.medicalPct ?? selectedRow.medicalPct,
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
        buSubProgramMedicalPct: "0.00",
      }
    }
    return {
      ...emptyFormValues,
      formSection: mapProgramTabToSection(activeTab),
    }
  }, [activeTab, modalMode, selectedProgramForSubAdd, selectedRow])
  const shouldLockModalSectionTabs =
    activeTab === "Time Study programs" &&
    modalMode === "edit"

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

  const handleEditRow = (row: ProgramRow) => {
    setModalMode("edit")
    setSelectedRow(row)
    setSelectedProgramForSubAdd(null)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleAddSubProgramFromProgram = (row: ProgramRow) => {
    setModalMode("add")
    setSelectedRow(null)
    setSelectedProgramForSubAdd(row)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }

  const handleSaveForm = (values: ProgramFormValues) => {
    const targetTab = mapSectionToProgramTab(values.formSection)
    const successMessage = getSaveSuccessMessage(
      values.formSection,
      Boolean(modalMode === "edit" && selectedRow),
      activeTab
    )
    const handleSaveSuccess = () => {
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
    }

    if (modalMode === "edit" && selectedRow) {
      programModule.updateProgram(
        { id: selectedRow.id, tab: targetTab, values },
        {
          onSuccess: handleSaveSuccess,
          onError: (error) => toast.error(error.message),
        }
      )
      return
    }

    programModule.createProgram(
      { tab: targetTab, values },
      {
        onSuccess: handleSaveSuccess,
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
                />
              ) : (
                <TimeStudyProgramTable
                  rows={programModule.rows}
                  isLoading={isTableLoading}
                  onEditRow={handleEditRow}
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
