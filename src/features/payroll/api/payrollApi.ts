import { getToken } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"
import { api } from "@/lib/api"
import type { 
  DepartmentUser, 
  GetPayrollRowsParams, 
  PayrollFilterOptionsResponse, 
  PayrollManagementRow 
} from "../types"
import { getAllDepartments } from "@/features/department/api/departments"
import { fetchListFiscalYears } from "@/features/settings/queries/listFiscalYears"

const BASE = API_BASE_URL

/**
 * Upload a payroll Excel file via multipart form-data.
 * POST /api/v1/payrollmanagement/upload/form
 */
export async function uploadPayrollForm(file: File, payrolltype: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("payrolltype", payrolltype.trim().toLowerCase())

  const token = getToken()
  const response = await fetch(`${BASE}/payrollmanagement/upload/form`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const raw = (errorBody as { message?: string | string[] }).message
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : typeof raw === "string" && raw.trim()
        ? raw
        : response.statusText
    throw new Error(message)
  }

  const body = await response.json()
  return (body as { data?: unknown }).data ?? body
}

/**
 * Download the payroll Excel template.
 * GET /api/v1/payrollmanagement/download
 * Returns a Blob for the caller to save.
 */
export async function downloadPayrollTemplate(): Promise<Blob> {
  const token = getToken()
  const response = await fetch(`${BASE}/payrollmanagement/download`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`)
  }

  return await response.blob()
}

/**
 * Fetches fiscal years, departments, and payroll settings to populate the filter dropdowns.
 */
export async function fetchPayrollFilterOptions(): Promise<PayrollFilterOptionsResponse> {
  const [fiscalYearRows, deptRes] = await Promise.all([
    fetchListFiscalYears(),
    getAllDepartments({ sort: "ASC", status: "active" }),
  ])

  const fiscalYears = fiscalYearRows.map((fy) => ({
    value: fy.id,
    label: fy.label,
  }))

  const departments = deptRes.items.map((d) => ({
    value: String(d.id),
    label: d.name,
    metadata: { code: d.code },
  }))

  const monthOptions = [
    { value: "m-all", label: "All Months" },
    { value: "m-01", label: "January" },
    { value: "m-02", label: "February" },
    { value: "m-03", label: "March" },
    { value: "m-04", label: "April" },
    { value: "m-05", label: "May" },
    { value: "m-06", label: "June" },
    { value: "m-07", label: "July" },
    { value: "m-08", label: "August" },
    { value: "m-09", label: "September" },
    { value: "m-10", label: "October" },
    { value: "m-11", label: "November" },
    { value: "m-12", label: "December" },
  ]
  const quarterOptions = [
    { value: "q-1", label: "Q1" },
    { value: "q-2", label: "Q2" },
    { value: "q-3", label: "Q3" },
    { value: "q-4", label: "Q4" },
  ]

  return {
    fiscalYears,
    monthOptions,
    quarterOptions,
    departments,
    employees: [],
  }
}

/**
 * Fetches users (employees) for a specific department.
 * GET /api/v1/departments?method=users&departmentId=<id>
 */
export async function fetchDepartmentUsers(departmentId: string): Promise<DepartmentUser[]> {
  if (!departmentId || departmentId === "all" || departmentId === "") return []

  const url = `/departments?method=users&departmentId=${departmentId}`
  const res = await api.get<{ data: { userDetails?: DepartmentUser[] } }>(url)

  // Extract the userDetails from the data wrapper
  const userList = res?.data?.userDetails || []
  
  return userList
}

/**
 * Fetches payroll management rows based on active filters using the new paginated API.
 * GET /api/v1/payrollmanagement?payrollType=<type>&fiscalYear=<fy>&month=<m>&departmentCode=<code>&empIds=<ids>&page=1&limit=1000
 */
export async function fetchPayrollRows(params: GetPayrollRowsParams): Promise<PayrollManagementRow[]> {
  const search = new URLSearchParams()
  
  // Use 'payrolltype' (lowercase) which is confirmed working in the new API
  search.set("payrolltype", params.payrollType.toLowerCase())
  search.set("fiscalYear", params.fiscalYearLabel)
  search.set("page", "1")
  search.set("limit", "1000")

  // If "All Months" is selected, send the explicit list of all month numbers to be safe
  const ALL_MONTHS_LIST = "1,2,3,4,5,6,7,8,9,10,11,12"

  if (params.monthOrQuarterId === "m-all") {
    search.set("month", ALL_MONTHS_LIST)
  } else if (params.monthOrQuarterId.startsWith("m-")) {
    const m = parseInt(params.monthOrQuarterId.replace("m-", ""), 10)
    if (!isNaN(m)) {
      search.set("month", String(m))
    }
  } else if (params.monthOrQuarterId.startsWith("q-")) {
    const qNum = params.monthOrQuarterId.replace("q-", "")
    // Fiscal Year starts in July:
    // Q1 -> 7,8,9 | Q2 -> 10,11,12 | Q3 -> 1,2,3 | Q4 -> 4,5,6
    const mapping: Record<string, string> = {
      "1": "7,8,9",
      "2": "10,11,12",
      "3": "1,2,3",
      "4": "4,5,6",
    }
    search.set("month", mapping[qNum] || ALL_MONTHS_LIST)
  } else {
    search.set("month", ALL_MONTHS_LIST)
  }

  if (params.departmentCode && params.departmentCode !== "all") {
    // Send both variants to be super safe
    search.set("departmentcode", params.departmentCode)
    search.set("departmentCode", params.departmentCode)
  }

  if (params.employeeIds.length > 0) {
    search.set("empIds", params.employeeIds.join(","))
  }

  // Double check payrollType variants
  search.set("payrolltype", params.payrollType.toLowerCase())
  search.set("payrollType", params.payrollType.toLowerCase())

  // Note: We manually build the query string to keep commas unencoded as requested (e.g. 1,2,3)
  const queryString = Array.from(search.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  const res = await api.get<{ data: { items: any[] } }>(`/payrollmanagement?${queryString}`)
  
  // The backend response body has a 'data' property which contains 'items'
  const items = res?.data?.items || []

  return items.map((row: any): PayrollManagementRow => ({
    ...row,
    employeeId: row.employeeid,
    employeeFirstName: row.employeefirstname,
    employeeLastName: row.employeelastname,
    employeeMiddleName: row.employeemiddlename,
    suffix: row.suffix,
    department: row.department,
    bargainingUnit: row.bargainingunit,
    type: row.type,
    position: row.position,
    payPeriodBegin: row.payperiodbegin,
    payPeriodEnd: row.payperiodend,
    checkDate: row.checkdate,
    fica: row.fica,
    pers: row.pers,
    defComp: row.defcomp,
    cafeteria: row.cafeteria,
    lifeInsurance: row.lifeinsurance,
    standby: row.standby,
    spa: row.spa,
    cellStipend: row.cellstipend,
    std: row.std,
    ot: row.ot,
    recruitingIncentive: row.recruitingincentive,
    cashOut: row.cashout,
    payout: row.payout,
    salary: row.salary,
  }))
}
