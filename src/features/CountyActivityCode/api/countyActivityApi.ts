import { ActivityStatusEnum } from "@/features/master-code/enums/activityStatus"
import { normalizeMatch } from "@/features/master-code/api"
import type { ApiActivityCode } from "@/features/master-code/types"
import type { ApiResponseDto } from "@/features/user/types"
import { api } from "@/lib/api"

import { COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT } from "../constants"
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

export async function apiGetCountyActivityById(id: number): Promise<ApiActivityResDto> {
  const raw = await api.get<unknown>(`/activities/${id}`)
  const data = unwrapData<ApiActivityResDto>(raw)
  if (data == null || typeof data.id !== "number") {
    throw new Error("County activity not found")
  }
  return data
}

export async function apiGetCountyActivityForEdit(id: number): Promise<CountyActivityEditPayload> {
  const activity = await apiGetCountyActivityById(id)
  let names: string[] = []
  if (activity.departments != null && activity.departments.length > 0) {
    names = sortDepartmentNameList(activity.departments.map((d) => d.name))
  } else {
    const links = await fetchCountyActivityDepartmentLinks(id)
    names = sortDepartmentNameList(links.map((l) => l.name))
  }
  return { activity, departmentNames: names }
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


const ACTIVITY_DEPARTMENTS_LIST_LIMIT = 1000
const ACTIVITY_DEPT_GLOBAL_MAX_PAGES = 20

async function fetchAllCountyActivityDepartmentLinks(): Promise<ApiActivityDepartmentResDto[]> {
  const all: ApiActivityDepartmentResDto[] = []
  const limit = ACTIVITY_DEPARTMENTS_LIST_LIMIT
  for (let page = 1; page <= ACTIVITY_DEPT_GLOBAL_MAX_PAGES; page += 1) {
    const search = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    const raw = await api.get<unknown>(`/activity-departments?${search.toString()}`)
    const { items, totalItems } = parseCountyActivityDepartmentListPage(raw)
    if (items.length === 0) break
    all.push(...items)
    if (items.length < limit) break
    if (totalItems > 0 && all.length >= totalItems) break
  }
  return all
}

function buildCountyActivityIdToDepartmentIdsMap(
  links: ApiActivityDepartmentResDto[],
): Map<number, number[]> {
  const byActivity = new Map<number, Set<number>>()
  for (const link of links) {
    const aid = link.activityId
    if (!byActivity.has(aid)) byActivity.set(aid, new Set())
    byActivity.get(aid)!.add(link.departmentId)
  }
  return new Map(
    [...byActivity.entries()].map(([aid, set]) => [
      aid,
      [...set].sort((a, b) => a - b),
    ]),
  )
}

async function fetchCountyActivityDepartmentLinks(
  activityId: number,
): Promise<ApiActivityDepartmentResDto[]> {
  const all: ApiActivityDepartmentResDto[] = []
  let page = 1
  const limit = ACTIVITY_DEPARTMENTS_LIST_LIMIT
  for (;;) {
    const search = new URLSearchParams({
      activityId: String(activityId),
      page: String(page),
      limit: String(limit),
    })
    const raw = await api.get<unknown>(`/activity-departments?${search.toString()}`)
    const { items, totalItems } = parseCountyActivityDepartmentListPage(raw)
    if (items.length === 0) break
    all.push(...items)
    if (items.length < limit) break
    if (totalItems > 0 && all.length >= totalItems) break
    page += 1
  }
  return all
}

async function postCountyActivityDepartmentLink(body: PostActivityDepartmentBody): Promise<void> {
  await api.post<unknown>("/activity-departments", body)
}

async function deleteCountyActivityDepartmentLink(linkId: number): Promise<void> {
  await api.delete<unknown>(`/activity-departments/${linkId}`)
}

async function createCountyActivityDepartmentLinks(
  input: PostActivityDepartmentLinksInput,
): Promise<void> {
  const ids = input.departmentIds.filter(
    (id) => typeof id === "number" && !Number.isNaN(id) && id > 0,
  )
  if (ids.length === 0) return

  await Promise.all(
    ids.map((departmentId) =>
      postCountyActivityDepartmentLink({
        activityId: input.activityId,
        departmentId,
        code: input.activityCode.trim(),
        name: input.activityName.trim(),
        type: input.type,
        leavecode: input.leavecode,
        parentId: input.parentActivityId,
        apportioning: input.apportioning,
      }),
    ),
  )
}

async function syncCountyActivityDepartmentLinks(
  input: SyncActivityDepartmentLinksInput,
): Promise<void> {
  const desired = new Set(
    input.desiredDepartmentIds.filter(
      (id) => typeof id === "number" && !Number.isNaN(id) && id > 0,
    ),
  )

  const existing = await fetchCountyActivityDepartmentLinks(input.activityId)

  const toRemove = existing.filter((row) => !desired.has(row.departmentId))
  await Promise.all(toRemove.map((row) => deleteCountyActivityDepartmentLink(row.id)))

  const have = new Set(existing.map((row) => row.departmentId))
  const toAdd = [...desired].filter((id) => !have.has(id))

  await createCountyActivityDepartmentLinks({
    activityId: input.activityId,
    departmentIds: toAdd,
    activityCode: input.activityCode,
    activityName: input.activityName,
    type: input.type,
    leavecode: input.leavecode,
    parentActivityId: input.parentActivityId,
    apportioning: input.apportioning,
  })
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
  const enr =
    enrichment.get(countyActivityCatalogEnrichmentKey(dto.activityCodeType, dto.activityCode)) ?? {
      spmp: false,
      match: CountyActivityCatalogMatchDefault.NONE,
      percentage: 0,
    }

  const linkedDepartmentIds = sortUniquePositiveDepartmentIds(
    (dto.departments ?? []).map((d) => d.id),
  )

  const typeNorm = String(dto.type ?? "").trim().toLowerCase()
  const isPrimary =
    dto.type === ApiActivityTypeEnum.PRIMARY || typeNorm === "primary"

  return {
    id: String(dto.id),
    countyActivityCode: dto.code,
    countyActivityName: dto.name,
    description: dto.description ?? "",
    department: "",
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
    rowType: isPrimary ? CountyActivityGridRowType.PRIMARY : CountyActivityGridRowType.SUB,
    parentId:
      dto.parentId != null && dto.parentId !== undefined ? String(dto.parentId) : null,
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
    rowType: CountyActivityGridRowType.SUB,
    parentId: pid,
  }
}

export function mergeCountyActivityDtoAfterUpdate(
  prev: ApiActivityResDto,
  input: UpdateCountyActivityApiInput,
): ApiActivityResDto {
  const v = input.values
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
  }
}

/** GET `/activities` — paginated list (page, limit, search, status, sort). */
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

  const raw = await api.get<ApiResponseDto<CountyActivityListResponsePayload>>(
    `/activities?${searchParams.toString()}`,
  )
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
  params: Pick<CountyActivityListQueryParams, "search" | "status" | "sort">,
): Promise<CountyActivityListResponsePayload> {
  const chunk = COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT
  const sort = params.sort ?? "ASC"
  const all: ApiActivityResDto[] = []
  let firstMeta: CountyActivityListMeta | null = null
  let page = 1

  for (;;) {
    const inner = await apiGetCountyActivitiesPage({
      page,
      limit: chunk,
      search: params.search,
      status: params.status,
      sort,
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

/** GET `/activities/top-level` — root primaries for the main grid / table pickers (not the Sub-only aggregated list). */
export async function apiGetCountyActivityTopLevel(): Promise<ApiActivityResDto[]> {
  const raw = await api.get<ApiResponseDto<ApiActivityResDto[]>>("/activities/top-level")
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message?.trim() || "Failed to load top-level activities")
  }
  return Array.isArray(raw.data) ? raw.data : []
}

/** GET `/activities/hierarchy`. */
export async function apiGetCountyActivityHierarchy(): Promise<ApiActivityTreeResDto[]> {
  const raw = await api.get<unknown>("/activities/hierarchy")
  const data = unwrapData<ApiActivityTreeResDto[]>(raw)
  return Array.isArray(data) ? data : []
}

/** County grid: hierarchy + all activity–department links + catalog enrichment (enrichment usually from query cache). */
export async function apiGetCountyActivityCodeTableRows(
  enrichment: ReadonlyMap<string, ActivityCatalogEnrichmentValue>,
): Promise<CountyActivityCodeRow[]> {
  const [tree, activityDeptLinks] = await Promise.all([
    apiGetCountyActivityHierarchy(),
    fetchAllCountyActivityDepartmentLinks(),
  ])
  const linkByActivity = buildCountyActivityIdToDepartmentIdsMap(activityDeptLinks)
  return buildCountyActivityCodeRowsFromHierarchy(tree, enrichment, linkByActivity)
}

/** POST `/activities` — primary (with master code + department links) or sub (with parentId). */
export async function apiPostCountyActivity(
  input: CreateCountyActivityApiInput,
): Promise<ApiCountyActivityCreateResponse> {
  const { values, tab, parentId, masterCatalog, departmentLinks } = input
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
    }
    // Department links use `POST /activity-departments` (separate table). Nested `departments` on
    // `POST /activities` is often not transformed by the API, which yields undefined `departmentId`
    // and MySQL errors ("Field 'departmentId' doesn't have a default value").
    const raw = await api.post<unknown>("/activities", body)
    const data = unwrapData<ApiCountyActivityCreateResponse>(raw)
    if (data == null || typeof data.id !== "number") {
      throw new Error("Create response missing id")
    }

    await createCountyActivityDepartmentLinks({
      activityId: data.id,
      departmentIds: departmentLinks.map((d) => d.id),
      activityCode: values.countyActivityCode,
      activityName: values.countyActivityName,
      type: ApiActivityTypeEnum.PRIMARY,
      leavecode: values.leaveCode,
      parentActivityId: null,
      apportioning: false,
    })

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
  }

  const raw = await api.post<unknown>("/activities", body)
  const data = unwrapData<ApiCountyActivityCreateResponse>(raw)
  if (data == null || typeof data.id !== "number") {
    throw new Error("Create response missing id")
  }

  return data
}

/** PUT `/activities/:id`; primary rows may sync `/activity-departments` afterward. */
export async function apiPutCountyActivity(input: UpdateCountyActivityApiInput): Promise<void> {
  const id = Number(input.id)
  if (Number.isNaN(id)) {
    throw new Error("Invalid activity id")
  }

  const { values, rowType, masterCatalog, departmentLinks } = input
  const status = values.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE

  const body: Record<string, unknown> = {
    code: values.countyActivityCode.trim(),
    name: values.countyActivityName.trim(),
    description: values.description.trim(),
    leavecode: values.leaveCode,
    docrequired: values.docRequired,
    status,
    isActivityAssignableToMultipleJobPools: values.multipleJobPools,
  }

  if (rowType === CountyActivityGridRowType.PRIMARY && masterCatalog?.code?.trim() && masterCatalog.type?.trim()) {
    body.activityCode = masterCatalog.code.trim()
    body.activityCodeType = masterCatalog.type.trim()
  }

  await api.put<unknown>(`/activities/${id}`, body)

  if (rowType === CountyActivityGridRowType.PRIMARY && departmentLinks != null) {
    const desiredIds = departmentLinks
      .map((d) => d.id)
      .filter((x) => typeof x === "number" && !Number.isNaN(x) && x > 0)

    await syncCountyActivityDepartmentLinks({
      activityId: id,
      desiredDepartmentIds: desiredIds,
      activityCode: values.countyActivityCode,
      activityName: values.countyActivityName,
      type: ApiActivityTypeEnum.PRIMARY,
      leavecode: values.leaveCode,
      parentActivityId: null,
      apportioning: false,
    })
  }
}
