import { ActivityStatusEnum } from "@/features/master-code/enums/activityStatus"
import { normalizeMatch } from "@/features/master-code/api"
import type { ApiActivityCode } from "@/features/master-code/types"
import type { ApiResponseDto } from "@/features/user/types"
import { api } from "@/lib/api"

import { COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT } from "../constants"
import {
  buildDepartmentManualApportioningByNameFromActivity,
  enrichCountyActivityShuttleDepartment,
} from "../lib/countyActivityDepartmentApportioning"
import {
  ApiActivityTypeEnum,
  CountyActivityCatalogMatchDefault,
  CountyActivityGridRowType,
} from "../enums/CountyActivity.enum"
import type {
  ActivityCatalogEnrichmentMap,
  ActivityCatalogEnrichmentValue,
  ActivityDepartmentPageResult,
  ApiActivityDepartmentResDto,
  ApiActivityResDto,
  ApiActivityTreeResDto,
  ApiCountyActivityCreateResponse,
  CountyActivityCodeRow,
  CountyActivityEditPayload,
  CountyActivityListMeta,
  CountyActivityListQueryParams,
  CountyActivityListResponsePayload,
  CreateCountyActivityApiInput,
  MatchStatus,
  PostActivityDepartmentBody,
  PostActivityDepartmentLinksInput,
  SyncActivityDepartmentLinksInput,
  UpdateCountyActivityApiInput,
} from "../types"

function unwrapData<T>(raw: unknown): T {
  if (raw != null && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data
  }
  throw new Error("Invalid API response")
}

function sortDepartmentNameList(names: readonly string[]): string[] {
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  )
}

/** Single apportioning control maps to both API flags on save. */
export function normalizeCountyActivityApportioningFlags(
  apportioning: boolean,
): { apportioning: boolean; manualApportioning: boolean } {
  return apportioning
    ? { apportioning: true, manualApportioning: true }
    : { apportioning: false, manualApportioning: false }
}

export async function apiGetCountyActivityById(id: number): Promise<ApiActivityResDto> {
  const raw = await api.get<unknown>(`/activities/${id}`)
  const data = unwrapData<ApiActivityResDto>(raw)
  if (data == null || typeof data.id !== "number") {
    throw new Error("County activity not found")
  }
  return data
}

/** Normalize GET /activities/:id for edit modal — single apportioning checkbox + enriched shuttle. */
export function enrichCountyActivityDetailDto(activity: ApiActivityResDto): ApiActivityResDto {
  const linkByDeptId = new Map(
    (activity.activityDepartments ?? []).map((link) => [link.departmentId, link]),
  )
  const { apportioning, manualApportioning } = normalizeCountyActivityApportioningFlags(
    activity.apportioning,
  )

  return {
    ...activity,
    apportioning,
    manualApportioning,
    assignedDepartments: (activity.assignedDepartments ?? []).map((dept) =>
      enrichCountyActivityShuttleDepartment(dept, linkByDeptId),
    ),
    unassignedDepartments: (activity.unassignedDepartments ?? []).map((dept) =>
      enrichCountyActivityShuttleDepartment(dept, linkByDeptId),
    ),
  }
}

export async function apiGetCountyActivityForEdit(id: number): Promise<CountyActivityEditPayload> {
  const rawActivity = await apiGetCountyActivityById(id)
  const activity = enrichCountyActivityDetailDto(rawActivity)
  // Use ONLY assignedDepartments — this is the source of truth for what is currently assigned.
  const assignedDepts = activity.assignedDepartments ?? []
  const names = sortDepartmentNameList(assignedDepts.map((d) => d.name))

  const apportioningDepartments: { name: string; apportioning: boolean; manualApportioning?: boolean }[] = []
  const actDepts = activity.activityDepartments ?? []
  const allDepts = [...(activity.assignedDepartments ?? []), ...(activity.unassignedDepartments ?? [])]
  actDepts.forEach((ad) => {
    let name = ""
    if (ad.department?.name) {
      name = ad.department.name
    } else {
      const d = allDepts.find((x) => x.id === ad.departmentId)
      if (d?.name) name = d.name
    }
    if (name) {
      apportioningDepartments.push({
        name,
        apportioning: ad.apportioning,
        manualApportioning: ad.manualApportioning ?? false,
      })
    }
  })

  return {
    activity,
    departmentNames: names,
    apportioningDepartments,
    departmentManualApportioningByName: buildDepartmentManualApportioningByNameFromActivity(activity),
  }
}

function parseCountyActivityDepartmentListPage(raw: unknown): ActivityDepartmentPageResult {
  const wrapped = raw as {
    data?: { data?: ApiActivityDepartmentResDto[]; meta?: { totalItems?: number } }
  }
  const inner = wrapped?.data
  return {
    items: Array.isArray(inner?.data) ? inner.data : [],
    totalItems: Number(inner?.meta?.totalItems ?? 0),
  }
}


export async function apiGetCountyActivityLinkedDepartmentIds(
  activityId: number,
): Promise<number[]> {
  const rows = await fetchCountyActivityDepartmentLinks(activityId)
  return [...new Set(rows.map((r) => r.departmentId))]
}


async function fetchCountyActivityDepartmentLinks(
  activityId: number,
): Promise<ApiActivityDepartmentResDto[]> {
  const raw = await api.get<{ success: boolean; data: ApiActivityDepartmentResDto[] }>(
    `/activity-departments/all?activityId=${activityId}`,
  )
  if (!raw.success || !Array.isArray(raw.data)) {
    throw new Error("Failed to load activity departments")
  }
  return raw.data
}

async function postCountyActivityDepartmentLink(body: PostActivityDepartmentBody): Promise<void> {
  await api.post<unknown>("/activity-departments", body)
}

async function deleteCountyActivityDepartmentLink(linkId: number): Promise<void> {
  await api.delete<unknown>(`/activity-departments/${linkId}`)
}

async function createCountyActivityDepartmentLinks(
  input: PostActivityDepartmentLinksInput,
  /** Map of departmentId → whether that department has apportioning enabled in master */
  deptApportioningMap?: Map<number, boolean>,
  /** Map of departmentId → whether that department has manual apportioning enabled in master */
  deptManualApportioningMap?: Map<number, boolean>,
): Promise<void> {
  const ids = input.departmentIds.filter(
    (id) => typeof id === "number" && !Number.isNaN(id) && id > 0,
  )
  if (ids.length === 0) return

  if (ids.length > 1) {
    const links = ids.map((departmentId) => {
      const deptAllowsApportioning = deptApportioningMap?.get(departmentId) ?? true
      const deptAllowsManualApportioning = deptManualApportioningMap?.get(departmentId) ?? true
      const effectiveApportioning = input.apportioning && deptAllowsApportioning
      const effectiveManualApportioning = input.manualApportioning && deptAllowsManualApportioning
      return {
        departmentId,
        apportioning: effectiveApportioning,
        manualApportioning: effectiveManualApportioning,
      }
    })

    const body = {
      activityId: input.activityId,
      code: input.activityCode.trim(),
      name: input.activityName.trim(),
      type: input.type,
      leavecode: input.leavecode,
      parentId: input.parentActivityId,
      status: "active",
      links,
    }

    await api.post<unknown>("/activity-departments/bulk", body)
  } else {
    const departmentId = ids[0]
    const deptAllowsApportioning = deptApportioningMap?.get(departmentId) ?? true
    const deptAllowsManualApportioning = deptManualApportioningMap?.get(departmentId) ?? true
    const effectiveApportioning = input.apportioning && deptAllowsApportioning
    const effectiveManualApportioning = input.manualApportioning && deptAllowsManualApportioning
    await postCountyActivityDepartmentLink({
      activityId: input.activityId,
      departmentId,
      code: input.activityCode.trim(),
      name: input.activityName.trim(),
      type: input.type,
      leavecode: input.leavecode,
      parentId: input.parentActivityId,
      apportioning: effectiveApportioning,
      manualApportioning: effectiveManualApportioning,
    })
  }
}

async function syncCountyActivityDepartmentLinks(
  input: SyncActivityDepartmentLinksInput,
  deptApportioningMap?: Map<number, boolean>,
  deptManualApportioningMap?: Map<number, boolean>,
  existingLinks?: ApiActivityDepartmentResDto[],
): Promise<void> {
  const desired = new Set<number>(
    input.desiredDepartmentIds.filter(
      (id: unknown): id is number => typeof id === "number" && !Number.isNaN(id) && id > 0,
    ),
  )

  // Use pre-fetched links when available — avoids a redundant GET /activity-departments call
  const existing = existingLinks ?? await fetchCountyActivityDepartmentLinks(input.activityId)

  const toRemove = existing.filter((row) => !desired.has(row.departmentId))
  await Promise.all(toRemove.map((row) => deleteCountyActivityDepartmentLink(row.id)))

  const have = new Set<number>(existing.map((row) => row.departmentId))
  const toAdd = [...desired].filter((id) => !have.has(id))
  await createCountyActivityDepartmentLinks(
    {
      activityId: input.activityId,
      departmentIds: toAdd,
      activityCode: input.activityCode,
      activityName: input.activityName,
      type: input.type,
      leavecode: input.leavecode,
      parentActivityId: input.parentActivityId,
      apportioning: input.apportioning,
      manualApportioning: input.manualApportioning,
    },
    deptApportioningMap,
    deptManualApportioningMap,
  )

  // Also update existing links if their apportioning status changed
  const toUpdate = existing.filter((row) => desired.has(row.departmentId))
  await Promise.all(
    toUpdate.map((row) => {
      const deptAllowsApportioning = deptApportioningMap?.get(row.departmentId) ?? true
      const deptAllowsManualApportioning = deptManualApportioningMap?.get(row.departmentId) ?? true
      const effectiveApportioning = input.apportioning && deptAllowsApportioning
      const effectiveManualApportioning = input.manualApportioning && deptAllowsManualApportioning

      // Only call API if apportioning status actually changed
      if (
        row.apportioning !== effectiveApportioning ||
        row.manualApportioning !== effectiveManualApportioning
      ) {
        return api.put<unknown>(`/activity-departments/${row.id}`, {
          code: input.activityCode.trim(),
          name: input.activityName.trim(),
          type: input.type,
          leavecode: input.leavecode,
          parentId: input.parentActivityId,
          apportioning: effectiveApportioning,
          manualApportioning: effectiveManualApportioning,
        })
      }
      return Promise.resolve()
    }),

  )
}

function countyActivityCatalogEnrichmentKey(activityCodeType: string, activityCode: string): string {
  return `${activityCodeType.trim()}|${activityCode.trim()}`
}

export function normalizeCatalogMatchForCountyActivityGrid(raw: string | undefined): MatchStatus {
  const t = normalizeMatch(raw)
  if (!t) return CountyActivityCatalogMatchDefault.NONE
  if (t.length > 5) return CountyActivityCatalogMatchDefault.NONE
  return t
}


/** Builds SPMP / match / % map from master `GET /activity-codes` rows for county activity grid enrichment. */
export function buildCountyActivityCatalogEnrichmentMapFromMasterCodes(
  rows: readonly ApiActivityCode[],
): ActivityCatalogEnrichmentMap {
  const result: ActivityCatalogEnrichmentMap = new Map()
  for (const item of rows) {
    const codeType = String(item.type ?? "").trim()
    const code = (item.code ?? "").trim()
    if (!codeType || !code) continue
    const pct = Number.parseFloat(String(item.percent ?? 0))
    result.set(countyActivityCatalogEnrichmentKey(codeType, code), {
      spmp: item.spmp ?? false,
      match: normalizeCatalogMatchForCountyActivityGrid(item.match),
      percentage: Number.isFinite(pct) ? pct : 0,
    })
  }
  return result
}

export function parseMasterCodeDisplay(activityCode: string): number {
  const trimmed = activityCode.trim()
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isNaN(n)) return n
  const digits = /\d+/.exec(trimmed)
  return digits ? Number.parseInt(digits[0], 10) : 0
}

function sortUniquePositiveDepartmentIds(ids: readonly number[]): number[] {
  return [
    ...new Set(
      ids.filter((id) => typeof id === "number" && !Number.isNaN(id) && id > 0),
    ),
  ].sort((a, b) => a - b)
}



/** Maps hierarchy DTOs + enrichment + department links into county grid rows. */
export function buildCountyActivityCodeRowsFromHierarchy(
  roots: ApiActivityTreeResDto[],
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
  linkByActivity: ReadonlyMap<number, number[]>,
): CountyActivityCodeRow[] {
  const rows: CountyActivityCodeRow[] = []

  const visit = (
    node: ApiActivityTreeResDto,
    parentId: string | null,
    rowType: CountyActivityGridRowType,
  ): void => {
    const enr = enrichment.get(
      countyActivityCatalogEnrichmentKey(node.activityCodeType, node.activityCode),
    ) ?? {
      spmp: false,
      match: CountyActivityCatalogMatchDefault.NONE,
      percentage: 0,
    }

    const fromNested = node.departments
    const fromLinks = linkByActivity.get(node.id) ?? []
    const linkedDepartmentIds =
      fromNested !== undefined
        ? sortUniquePositiveDepartmentIds(fromNested.map((d) => d.id))
        : sortUniquePositiveDepartmentIds(fromLinks)

    const id = String(node.id)

    const apportioningDepartments = (node.departments ?? []).map((d) => ({
      name: d.name,
      apportioning: d.apportioning ?? false,
      manualApportioning: d.manualApportioning ?? false,
    }))

    rows.push({
      id,
      countyActivityCode: node.code,
      countyActivityName: node.name,
      description: node.description ?? "",
      department: "",
      linkedDepartmentIds,
      masterCodeType: node.activityCodeType,
      masterCode: parseMasterCodeDisplay(node.activityCode),
      catalogActivityCode: node.activityCode,
      spmp: enr.spmp,
      match: enr.match,
      percentage: enr.percentage,
      active: node.status === ActivityStatusEnum.ACTIVE,
      leaveCode: node.leavecode,
      docRequired: node.docrequired,
      multipleJobPools: node.isActivityAssignableToMultipleJobPools,
      apportioning: node.apportioning || false,
      manualApportioning: node.manualApportioning || false,
      apportioningDepartments,
      rowType,
      parentId,
    })

    const children = node.children ?? []
    for (const child of children) {
      visit(child, id, CountyActivityGridRowType.SUB)
    }
  }

  for (const root of roots) {
    visit(root, null, CountyActivityGridRowType.PRIMARY)
  }

  return rows
}

/** Maps a flat `GET /activities` row into a county grid row (catalog enrichment for SPMP / match / %). */
export function mapCountyActivityListItemToGridRow(
  dto: ApiActivityResDto,
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
): CountyActivityCodeRow {
  // Prefer the fields already embedded in the list DTO by the backend.
  // Fall back to the enrichment map only when they are absent (e.g. older endpoints).
  const hasDtoEnrichment =
    dto.spmp !== undefined || dto.match !== undefined || dto.percent !== undefined

  const enr = hasDtoEnrichment
    ? {
      spmp: dto.spmp ?? false,
      match: normalizeCatalogMatchForCountyActivityGrid(dto.match ?? undefined),
      percentage: Number.isFinite(dto.percent) ? (dto.percent ?? 0) : 0,
    }
    : enrichment.get(countyActivityCatalogEnrichmentKey(dto.activityCodeType, dto.activityCode)) ?? {
      spmp: false,
      match: CountyActivityCatalogMatchDefault.NONE,
      percentage: 0,
    }

  const linkedDepartmentIds = sortUniquePositiveDepartmentIds(
    (dto.departments ?? []).map((d) => d.id),
  )

  const departmentNames = (dto.departments ?? [])
    .map((d) => (d.name ?? "").trim())
    .filter(Boolean)
  const department = departmentNames.length > 0 ? departmentNames.join(", ") : ""

  const typeNorm = String(dto.type ?? "").trim().toLowerCase()
  const isPrimary =
    (dto.type === ApiActivityTypeEnum.PRIMARY || typeNorm === "primary") &&
    dto.parent?.id == null

  const apportioningDepartments = (dto.departments ?? dto.assignedDepartments ?? []).map((d) => ({
    name: d.name,
    apportioning: d.apportioning ?? false,
    manualApportioning: d.manualApportioning ?? false,
  }))

  return {
    id: String(dto.id),
    countyActivityCode: dto.code,
    countyActivityName: dto.name,
    description: dto.description ?? "",
    department,
    linkedDepartmentIds,
    masterCodeType: dto.activityCodeType,
    masterCode: parseMasterCodeDisplay(dto.activityCode),
    catalogActivityCode: dto.activityCode,
    spmp: enr.spmp,
    match: enr.match,
    percentage: enr.percentage,
    active:
      dto.status === ActivityStatusEnum.ACTIVE ||
      String(dto.status ?? "").trim().toLowerCase() === "active",
    leaveCode: dto.leavecode,
    docRequired: dto.docrequired,
    multipleJobPools: dto.isActivityAssignableToMultipleJobPools,
    apportioning: dto.apportioning || false,
    manualApportioning: normalizeCountyActivityApportioningFlags(dto.apportioning || false)
      .manualApportioning,
    apportioningDepartments,
    rowType: isPrimary ? CountyActivityGridRowType.PRIMARY : CountyActivityGridRowType.SUB,
    parentId:
      dto.parent?.id != null ? String(dto.parent.id) : null,
    hasChild: dto.hasChild ?? false,
  }
}

export function mapCountyActivityListItemsToGridRows(
  dtos: readonly ApiActivityResDto[],
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
): CountyActivityCodeRow[] {
  return dtos.map((dto) => mapCountyActivityListItemToGridRow(dto, enrichment))
}

/** Primary grid row after `POST /activities` — avoids an immediate `GET /activities` refetch. */
export function buildCountyActivityPrimaryGridRowAfterCreate(
  input: CreateCountyActivityApiInput,
  res: ApiCountyActivityCreateResponse,
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
): CountyActivityCodeRow {
  const mc = input.masterCatalog
  if (!mc?.code?.trim() || !mc.type?.trim()) {
    throw new Error("Master catalog is required for a primary county activity")
  }
  const type = mc.type.trim()
  const catalogCode = mc.code.trim()
  const enr =
    enrichment.get(countyActivityCatalogEnrichmentKey(type, catalogCode)) ?? {
      spmp: false,
      match: CountyActivityCatalogMatchDefault.NONE,
      percentage: 0,
    }
  const v = input.values
  const linked = sortUniquePositiveDepartmentIds(input.departmentLinks.map((d) => d.id))

  const apportioningDepartments: { name: string; apportioning: boolean; manualApportioning?: boolean }[] = []

  return {
    id: String(res.id),
    countyActivityCode: v.countyActivityCode.trim(),
    countyActivityName: v.countyActivityName.trim(),
    description: v.description.trim(),
    department: "",
    linkedDepartmentIds: linked,
    masterCodeType: type,
    masterCode: parseMasterCodeDisplay(catalogCode),
    catalogActivityCode: catalogCode,
    spmp: enr.spmp,
    match: enr.match,
    percentage: enr.percentage,
    active: v.active,
    leaveCode: v.leaveCode,
    docRequired: v.docRequired,
    multipleJobPools: v.multipleJobPools,
    apportioning: v.apportioning,
    manualApportioning: v.manualApportioning,
    apportioningDepartments,
    rowType: CountyActivityGridRowType.PRIMARY,
    parentId: null,
  }
}

/**
 * Sub grid row after `POST /activities` (secondary) — for cache patches without refetching hierarchy /
 * global activity-departments.
 */
export function buildCountyActivitySubGridRowAfterCreate(
  input: CreateCountyActivityApiInput,
  res: ApiCountyActivityCreateResponse,
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
  parentCatalog: { activityCodeType: string; activityCode: string },
): CountyActivityCodeRow {
  const pid = input.parentId?.trim() ?? ""
  if (pid === "") {
    throw new Error("Parent activity is required")
  }
  const type = parentCatalog.activityCodeType.trim()
  const catalogCode = parentCatalog.activityCode.trim()
  const enr =
    type && catalogCode
      ? enrichment.get(countyActivityCatalogEnrichmentKey(type, catalogCode))
      : undefined
  const enrResolved = enr ?? {
    spmp: false,
    match: CountyActivityCatalogMatchDefault.NONE,
    percentage: 0,
  }
  const v = input.values
  return {
    id: String(res.id),
    countyActivityCode: v.countyActivityCode.trim(),
    countyActivityName: v.countyActivityName.trim(),
    description: v.description.trim(),
    department: "",
    linkedDepartmentIds: [],
    masterCodeType: type || v.masterCodeType.trim(),
    masterCode: catalogCode ? parseMasterCodeDisplay(catalogCode) : v.masterCode,
    catalogActivityCode: catalogCode || String(v.masterCode),
    spmp: enrResolved.spmp,
    match: enrResolved.match,
    percentage: enrResolved.percentage,
    active: v.active,
    leaveCode: v.leaveCode,
    docRequired: v.docRequired,
    multipleJobPools: v.multipleJobPools,
    apportioning: v.apportioning,
    manualApportioning: v.manualApportioning,
    apportioningDepartments: [],
    rowType: CountyActivityGridRowType.SUB,
    parentId: pid,
  }
}

export function mergeCountyActivityDtoAfterUpdate(
  prev: ApiActivityResDto,
  input: UpdateCountyActivityApiInput,
): ApiActivityResDto {
  const v = input.values
  const { apportioning, manualApportioning } = normalizeCountyActivityApportioningFlags(v.apportioning)
  const status = v.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE
  const next: ApiActivityResDto = {
    ...prev,
    code: v.countyActivityCode.trim(),
    name: v.countyActivityName.trim(),
    description: v.description.trim() || null,
    leavecode: v.leaveCode,
    docrequired: v.docRequired,
    status,
    isActivityAssignableToMultipleJobPools: v.multipleJobPools,
    apportioning,
    manualApportioning,
  }
  if (
    input.rowType === CountyActivityGridRowType.PRIMARY &&
    input.masterCatalog?.code?.trim() &&
    input.masterCatalog?.type?.trim()
  ) {
    next.activityCode = input.masterCatalog.code.trim()
    next.activityCodeType = input.masterCatalog.type.trim()
  }
  return next
}

export function buildCountyActivityGridRowAfterUpdate(
  input: UpdateCountyActivityApiInput,
  prevRow: CountyActivityCodeRow,
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
): CountyActivityCodeRow {
  const v = input.values
  const { apportioning, manualApportioning } = normalizeCountyActivityApportioningFlags(v.apportioning)
  const type =
    input.rowType === CountyActivityGridRowType.PRIMARY && input.masterCatalog?.type?.trim()
      ? input.masterCatalog.type.trim()
      : prevRow.masterCodeType
  const catalogCode =
    input.rowType === CountyActivityGridRowType.PRIMARY && input.masterCatalog?.code?.trim()
      ? input.masterCatalog.code.trim()
      : prevRow.catalogActivityCode

  const masterChanged =
    input.rowType === CountyActivityGridRowType.PRIMARY &&
    input.masterCatalog != null &&
    (catalogCode !== prevRow.catalogActivityCode || type !== prevRow.masterCodeType)

  const enr =
    enrichment.get(countyActivityCatalogEnrichmentKey(type, catalogCode)) ?? {
      spmp: false,
      match: CountyActivityCatalogMatchDefault.NONE,
      percentage: 0,
    }

  const linkedDepartmentIds =
    input.rowType === CountyActivityGridRowType.PRIMARY && input.departmentLinks != null
      ? sortUniquePositiveDepartmentIds(input.departmentLinks.map((d) => d.id))
      : prevRow.linkedDepartmentIds

  return {
    ...prevRow,
    countyActivityCode: v.countyActivityCode.trim(),
    countyActivityName: v.countyActivityName.trim(),
    description: v.description.trim(),
    department: "",
    linkedDepartmentIds,
    masterCodeType: type,
    masterCode: parseMasterCodeDisplay(catalogCode),
    catalogActivityCode: catalogCode,
    spmp: masterChanged ? enr.spmp : prevRow.spmp,
    match: masterChanged ? enr.match : prevRow.match,
    percentage: masterChanged ? enr.percentage : prevRow.percentage,
    active: v.active,
    leaveCode: v.leaveCode,
    docRequired: v.docRequired,
    multipleJobPools: v.multipleJobPools,
    apportioning,
    manualApportioning,
  }
}

/** GET `/activities` — paginated list (page, limit, search, status, sort, departmentIds). */
export async function apiGetCountyActivitiesPage(
  params: CountyActivityListQueryParams,
): Promise<CountyActivityListResponsePayload> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sort: params.sort ?? "ASC",
  })
  const term = params.search?.trim()
  if (term) searchParams.set("search", term)
  const st = params.status?.trim()
  if (st) searchParams.set("status", st)
  let url = `/activities?${searchParams.toString()}`
  // Append departmentIds as a literal comma-separated value (URLSearchParams encodes commas as %2C)
  if (params.departmentIds && params.departmentIds.length > 0) {
    url += `&departmentIds=${params.departmentIds.join(",")}`
  }

  const raw = await api.get<ApiResponseDto<CountyActivityListResponsePayload>>(url)
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message?.trim() || "Failed to load county activities")
  }
  const inner = raw.data
  if (!Array.isArray(inner.data) || inner.meta == null) {
    throw new Error("Invalid county activities list response")
  }
  return inner
}

/**
 * Loads every page of `GET /activities` for the given filters, using
 * {@link COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT} per request (backend cap).
 */
export async function apiGetCountyActivitiesCatalogAggregated(
  params: Pick<CountyActivityListQueryParams, "search" | "status" | "sort" | "departmentIds">,
): Promise<CountyActivityListResponsePayload> {
  const chunk = COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT
  const sort = params.sort ?? "ASC"
  const all: ApiActivityResDto[] = []
  let firstMeta: CountyActivityListMeta | null = null
  let page = 1

  for (; ;) {
    const inner = await apiGetCountyActivitiesPage({
      page,
      limit: chunk,
      search: params.search,
      status: params.status,
      sort,
      departmentIds: params.departmentIds,
    })
    if (firstMeta == null) firstMeta = inner.meta
    all.push(...inner.data)

    const got = inner.data.length
    if (got < chunk) break
    if (inner.meta.totalPages > 0 && page >= inner.meta.totalPages) break
    if (all.length >= inner.meta.totalItems) break

    page += 1
    if (page > 10_000) {
      throw new Error("County activities catalog pagination exceeded safety limit")
    }
  }

  const baseMeta =
    firstMeta ??
    ({
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: chunk,
      itemCount: 0,
    } satisfies CountyActivityListMeta)

  return {
    data: all,
    meta: {
      ...baseMeta,
      currentPage: 1,
      itemCount: all.length,
    },
  }
}

export async function apiGetCountyActivitiesAllActive(
  params?: { departmentIds?: number[] },
): Promise<CountyActivityListResponsePayload> {
  let url = `/activities?status=active`
  if (params?.departmentIds && params.departmentIds.length > 0) {
    url += `&departmentIds=${params.departmentIds.join(",")}`
  }
  const raw = await api.get<ApiResponseDto<CountyActivityListResponsePayload>>(url)
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message?.trim() || "Failed to load county activities")
  }
  const inner = raw.data
  if (!Array.isArray(inner.data) || inner.meta == null) {
    throw new Error("Invalid county activities list response")
  }
  return inner
}

/** GET `/activities/:parentId/nestedactivities` — direct children for a parent. */
export async function apiGetCountyActivityNested(parentId: number): Promise<ApiActivityResDto[]> {
  const raw = await api.get<ApiResponseDto<ApiActivityResDto[]>>(`/activities/${parentId}/nestedactivities`)
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message?.trim() || "Failed to load nested activities")
  }
  return Array.isArray(raw.data) ? raw.data : []
}

export async function apiGetCountyActivitiesByDepartmentId(
  departmentId: number,
): Promise<ApiActivityDepartmentResDto[]> {
  const searchParams = new URLSearchParams({
    departmentId: String(departmentId),
    page: "1",
    limit: String(COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT),
  })
  const raw = await api.get<unknown>(`/activity-departments?${searchParams.toString()}`)
  const { items } = parseCountyActivityDepartmentListPage(raw)
  return items
}


/** POST `/activities` — primary (with master code + department links) or sub (with parentId). */
export async function apiPostCountyActivity(
  input: CreateCountyActivityApiInput,
): Promise<ApiCountyActivityCreateResponse> {
  const { values, tab, parentId, masterCatalog, departmentLinks } = input
  const { apportioning, manualApportioning } = normalizeCountyActivityApportioningFlags(
    values.apportioning,
  )
  const status = values.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE

  if (tab === CountyActivityGridRowType.PRIMARY) {
    if (!masterCatalog?.code?.trim() || !masterCatalog.type?.trim()) {
      throw new Error("Master code is required for a primary county activity")
    }
    const body: Record<string, unknown> = {
      code: values.countyActivityCode.trim(),
      name: values.countyActivityName.trim(),
      description: values.description.trim(),
      type: ApiActivityTypeEnum.PRIMARY,
      activityCode: masterCatalog.code.trim(),
      activityCodeType: masterCatalog.type.trim(),
      leavecode: values.leaveCode,
      docrequired: values.docRequired,
      status,
      isActivityAssignableToMultipleJobPools: values.multipleJobPools,
      apportioning,
      manualApportioning,
    }
    // Department links use `POST /activity-departments` (separate table). Nested `departments` on
    // `POST /activities` is often not transformed by the API, which yields undefined `departmentId`
    // and MySQL errors ("Field 'departmentId' doesn't have a default value").
    const raw = await api.post<unknown>("/activities", body)
    const data = unwrapData<ApiCountyActivityCreateResponse>(raw)
    if (data == null || typeof data.id !== "number") {
      throw new Error("Create response missing id")
    }

    // Build a per-dept apportioning map from the departmentLinks metadata if available
    // This ensures only departments where apportioning=true in dept master get apportioning=true in the link
    const deptApportioningMap = new Map<number, boolean>(
      departmentLinks.map((d) => [d.id, (d as any).apportioning ?? true])
    )
    const deptManualApportioningMap = new Map<number, boolean>(
      departmentLinks.map((d) => [d.id, (d as any).manualApportioning ?? true])
    )

    await createCountyActivityDepartmentLinks({
      activityId: data.id,
      departmentIds: departmentLinks.map((d) => d.id),
      activityCode: values.countyActivityCode,
      activityName: values.countyActivityName,
      type: ApiActivityTypeEnum.PRIMARY,
      leavecode: values.leaveCode,
      parentActivityId: null,
      apportioning,
      manualApportioning,
    }, deptApportioningMap, deptManualApportioningMap)

    return data
  }

  const pid = parentId != null && parentId !== "" ? Number(parentId) : Number.NaN
  if (Number.isNaN(pid)) {
    throw new Error("Parent activity is required for a sub county activity")
  }

  const body: Record<string, unknown> = {
    parentId: pid,
    code: values.countyActivityCode.trim(),
    name: values.countyActivityName.trim(),
    description: values.description.trim(),
    type: ApiActivityTypeEnum.SECONDARY,
    leavecode: values.leaveCode,
    docrequired: values.docRequired,
    status,
    isActivityAssignableToMultipleJobPools: values.multipleJobPools,
    apportioning,
    manualApportioning,
  }

  const raw = await api.post<unknown>("/activities", body)
  const data = unwrapData<ApiCountyActivityCreateResponse>(raw)
  if (data == null || typeof data.id !== "number") {
    throw new Error("Create response missing id")
  }

  return data
}

/** PUT `/activities/:id`; primary rows sync `/activity-departments` afterward. */
export async function apiPutCountyActivity(input: UpdateCountyActivityApiInput): Promise<void> {
  const id = Number(input.id)
  if (Number.isNaN(id)) {
    throw new Error("Invalid activity id")
  }

  const { values, rowType, masterCatalog, departmentLinks, existingActivityDepartments } = input
  const { apportioning, manualApportioning } = normalizeCountyActivityApportioningFlags(
    values.apportioning,
  )
  const status = values.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE

  const body: Record<string, unknown> = {
    code: values.countyActivityCode.trim(),
    name: values.countyActivityName.trim(),
    description: values.description.trim(),
    leavecode: values.leaveCode,
    docrequired: values.docRequired,
    status,
    isActivityAssignableToMultipleJobPools: values.multipleJobPools,
    apportioning,
    manualApportioning,
  }

  if (rowType === CountyActivityGridRowType.PRIMARY && masterCatalog?.code?.trim() && masterCatalog.type?.trim()) {
    body.activityCode = masterCatalog.code.trim()
    body.activityCodeType = masterCatalog.type.trim()
  }

  await api.put<unknown>(`/activities/${id}`, body)

  // Sync department links via /activity-departments for primary rows (diff add/remove/update).
  if (rowType === CountyActivityGridRowType.PRIMARY && departmentLinks != null) {
    const deptApportioningMap = new Map<number, boolean>(
      departmentLinks.map((d) => [d.id, d.apportioning ?? true]),
    )
    const deptManualApportioningMap = new Map<number, boolean>(
      departmentLinks.map((d) => [d.id, d.manualApportioning ?? true]),
    )
    await syncCountyActivityDepartmentLinks(
      {
        activityId: id,
        desiredDepartmentIds: departmentLinks.map((d) => d.id),
        activityCode: values.countyActivityCode,
        activityName: values.countyActivityName,
        type: ApiActivityTypeEnum.PRIMARY,
        leavecode: values.leaveCode,
        parentActivityId: null,
        apportioning,
        manualApportioning,
      },
      deptApportioningMap,
      deptManualApportioningMap,
      existingActivityDepartments,
    )
  }
}
