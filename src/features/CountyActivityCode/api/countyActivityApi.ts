import { ActivityStatusEnum } from "@/features/master-code/enums/activityStatus"
import { apiGetActivityCodesAllForType, normalizeMatch } from "@/features/master-code/api"
import { MASTER_CODE_TYPE_TAB_ORDER } from "@/features/master-code/types"
import { api } from "@/lib/api"

import { ApiActivityTypeEnum, CountyActivityGridRowType } from "../enums/CountyActivity.enum"
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
    throw new Error("Activity not found")
  }
  return data
}

export async function apiGetCountyActivityForEdit(id: number): Promise<CountyActivityEditPayload> {
  const activity = await apiGetCountyActivityById(id)
  let names: string[] = []
  if (activity.departments != null && activity.departments.length > 0) {
    names = sortDepartmentNameList(activity.departments.map((d) => d.name))
  } else {
    const links = await fetchAllActivityDepartmentsForActivity(id)
    names = sortDepartmentNameList(links.map((l) => l.name))
  }
  return { activity, departmentNames: names }
}

function unwrapActivityDepartmentPage(raw: unknown): ActivityDepartmentPageResult {
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
  const rows = await fetchAllActivityDepartmentsForActivity(activityId)
  return [...new Set(rows.map((r) => r.departmentId))]
}


const ACTIVITY_DEPARTMENTS_LIST_LIMIT = 1000
const ACTIVITY_DEPT_GLOBAL_MAX_PAGES = 20

async function fetchAllActivityDepartmentsGlobally(): Promise<ApiActivityDepartmentResDto[]> {
  const all: ApiActivityDepartmentResDto[] = []
  const limit = ACTIVITY_DEPARTMENTS_LIST_LIMIT
  for (let page = 1; page <= ACTIVITY_DEPT_GLOBAL_MAX_PAGES; page += 1) {
    const search = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    const raw = await api.get<unknown>(`/activity-departments?${search.toString()}`)
    const { items, totalItems } = unwrapActivityDepartmentPage(raw)
    if (items.length === 0) break
    all.push(...items)
    if (items.length < limit) break
    if (totalItems > 0 && all.length >= totalItems) break
  }
  return all
}

function buildActivityIdToDepartmentIdLists(
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

async function fetchAllActivityDepartmentsForActivity(
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
    const { items, totalItems } = unwrapActivityDepartmentPage(raw)
    if (items.length === 0) break
    all.push(...items)
    if (items.length < limit) break
    if (totalItems > 0 && all.length >= totalItems) break
    page += 1
  }
  return all
}

async function apiPostActivityDepartment(body: PostActivityDepartmentBody): Promise<void> {
  await api.post<unknown>("/activity-departments", body)
}

async function apiDeleteActivityDepartmentByLinkId(linkId: number): Promise<void> {
  await api.delete<unknown>(`/activity-departments/${linkId}`)
}

async function postActivityDepartmentLinksForActivity(
  input: PostActivityDepartmentLinksInput,
): Promise<void> {
  const ids = input.departmentIds.filter(
    (id) => typeof id === "number" && !Number.isNaN(id) && id > 0,
  )
  if (ids.length === 0) return

  await Promise.all(
    ids.map((departmentId) =>
      apiPostActivityDepartment({
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

async function syncActivityDepartmentLinksWithDesiredIds(
  input: SyncActivityDepartmentLinksInput,
): Promise<void> {
  const desired = new Set(
    input.desiredDepartmentIds.filter(
      (id) => typeof id === "number" && !Number.isNaN(id) && id > 0,
    ),
  )

  const existing = await fetchAllActivityDepartmentsForActivity(input.activityId)

  const toRemove = existing.filter((row) => !desired.has(row.departmentId))
  await Promise.all(toRemove.map((row) => apiDeleteActivityDepartmentByLinkId(row.id)))

  const have = new Set(existing.map((row) => row.departmentId))
  const toAdd = [...desired].filter((id) => !have.has(id))

  await postActivityDepartmentLinksForActivity({
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

function enrichmentKey(activityCodeType: string, activityCode: string): string {
  return `${activityCodeType.trim()}|${activityCode.trim()}`
}

function catalogMatchToGridMatch(raw: string | undefined): MatchStatus {
  const t = normalizeMatch(raw)
  if (!t) return "N"
  if (t.length > 5) return "N"
  return t
}


/** Builds SPMP / match / % map from master activity-code catalog (multiple GETs by type). */
export async function apiGetCountyActivityCatalogEnrichmentMap(): Promise<ActivityCatalogEnrichmentMap> {
  const result: ActivityCatalogEnrichmentMap = new Map()

  await Promise.all(
    MASTER_CODE_TYPE_TAB_ORDER.map(async (codeType) => {
      try {
        const { items } = await apiGetActivityCodesAllForType({
          codeType,
          inactiveOnly: false,
        })
        for (const item of items) {
          const code = (item.code ?? "").trim()
          if (!code) continue
          const pct = Number.parseFloat(item.ffpPercent)
          result.set(enrichmentKey(codeType, code), {
            spmp: item.spmp,
            match: catalogMatchToGridMatch(item.match),
            percentage: Number.isFinite(pct) ? pct : 0,
          })
        }
      } catch {
        
      }
    }),
  )

  return result
}

function parseMasterCodeDisplay(activityCode: string): number {
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
      enrichmentKey(node.activityCodeType, node.activityCode),
    ) ?? {
      spmp: false,
      match: "N" as MatchStatus,
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
    fetchAllActivityDepartmentsGlobally(),
  ])
  const linkByActivity = buildActivityIdToDepartmentIdLists(activityDeptLinks)
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

    await postActivityDepartmentLinksForActivity({
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

    await syncActivityDepartmentLinksWithDesiredIds({
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
