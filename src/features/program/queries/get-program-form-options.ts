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

async function fetchAllPages<TItem>(
  path: string,
  pick: (payload: PagedEnvelope<unknown>) => { items: TItem[]; meta?: PaginationMeta }
): Promise<TItem[]> {
  const all: TItem[] = []
  let page = 1
  const limit = 100

  for (let guard = 0; guard < 50; guard++) {
    const [basePath, existingQuery = ""] = path.split("?", 2)
    const search = new URLSearchParams()
    // Ensure page & limit come first, then any existing query params (e.g. sort, status)
    search.set("page", String(page))
    search.set("limit", String(limit))
    if (existingQuery) {
      for (const pair of existingQuery.split("&")) {
        if (!pair) continue
        const [key, value = ""] = pair.split("=", 2)
        if (!key) continue
        search.append(key, value)
      }
    }

    const raw = await api.get<PagedEnvelope<unknown>>(`${basePath}?${search.toString()}`)
    const payload: PagedEnvelope<unknown> = (raw?.data ?? raw) as PagedEnvelope<unknown>
    const { items, meta } = pick(payload)
    all.push(...items)

    const hasNext =
      typeof meta?.hasNextPage === "boolean"
        ? meta.hasNextPage
        : typeof meta?.currentPage === "number" && typeof meta?.totalPages === "number"
          ? meta.currentPage < meta.totalPages
          : items.length === limit

    if (!hasNext) break
    page += 1
  }

  return all
}

async function fetchProgramFormOptions(contextTab?: string, activeSection?: ProgramFormSection) {
  const departments = await fetchAllPages<DepartmentResDto>(
    "/departments?sort=ASC&status=active",
    (payload) => ({
      items: Array.isArray(payload?.data) ? payload.data : [],
      meta: payload?.meta,
    })
  )

  const activeDepartments = departments
    .filter((d) => isActiveStatus(d.status))
    .map((d) => ({
      id: typeof d.id === "number" ? d.id : null,
      name: typeof d.name === "string" ? d.name.trim() : "",
    }))
    .filter((d) => d.id != null && d.name)

  const departmentOptions = activeDepartments
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

  const departmentIdByName: Record<string, number> = {}
  for (const d of activeDepartments) {
    // if duplicates exist, last one wins (rare; backend should keep names unique)
    departmentIdByName[d.name] = d.id as number
  }

  const budgetUnitLookup: Record<string, { code: string; department: string }> = {}
  const budgetUnitIdByName: Record<string, number> = {}
  let budgetUnitNameOptions: string[] = []

  const shouldLoadBudgetUnits =
    contextTab !== "Time Study programs" && activeSection === "BU Program"

  if (shouldLoadBudgetUnits) {
    const budgetUnits = await fetchAllPages<BudgetUnitResDto>(
      "/budgetunits?sort=ASC&status=active",
      (payload) => ({
        items: Array.isArray(payload?.data) ? payload.data : [],
        meta: payload?.meta as PaginationMeta | undefined,
      })
    )

    const activeBudgetUnits = budgetUnits.filter((bu) => isActiveStatus(bu.status))

    budgetUnitNameOptions = activeBudgetUnits
      .map((bu) => (typeof bu.name === "string" ? bu.name.trim() : ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

    for (const bu of activeBudgetUnits) {
      const name = typeof bu.name === "string" ? bu.name.trim() : ""
      if (!name) continue
      const code = typeof bu.code === "string" ? bu.code : ""
      const deptName =
        bu.department && typeof bu.department.name === "string" ? bu.department.name : ""
      budgetUnitLookup[name] = {
        code,
        department: deptName,
      }
      if (typeof bu.id === "number") {
        budgetUnitIdByName[name] = bu.id
      }
    }
  }

  // Load active Budget Programs (type=program) only when needed:
  // - Budget Units tab, BU Sub-Program section (for BU Sub-Program parent selection)
  // - Time Study tab, BU Program section (for TS Primary Program "Budget (BU) Program" dropdown)
  // - Other callers that don't pass an activeSection (e.g. Program Activity Relation filters)
  let budgetProgramNameOptions: string[] = []
  let budgetProgramLookup: Record<string, { code: string; department: string }> = {}
  let budgetProgramIdByName: Record<string, number> = {}

  const shouldLoadBudgetPrograms =
    // Budget Units → BU Sub-Program
    (contextTab === "Budget Units" && activeSection === "BU Sub-Program") ||
    // Time Study → BU Program (TS Primary) needs BU Programs list
    (contextTab === "Time Study programs" && activeSection === "BU Program") ||
    // Fallback callers (no explicit section)
    (!contextTab && activeSection == null)

  if (shouldLoadBudgetPrograms) {
    const result = await fetchActiveBudgetProgramsForBuSubProgram()
    budgetProgramNameOptions = result.budgetProgramNameOptions
    budgetProgramLookup = result.budgetProgramLookup
    budgetProgramIdByName = result.budgetProgramIdByName
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
  activeSection?: ProgramFormSection
) {
  return useQuery({
    queryKey: ["program", "form-options", contextTab, activeSection],
    queryFn: () => fetchProgramFormOptions(contextTab, activeSection),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    enabled,
    // We only want this to run when the modal opens or the section changes,
    // not again after save due to window focus or remounts.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}

// Active Budget Programs (type=program) for BU Sub-Program tab (Budget Unit Program Name dropdown).
async function fetchActiveBudgetProgramsForBuSubProgram() {
  const items = await fetchAllPages<{
    id?: number
    code?: string
    name?: string
    status?: unknown
    type?: string
    department?: DepartmentResDto | null
  }>(
    "/budgetprograms?sort=ASC&status=active&type=program",
    (payload) => ({
      items: Array.isArray(payload?.data) ? payload.data : [],
      meta: payload?.meta as PaginationMeta | undefined,
    })
  )

  const activePrograms = items.filter((p) => isActiveStatus(p.status))

  const budgetProgramNameOptions = activePrograms
    .map((p) => (typeof p.name === "string" ? p.name.trim() : ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

  const budgetProgramLookup: Record<string, { code: string; department: string }> = {}
  const budgetProgramIdByName: Record<string, number> = {}

  for (const p of activePrograms) {
    const name = typeof p.name === "string" ? p.name.trim() : ""
    if (!name) continue
    const code = typeof p.code === "string" ? p.code : ""
    const deptName =
      p.department && typeof p.department.name === "string" ? p.department.name : ""
    budgetProgramLookup[name] = {
      code,
      department: deptName,
    }
    if (typeof p.id === "number") {
      budgetProgramIdByName[name] = p.id
    }
  }

  return {
    budgetProgramNameOptions,
    budgetProgramLookup,
    budgetProgramIdByName,
  }
}

export function useActiveBuProgramsForSubProgram(enabled: boolean) {
  return useQuery({
    queryKey: ["program", "form-options", "budgetprograms", "type-program"],
    queryFn: () => fetchActiveBudgetProgramsForBuSubProgram(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

// Active Time Study Primary Programs (type=primary) for TS Sub-Program One tab (TS Program dropdown).
async function fetchActivePrimaryTimeStudyPrograms() {
  // For the TS Program dropdown we don't need full pagination support,
  // just a single fetch with a high enough limit to cover all active primary programs.
  const search = new URLSearchParams()
  search.set("page", "1")
  // Backend enforces max limit=100
  search.set("limit", "100")
  search.set("sort", "ASC")
  search.set("status", "active")
  search.set("type", "primary")

  const raw = await api.get<ApiEnvelope<{ data?: {
    id?: number
    code?: string
    name?: string
    status?: unknown
    type?: string
    department?: DepartmentResDto | null
  }[]; meta?: PaginationMeta }>>(`/timestudyprograms?${search.toString()}`)
  const payload = raw?.data ?? raw
  const list = Array.isArray(payload?.data) ? payload.data : []

  const activePrograms = list.filter((p) => isActiveStatus(p.status))

  const budgetProgramNameOptions = activePrograms
    .map((p) => (typeof p.name === "string" ? p.name.trim() : ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

  const budgetProgramLookup: Record<string, { code: string; department: string }> = {}

  for (const p of activePrograms) {
    const name = typeof p.name === "string" ? p.name.trim() : ""
    if (!name) continue
    const code = typeof p.code === "string" ? p.code : ""
    const deptName =
      p.department && typeof p.department.name === "string" ? p.department.name : ""
    budgetProgramLookup[name] = {
      code,
      department: deptName,
    }
  }

  return {
    budgetProgramNameOptions,
    budgetProgramLookup,
  }
}

export function useGetActivePrimaryTimeStudyPrograms(enabled: boolean) {
  return useQuery({
    queryKey: ["program", "form-options", "timestudyprograms", "type-primary"],
    queryFn: () => fetchActivePrimaryTimeStudyPrograms(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

