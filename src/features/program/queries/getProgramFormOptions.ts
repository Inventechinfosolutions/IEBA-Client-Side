import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

import {
  type QueryApiEnvelope as ApiEnvelope,
  type QueryPaginationMeta as PaginationMeta,
  type DepartmentResDto,
  type ProgramFormSection,
  type QueryBudgetUnitResDto as BudgetUnitResDto,
} from "../types"

function isActiveStatus(status: unknown): boolean {
  if (typeof status === "boolean") return status
  if (typeof status === "string") return status.toLowerCase() === "active"
  return true
}

type PagedEnvelope<T> = { data?: T; meta?: PaginationMeta }

async function fetchProgramFormOptions(
  contextTab?: string,
  activeSection?: ProgramFormSection,
  departmentIds?: number[]
) {
  // Decide upfront what needs to be fetched so we can skip /departments/all
  // whenever department data is already embedded in the child entity response.
  const shouldLoadBudgetUnits =
    contextTab !== "Time Study programs" && activeSection === "BU Program"

  const shouldLoadBudgetPrograms =
    (contextTab === "Budget Units" && activeSection === "BU Sub-Program") ||
    (!contextTab && activeSection == null)

  const shouldLoadDepartments =
    (contextTab === "Budget Units" && activeSection === "Budget Unit") ||
    (contextTab === "Time Study programs" && activeSection === "BU Program") ||
    contextTab === "Program Activity Relation" ||
    (!contextTab && activeSection == null)

  let departmentOptions: string[] = []
  let departmentIdByName: Record<string, number> = {}

  // Only fetch /departments/all for the Budget Unit section (1st tab) —
  // every other section derives department from its embedded parent entity.
  if (shouldLoadDepartments) {
    const res = await api.get<any>("/departments/all?status=active")
    const envelope = res?.data ?? res
    const departments: DepartmentResDto[] = Array.isArray(envelope)
      ? envelope
      : Array.isArray(envelope?.data)
        ? envelope.data
        : []

    const activeDepartments = departments
      .filter((d) => isActiveStatus(d.status))
      .filter((d) => !departmentIds || (typeof d.id === "number" && departmentIds.includes(d.id)))
      .map((d) => ({
        id: typeof d.id === "number" ? d.id : null,
        name: typeof d.name === "string" ? d.name.trim() : "",
      }))
      .filter((d) => d.id != null && d.name)

    departmentOptions = activeDepartments
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

    for (const d of activeDepartments) {
      departmentIdByName[d.name] = d.id as number
    }
  }

  const budgetUnitLookup: Record<string, { code: string; department: string }> = {}
  const budgetUnitIdByName: Record<string, number> = {}
  let budgetUnitNameOptions: string[] = []

  if (shouldLoadBudgetUnits) {
    // Simple fetch — no page, limit, or sort params.
    // Department info is embedded in each budget unit, so we also build
    // departmentIdByName and departmentOptions here to avoid a separate /departments/all call.
    const raw = await api.get<PagedEnvelope<unknown>>("/budgetunits?status=active")
    const payload = (raw?.data ?? raw) as PagedEnvelope<unknown>
    const list = Array.isArray(payload?.data) ? (payload.data as BudgetUnitResDto[]) : []

    const activeBudgetUnits = list.filter((bu) => {
      if (!isActiveStatus(bu.status)) return false
      if (departmentIds && bu.department?.id && !departmentIds.includes(bu.department.id))
        return false
      return true
    })

    budgetUnitNameOptions = activeBudgetUnits
      .map((bu) => (typeof bu.name === "string" ? bu.name.trim() : ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

    const departmentSet = new Set<string>()

    for (const bu of activeBudgetUnits) {
      const name = typeof bu.name === "string" ? bu.name.trim() : ""
      if (!name) continue
      const code = typeof bu.code === "string" ? bu.code : ""
      const deptName =
        bu.department && typeof bu.department.name === "string" ? bu.department.name.trim() : ""
      const deptId =
        bu.department && typeof bu.department.id === "number" ? bu.department.id : undefined

      budgetUnitLookup[name] = { code, department: deptName }
      if (typeof bu.id === "number") budgetUnitIdByName[name] = bu.id

      if (deptName && deptId != null) {
        departmentIdByName[deptName] = deptId
        departmentSet.add(deptName)
      }
    }

    departmentOptions = Array.from(departmentSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )
  }

  let budgetProgramNameOptions: string[] = []
  let budgetProgramLookup: Record<string, { code: string; department: string; budgetUnitId?: number; departmentId?: number }> = {}
  let budgetProgramIdByName: Record<string, number> = {}

  if (shouldLoadBudgetPrograms) {
    const result = await fetchActiveBudgetProgramsForBuSubProgram(departmentIds)
    budgetProgramNameOptions = result.budgetProgramNameOptions
    budgetProgramLookup = result.budgetProgramLookup
    budgetProgramIdByName = result.budgetProgramIdByName
    // Merge department data extracted from the budget programs response
    for (const [name, id] of Object.entries(result.departmentIdByName)) {
      if (!departmentIdByName[name]) departmentIdByName[name] = id
    }
    departmentOptions = result.departmentOptions
  }

  return {
    departmentOptions,
    departmentIdByName,
    budgetUnitNameOptions,
    budgetProgramNameOptions,
    budgetUnitLookup,
    budgetProgramLookup,
    budgetUnitIdByName,
    budgetProgramIdByName,
  }
}

export function useGetProgramFormOptions(
  enabled = true,
  contextTab?: string,
  activeSection?: ProgramFormSection,
  departmentIds?: number[]
) {
  return useQuery({
    queryKey: ["program", "form-options", contextTab, activeSection, departmentIds],
    queryFn: () => fetchProgramFormOptions(contextTab, activeSection, departmentIds),
    // Short stale window so switching Program tabs / modal sections picks up fresh lookups.
    staleTime: 0,
    gcTime: 0,
    enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  })
}

// Active Budget Programs (type=program) for BU Sub-Program tab (Budget Unit Program Name dropdown).
async function fetchActiveBudgetProgramsForBuSubProgram(
  departmentIds?: number[],
  includeSubPrograms?: boolean
) {
  const search = new URLSearchParams()
  search.set("status", "active")
  if (!includeSubPrograms) {
    search.set("type", "program")
  }
  if (departmentIds && departmentIds.length > 0) {
    search.set("departmentId", departmentIds[0].toString())
  }
  const raw = await api.get<PagedEnvelope<unknown>>(`/budgetprograms?${search.toString()}`)
  const payload = (raw?.data ?? raw) as PagedEnvelope<unknown>
  const items = (Array.isArray(payload?.data) ? payload.data : []) as Array<{
    id?: number
    code?: string
    name?: string
    status?: unknown
    type?: string
    department?: DepartmentResDto | null
    budgetUnit?: { id?: number; name?: string; code?: string } | null
  }>

  const activePrograms = items.filter((p) => {
    if (!isActiveStatus(p.status)) return false
    if (departmentIds && p.department?.id && !departmentIds.includes(p.department.id)) return false
    return true
  })

  const budgetProgramNameOptions = activePrograms
    .map((p) => {
      const name = typeof p.name === "string" ? p.name.trim() : ""
      if (includeSubPrograms) {
        const code = typeof p.code === "string" ? p.code : ""
        return code ? `${code} - ${name}` : name
      }
      return name
    })
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

  const budgetProgramLookup: Record<string, { code: string; department: string; budgetUnitId?: number; departmentId?: number }> = {}
  const budgetProgramIdByName: Record<string, number> = {}
  const departmentIdByName: Record<string, number> = {}
  const departmentSet = new Set<string>()

  for (const p of activePrograms) {
    const name = typeof p.name === "string" ? p.name.trim() : ""
    if (!name) continue
    const code = typeof p.code === "string" ? p.code : ""
    const key = includeSubPrograms && code ? `${code} - ${name}` : name
    const deptName =
      p.department && typeof p.department.name === "string" ? p.department.name.trim() : ""
    const deptId =
      p.department && typeof p.department.id === "number" ? p.department.id : undefined
    const budgetUnitId =
      p.budgetUnit && typeof p.budgetUnit.id === "number" ? p.budgetUnit.id : undefined

    // Store budgetUnitId + departmentId so the create flow can skip getById
    budgetProgramLookup[key] = { code, department: deptName, budgetUnitId, departmentId: deptId }

    if (typeof p.id === "number") budgetProgramIdByName[key] = p.id
    if (deptName && deptId != null) {
      departmentIdByName[deptName] = deptId
      departmentSet.add(deptName)
    }
  }

  const departmentOptions = Array.from(departmentSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )

  return {
    budgetProgramNameOptions,
    budgetProgramLookup,
    budgetProgramIdByName,
    departmentIdByName,
    departmentOptions,
  }
}

export function useGetActiveBuProgramsForDepartment(
  enabled: boolean,
  departmentIds?: number[],
  includeSubPrograms?: boolean
) {
  return useQuery({
    queryKey: ["program", "form-options", "budgetprograms", "type-program", departmentIds, includeSubPrograms],
    queryFn: () => fetchActiveBudgetProgramsForBuSubProgram(departmentIds, includeSubPrograms),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useActiveBuProgramsForSubProgram(enabled: boolean) {
  return useQuery({
    queryKey: ["program", "form-options", "budgetprograms", "type-program"],
    queryFn: () => fetchActiveBudgetProgramsForBuSubProgram(),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Active Time Study Primary Programs (type=primary) for TS Sub-Program One tab (TS Program dropdown).
async function fetchActivePrimaryTimeStudyPrograms(departmentIds?: number[]) {
  // For the TS Program dropdown we don't need full pagination support,
  // just a single fetch with a high enough limit to cover all active primary programs.
  const search = new URLSearchParams()
  search.set("status", "active")
  search.set("type", "primary")
  if (departmentIds && departmentIds.length > 0) {
    search.set("departmentIds", departmentIds.join(","))
  }

  const raw = await api.get<ApiEnvelope<{ data?: {
    id?: number
    code?: string
    name?: string
    status?: unknown
    type?: string
    department?: DepartmentResDto | null
    budgetProgram?: { id?: number; name?: string; code?: string } | null
  }[]; meta?: PaginationMeta }>>(`/timestudyprograms?${search.toString()}`)
  const payload = raw?.data ?? raw
  const list = Array.isArray(payload?.data) ? payload.data : []

  const activePrograms = list.filter((p) => isActiveStatus(p.status))

  const budgetProgramNameOptions = activePrograms
    .map((p) => (typeof p.name === "string" ? p.name.trim() : ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

  const budgetProgramLookup: Record<string, { code: string; department: string }> = {}
  const budgetProgramIdByName: Record<string, number> = {}
  const timeStudyProgramIdByName: Record<string, number> = {}
  const departmentIdByName: Record<string, number> = {}

  for (const p of activePrograms) {
    const name = typeof p.name === "string" ? p.name.trim() : ""
    if (!name) continue
    const bpCode = p.budgetProgram && typeof p.budgetProgram.code === "string" ? p.budgetProgram.code.trim() : ""
    const bpName = p.budgetProgram && typeof p.budgetProgram.name === "string" ? p.budgetProgram.name.trim() : ""
    const formattedBp = bpCode && bpName ? `${bpCode} - ${bpName}` : bpCode || bpName
    const deptName =
      p.department && typeof p.department.name === "string" ? p.department.name : ""
    const deptId =
      p.department && typeof p.department.id === "number" ? p.department.id : undefined
      
    budgetProgramLookup[name] = {
      code: formattedBp,
      department: deptName,
    }
    const bpId = p.budgetProgram && typeof p.budgetProgram.id === "number" ? p.budgetProgram.id : undefined
    if (bpId != null) {
      budgetProgramIdByName[name] = bpId
    }
    if (typeof p.id === "number") {
      timeStudyProgramIdByName[name] = p.id
    }
    if (deptName && deptId != null) {
      departmentIdByName[deptName] = deptId
    }
  }

  return {
    budgetProgramNameOptions,
    budgetProgramLookup,
    budgetProgramIdByName,
    timeStudyProgramIdByName,
    departmentIdByName,
  }
}

export function useGetActivePrimaryTimeStudyPrograms(enabled: boolean, departmentIds?: number[]) {
  return useQuery({
    queryKey: ["program", "form-options", "timestudyprograms", "type-primary", departmentIds],
    queryFn: () => fetchActivePrimaryTimeStudyPrograms(departmentIds),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Active Time Study Secondary Programs (type=secondary) for TS Sub-Program Two tab (TS Program dropdown).
async function fetchActiveSecondaryTimeStudyPrograms(departmentIds?: number[]) {
  const search = new URLSearchParams()
  search.set("status", "active")
  search.set("type", "secondary")
  if (departmentIds && departmentIds.length > 0) {
    search.set("departmentIds", departmentIds.join(","))
  }

  const raw = await api.get<ApiEnvelope<{ data?: {
    id?: number
    code?: string
    name?: string
    status?: unknown
    type?: string
    department?: DepartmentResDto | null
    budgetProgram?: { id?: number; name?: string; code?: string } | null
  }[]; meta?: PaginationMeta }>>(`/timestudyprograms?${search.toString()}`)
  const payload = raw?.data ?? raw
  const list = Array.isArray(payload?.data) ? payload.data : []

  const activePrograms = list.filter((p) => isActiveStatus(p.status))

  const budgetProgramNameOptions = activePrograms
    .map((p) => (typeof p.name === "string" ? p.name.trim() : ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

  const budgetProgramLookup: Record<string, { code: string; department: string }> = {}
  const budgetProgramIdByName: Record<string, number> = {}
  const timeStudyProgramIdByName: Record<string, number> = {}
  const departmentIdByName: Record<string, number> = {}

  for (const p of activePrograms) {
    const name = typeof p.name === "string" ? p.name.trim() : ""
    if (!name) continue
    const bpCode = p.budgetProgram && typeof p.budgetProgram.code === "string" ? p.budgetProgram.code.trim() : ""
    const bpName = p.budgetProgram && typeof p.budgetProgram.name === "string" ? p.budgetProgram.name.trim() : ""
    const formattedBp = bpCode && bpName ? `${bpCode} - ${bpName}` : bpCode || bpName
    const deptName =
      p.department && typeof p.department.name === "string" ? p.department.name : ""
    const deptId =
      p.department && typeof p.department.id === "number" ? p.department.id : undefined

    budgetProgramLookup[name] = {
      code: formattedBp,
      department: deptName,
    }
    const bpId = p.budgetProgram && typeof p.budgetProgram.id === "number" ? p.budgetProgram.id : undefined
    if (bpId != null) {
      budgetProgramIdByName[name] = bpId
    }
    if (typeof p.id === "number") {
      timeStudyProgramIdByName[name] = p.id
    }
    if (deptName && deptId != null) {
      departmentIdByName[deptName] = deptId
    }
  }

  return {
    budgetProgramNameOptions,
    budgetProgramLookup,
    budgetProgramIdByName,
    timeStudyProgramIdByName,
    departmentIdByName,
  }
}

export function useGetActiveSecondaryTimeStudyPrograms(enabled: boolean, departmentIds?: number[]) {
  return useQuery({
    queryKey: ["program", "form-options", "timestudyprograms", "type-secondary", departmentIds],
    queryFn: () => fetchActiveSecondaryTimeStudyPrograms(departmentIds),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
