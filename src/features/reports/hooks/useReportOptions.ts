import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { mapIdNameRowsToSelectOptions } from "@/lib/utils"
import { useGetDepartments } from "@/features/department/queries/getDepartments"
import { useCostPoolListQuery } from "@/features/cost-pool/queries/getCostPools"
import { useGetUserModuleRows } from "@/features/user/queries/getUsers"
import { useListFiscalYears } from "@/features/settings/queries/listFiscalYears"
import { 
  useGetMaaEmployees, 
  useGetCostPoolUsers, 
  useGetMaaTcmActivityDepartments,
  useGetListAllPrograms,
  useGetUsersUnderDepartment,
  useGetActivitiesByDepartmentAndUsers,
  useGetCostPoolsByDepartment
} from "../queries/getDynamicFilters"
import { REPORT_QUARTERS, REPORT_DOWNLOAD_TYPES } from "../schemas"
import type { ReportCatalogItem, ReportSelectOption } from "../types"

interface UseReportOptionsProps {
  reportKey: string
  currentReportItem?: ReportCatalogItem
  departmentId?: string
  activityIdsArr: string[]
  costPoolIdsArr: string[]
  selectedEmployeeIds: string[]
}

export function useReportOptions({
  reportKey,
  currentReportItem,
  departmentId,
  activityIdsArr,
  costPoolIdsArr,
  selectedEmployeeIds,
}: UseReportOptionsProps) {
  const { user } = useAuth()

  const isMaaReport = useMemo(() => reportKey.includes("MAA") || reportKey.includes("TCM"), [reportKey])
  const isCostPoolReport = useMemo(() => reportKey === "DSSRPT3" || reportKey === "DSSRPT4", [reportKey])

  // Queries
  const { data: maaEmployeesData } = useGetMaaEmployees(activityIdsArr, departmentId, isMaaReport)
  const { data: costPoolUsersData } = useGetCostPoolUsers(costPoolIdsArr, user?.id ?? "", ["active"], isCostPoolReport)
  const shouldFetchDepartmentUsers = !!departmentId && !isMaaReport && !isCostPoolReport
  const { data: departmentUsersData } = useGetUsersUnderDepartment(
    departmentId, 
    user?.id ?? "", 
    shouldFetchDepartmentUsers
  )
  const shouldFetchActivities = currentReportItem?.criteria?.showActivitySelect === true && !!departmentId
  const { data: activitiesByDepartmentData } = useGetActivitiesByDepartmentAndUsers(
    departmentId,
    selectedEmployeeIds,
    shouldFetchActivities && selectedEmployeeIds.length > 0,
  )

  const shouldFetchCostPoolsByDept = currentReportItem?.criteria?.showCostPoolSelect === true && !!departmentId
  const { data: costPoolsByDeptData } = useGetCostPoolsByDepartment(
    departmentId,
    shouldFetchCostPoolsByDept,
  )

  const { data: fiscalYearsData } = useListFiscalYears()
  const { data: departmentsData } = useGetDepartments({ status: "active", page: 1, limit: 100 })
  const { data: maaTcmDepartmentsData } = useGetMaaTcmActivityDepartments(isMaaReport)
  const { data: listAllProgramsData } = useGetListAllPrograms(currentReportItem?.criteria?.showProgramSelect === true)
  const { data: costPoolsData } = useCostPoolListQuery({ status: "active", page: 1, limit: 100 }, { enabled: currentReportItem?.criteria?.showCostPoolSelect === true })
  const { data: employeesData } = useGetUserModuleRows({ 
    inactiveOnly: false, 
    page: 1, 
    pageSize: 100 
  }, { enabled: !departmentId && !isMaaReport && !isCostPoolReport })

  // Memoized Options
  const fiscalYearOptions = useMemo(
    () => (fiscalYearsData ? fiscalYearsData.map((fy) => ({ value: fy.id, label: fy.label || fy.id })) : []),
    [fiscalYearsData],
  )

  const quarterOptions = useMemo(
    () => REPORT_QUARTERS.map((q) => ({ value: q, label: q })),
    [],
  )

  const departmentOptions = useMemo(() => {
    return (departmentsData?.items ? mapIdNameRowsToSelectOptions(departmentsData.items) : [])
  }, [departmentsData])

  const employeeOptions = useMemo(() => {
    if (isMaaReport && maaEmployeesData) {
      return maaEmployeesData
    }
    if (isCostPoolReport && costPoolUsersData) {
      return costPoolUsersData
    }
    if (departmentId && departmentUsersData) {
      return departmentUsersData
    }
    return employeesData?.items 
      ? mapIdNameRowsToSelectOptions(employeesData.items.map(u => ({ id: u.id, name: u.employee })))
      : []
  }, [isMaaReport, isCostPoolReport, maaEmployeesData, costPoolUsersData, departmentUsersData, departmentId, employeesData])

  const activityOptions = useMemo(() => {
    if (isMaaReport && maaTcmDepartmentsData) {
      return maaTcmDepartmentsData
    }
    if (!shouldFetchActivities) return []
    return activitiesByDepartmentData ?? []
  }, [isMaaReport, maaTcmDepartmentsData, shouldFetchActivities, activitiesByDepartmentData])

  const costPoolOptions = useMemo(() => {
    if (shouldFetchCostPoolsByDept && costPoolsByDeptData) {
      return costPoolsByDeptData
    }
    return costPoolsData?.items ? mapIdNameRowsToSelectOptions(costPoolsData.items) : []
  }, [shouldFetchCostPoolsByDept, costPoolsByDeptData, costPoolsData])

  const programOptions = useMemo(() => {
    return listAllProgramsData || []
  }, [listAllProgramsData])

  const downloadTypeOptions = useMemo(
    () => REPORT_DOWNLOAD_TYPES.map((t) => ({ value: t, label: t })),
    [],
  )

  return {
    fiscalYearOptions,
    quarterOptions,
    departmentOptions,
    employeeOptions,
    activityOptions,
    costPoolOptions,
    programOptions,
    downloadTypeOptions,
    isMaaReport,
    isCostPoolReport,
  }
}
