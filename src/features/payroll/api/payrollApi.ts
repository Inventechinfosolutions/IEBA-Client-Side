import { getToken } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"
import { api } from "@/lib/api"
import type { GetPayrollRowsParams, PayrollFilterOptionsResponse } from "../types"
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
 * GET /api/v1/department?method=users&departmentId=<id>
 */
export async function fetchDepartmentUsers(departmentId: string): Promise<any[]> {
  if (!departmentId || departmentId === "all") return []

  const res = await api.get<any>(`/department?method=users&departmentId=${departmentId}`)
  // The API likely returns { success: true, data: [...] } or just [...]
  // Based on other patterns, it might be in res.data
  return res?.data || res || []
}

/**
 * Fetches payroll management rows based on active filters.
 * GET /api/v1/payrollmanagement?payrollType=<type>&fiscalYear=<label>&limit=1000&month=<val>&departmentcode=<code>&empIds=<ids>
 */
export async function fetchPayrollRows(params: GetPayrollRowsParams): Promise<any[]> {
  const search = new URLSearchParams()
  search.set("payrollType", params.payrollType.toLowerCase())
  search.set("fiscalYear", params.fiscalYearLabel)
  search.set("limit", "1000")

  // Map "m-01" -> 1, "m-12" -> 12
  if (params.monthOrQuarterId.startsWith("m-")) {
    const m = parseInt(params.monthOrQuarterId.replace("m-", ""), 10)
    if (!isNaN(m)) search.set("month", String(m))
  } else if (params.monthOrQuarterId.startsWith("q-")) {
    search.set("quarter", params.monthOrQuarterId.replace("q-", ""))
  }

  if (params.departmentCode && params.departmentCode !== "all") {
    search.set("departmentcode", params.departmentCode)
  }

  if (params.employeeIds.length > 0) {
    search.set("empIds", params.employeeIds.join(","))
  }

  const res = await api.get<any>(`/payrollmanagement?${search.toString()}`)
  // Assuming standard { success: true, data: [...] } or direct array
  const data = res?.data || res || []
  return Array.isArray(data) ? data : data.data || []
}
