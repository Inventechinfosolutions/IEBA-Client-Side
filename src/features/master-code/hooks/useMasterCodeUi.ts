import { useCallback, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  MASTER_CODE_TYPE_TAB_ORDER,
  type MasterCodeFormMode,
  type MasterCodeFormValues,
  type MasterCodeRow,
  type MasterCodeTab,
} from "../types"
import { MasterCodeTypeEnum } from "../enums/masterCodeType"

/** Counties that are allowed to see the CDSS master-code tab. */
const CDSS_ENABLED_COUNTIES = new Set<string>(["TUOLUMNE"])

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

export function useMasterCodeUI() {
  const { user } = useAuth()
  const countyName = (user?.countyName ?? "").trim().toUpperCase()
  const tabs = useMemo<MasterCodeTab[]>(
    () =>
      CDSS_ENABLED_COUNTIES.has(countyName)
        ? MASTER_CODE_TYPE_TAB_ORDER
        : MASTER_CODE_TYPE_TAB_ORDER.filter((t) => t !== MasterCodeTypeEnum.CDSS),
    [countyName],
  )
  const [selectedTab, setSelectedTab] = useState<MasterCodeTab | null>(null)
  const [inactiveOnly, setInactiveOnly] = useState(false)
  const [allowMultiCodesLocal, setAllowMultiCodesLocal] = useState(true)
  const [isTabLoading, setIsTabLoading] = useState(false)
  const [pageByTab, setPageByTab] = useState<Record<string, number>>({})
  const [pageSize, setPageSize] = useState(10)
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<MasterCodeFormMode>("add")
  const [selectedRow, setSelectedRow] = useState<MasterCodeRow | null>(null)
  const [modalSessionId, setModalSessionId] = useState(0)

  const activeTab: MasterCodeTab = useMemo(() => {
    if (tabs.length === 0) return MASTER_CODE_TYPE_TAB_ORDER[0]
    if (selectedTab && tabs.includes(selectedTab)) return selectedTab
    return tabs[0]!
  }, [selectedTab, tabs])

  const currentPage = pageByTab[activeTab] ?? 1

  const handleTabChange = useCallback((nextTab: MasterCodeTab) => {
    setIsTabLoading(true)
    setSelectedTab(nextTab)
    setTimeout(() => setIsTabLoading(false), 400)
  }, [])

  const handlePageChange = useCallback((nextPage: number) => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: nextPage }))
  }, [activeTab])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }))
  }, [activeTab])

  const toggleInactiveOnly = useCallback(() => {
    setInactiveOnly((prev) => !prev)
    setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }))
  }, [activeTab])

  const toggleLocalMultiCodes = useCallback(() => {
    setAllowMultiCodesLocal((prev) => !prev)
  }, [])

  // Modal Actions
  const openAddModal = useCallback(() => {
    setModalMode("add")
    setSelectedRow(null)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((row: MasterCodeRow) => {
    setModalMode("edit")
    setSelectedRow(row)
    setModalSessionId((prev) => prev + 1)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

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
        activityDescription: selectedRow.activityDescription ?? "",
      }
    }
    return emptyFormValues
  }, [modalMode, selectedRow])

  return {
    // Tabs & Filters
    tabs,
    activeTab,
    inactiveOnly,
    allowMultiCodesLocal,
    toggleInactiveOnly,
    toggleLocalMultiCodes,
    handleTabChange,
    isTabLoading,
    
    // Pagination
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    
    // Modal
    modalOpen,
    modalMode,
    modalSessionId,
    selectedRow,
    modalInitialValues,
    openAddModal,
    openEditModal,
    closeModal,
    setModalOpen,
  }
}
