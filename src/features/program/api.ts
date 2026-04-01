import { api } from "@/lib/api"
import type {ApiEnvelope,BudgetProgramResDto,BudgetUnitListResponseDto,BudgetUnitResDto,CreateProgramInput,GetProgramsParams,PaginationMeta,ProgramListResponse,ProgramRow,ProgramTab,TimeStudyProgramListResponseDto,TimeStudyProgramResDto,UpdateProgramInput} from "./types"
import {BudgetProgramTypeEnum,TimeStudyProgramMultiCodeTypeEnum,TimeStudyProgramStatusEnum,TimeStudyProgramTypeEnum} from "./enums/enums"

function isActiveStatus(status: unknown): boolean {
  if (typeof status === "boolean") return status
  if (typeof status === "string") return status.toLowerCase() === "active"
  return true
}

function toStatus(active: boolean): "active" | "inactive" {
  return active ? "active" : "inactive"
}

function parsePercent(value: string | undefined): number {
  const n = Number.parseFloat(String(value ?? "").trim() || "0")
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0
  return n
}

function extractTotalItems(meta?: PaginationMeta | null): number | undefined {
  if (!meta) return undefined
  if (typeof meta.totalItems === "number") return meta.totalItems
  if (typeof meta.itemCount === "number") return meta.itemCount
  return undefined
}

function mapBudgetUnitToProgramRow(raw: BudgetUnitResDto): ProgramRow {
  const id = raw.id == null ? "" : String(raw.id)
  const code = typeof raw.code === "string" ? raw.code : ""
  const name = raw.name == null ? "" : String(raw.name)
  const description = raw.description == null ? "" : String(raw.description)
  const medicalPct = raw.medicalpercent == null ? "0.00" : String(raw.medicalpercent)
  const departmentName =
    raw.department && typeof raw.department.name === "string" ? raw.department.name : ""

  return {
    id,
    tab: "Budget Units",
    code,
    name,
    description,
    medicalPct,
    department: departmentName,
    active: isActiveStatus(raw.status),
    hierarchyLevel: 0,
    type: "bu",
  }
}

function mapTimeStudyProgramToProgramRow(raw: TimeStudyProgramResDto): ProgramRow {
  const id = raw.id == null ? "" : String(raw.id)
  const code = raw.code == null ? "" : String(raw.code)
  const name = raw.name == null ? "" : String(raw.name)
  const normalizedType =
    typeof raw.type === "string" ? String(raw.type).trim().toLowerCase() : ""
  const departmentName =
    raw.department && typeof raw.department.name === "string" ? raw.department.name : ""
  const parentBudgetUnitName =
    raw.budgetProgram && typeof raw.budgetProgram.name === "string"
      ? raw.budgetProgram.name
      : undefined
  const timeStudyBudgetProgramId =
    raw.budgetProgram && typeof raw.budgetProgram.id === "number"
      ? String(raw.budgetProgram.id)
      : undefined

  const hierarchyLevel: 0 | 1 | 2 =
    normalizedType === TimeStudyProgramTypeEnum.SECONDARY
      ? 1
      : normalizedType === TimeStudyProgramTypeEnum.SUBPROGRAM
        ? 2
        : 0

  return {
    id,
    tab: "Time Study programs",
    code,
    name,
    description: "",
    medicalPct: "0.00",
    department: departmentName,
    active: isActiveStatus(raw.status),
    parentBudgetUnitName,
    hierarchyLevel,
    type: normalizedType || undefined,
    parentId: raw.parentId == null ? undefined : String(raw.parentId),
    timeStudyBudgetProgramId,
    costAllocation: raw.costAllocation === true,
    isMultiCode: raw.isMultiCode === true,
  }
}

function mapBudgetProgramToProgramRow(raw: BudgetProgramResDto): ProgramRow {
  const id = raw.id == null ? "" : String(raw.id)
  const code = raw.code == null ? "" : String(raw.code)
  const name = raw.name == null ? "" : String(raw.name)
  const description = raw.description == null ? "" : String(raw.description)
  const departmentName =
    raw.department && typeof raw.department.name === "string" ? raw.department.name : ""
  const parentBudgetUnitName =
    raw.budgetUnit && typeof raw.budgetUnit.name === "string"
      ? raw.budgetUnit.name
      : undefined

  return {
    id,
    tab: "Time Study programs",
    code,
    name,
    description,
    medicalPct: raw.medicalpercent == null ? "0.00" : String(raw.medicalpercent),
    department: departmentName,
    active: isActiveStatus(raw.status),
    parentId: raw.parentId == null ? undefined : String(raw.parentId),
    parentBudgetUnitName,
    type: typeof raw.type === "string" ? raw.type : undefined,
  }
}

async function fetchBudgetUnits(params: GetProgramsParams): Promise<ProgramListResponse> {
  const page = params.page ?? 1
  const limit = Math.min(100, params.pageSize ?? 20)
  const query = new URLSearchParams()
  // Match backend param order for table: page, limit, sort, status
  query.set("page", String(page))
  query.set("limit", String(limit))
  query.set("sort", "ASC")
  query.set("status", params.inactiveOnly ? "inactive" : "active")
  const trimmedSearch = params.search?.trim()
  if (trimmedSearch) {
    query.set("search", trimmedSearch)
  }
  const res = await api.get<ApiEnvelope<BudgetUnitListResponseDto>>(
    `/budgetunits?${query.toString()}`
  )
  const payload = (res?.data ?? res) as BudgetUnitListResponseDto
  const list = Array.isArray(payload?.data) ? payload.data : []
  const items = list.map(mapBudgetUnitToProgramRow)
  const totalItems = extractTotalItems(payload?.meta) ?? items.length

  return { items, totalItems }
}

async function fetchTimeStudyPrograms(params: GetProgramsParams): Promise<ProgramListResponse> {
  const page = params.page ?? 1
  const limit = Math.min(100, params.pageSize ?? 20)
  const query = new URLSearchParams()
  // Match backend param order: page, limit, sort, status
  query.set("page", String(page))
  query.set("limit", String(limit))
  query.set("sort", "ASC")
  query.set(
    "status",
    params.inactiveOnly ? TimeStudyProgramStatusEnum.INACTIVE : TimeStudyProgramStatusEnum.ACTIVE
  )
  query.set("type", TimeStudyProgramTypeEnum.PRIMARY)
  const trimmedSearch = params.search?.trim()
  if (trimmedSearch) {
    query.set("search", trimmedSearch)
  }

  const res = await api.get<ApiEnvelope<TimeStudyProgramListResponseDto>>(
    `/timestudyprograms?${query.toString()}`
  )
  const rawPayload = (res?.data ?? res) as unknown

  // When using search, backend returns a plain array (legacy searchPrograms),
  // otherwise it returns the standard { data, meta } envelope.
  const list: TimeStudyProgramResDto[] = Array.isArray(rawPayload)
    ? rawPayload
    : Array.isArray((rawPayload as TimeStudyProgramListResponseDto | null | undefined)?.data)
      ? (rawPayload as TimeStudyProgramListResponseDto).data ?? []
      : []

  const meta =
    Array.isArray(rawPayload) || !rawPayload
      ? undefined
      : (rawPayload as TimeStudyProgramListResponseDto).meta

  const items = list.map(mapTimeStudyProgramToProgramRow)
  const totalItems = extractTotalItems(meta) ?? items.length

  return { items, totalItems }
}

async function fetchProgramActivityRelations(
  _params: GetProgramsParams
): Promise<ProgramListResponse> {
  return { items: [], totalItems: 0 }
}

export async function apiGetPrograms(params: GetProgramsParams): Promise<ProgramListResponse> {
  if (params.tab === "Budget Units") {
    return fetchBudgetUnits(params)
  }
  if (params.tab === "Time Study programs") {
    return fetchTimeStudyPrograms(params)
  }
  return fetchProgramActivityRelations(params)
}

export function canUseBackendForTab(tab: ProgramTab): boolean {
  return tab === "Budget Units" || tab === "Time Study programs"
}

export async function apiCreateProgram(input: CreateProgramInput & {
  /** Lookups from `useGetProgramFormOptions` */
  lookups?: {
    departmentIdByName?: Record<string, number>
    budgetUnitIdByName?: Record<string, number>
    budgetProgramIdByName?: Record<string, number>
  }
}): Promise<ProgramRow> {
  const { tab, values } = input
  const lookups = input.lookups ?? {}

  // Budget Unit creation
  if (tab === "Budget Units" && values.formSection === "Budget Unit") {
    const deptId = lookups.departmentIdByName?.[values.budgetUnitDepartment.trim()]
    if (!deptId) throw new Error("Please Select Department")

    const body = {
      code: values.budgetUnitCode.trim(),
      name: values.budgetUnitName.trim(),
      description: values.budgetUnitDescription.trim(),
      departmentId: deptId,
      status: toStatus(values.active),
      medicalpercent: parsePercent(values.budgetUnitMedicalPct),
    }
    const raw = await api.post<ApiEnvelope<{ id: number }>>("/budgetunits", body)
    const createdId = (raw as any)?.data?.id
    if (createdId == null) throw new Error("Create response missing id")
    const detail = await api.get<ApiEnvelope<BudgetUnitResDto>>(`/budgetunits/${encodeURIComponent(String(createdId))}`)
    const entity = (detail as any)?.data
    if (!entity) throw new Error("Failed to load created budget unit")
    return mapBudgetUnitToProgramRow(entity as BudgetUnitResDto)
  }

  // Budget Program creation (from Budget Units tab "BU Program" section)
  if (tab === "Budget Units" && values.formSection === "BU Program") {
    const deptId = lookups.departmentIdByName?.[values.buProgramDepartment.trim()]
    if (!deptId) throw new Error("Please Select Department")
    const budgetUnitId = lookups.budgetUnitIdByName?.[values.buProgramBudgetUnitName.trim()]
    if (!budgetUnitId) throw new Error("Please Select Budget Unit")

    const body = {
      code: values.buProgramProgramCode.trim(),
      name: values.buProgramProgramName.trim(),
      description: values.buProgramDescription.trim(),
      budgetUnitId,
      departmentId: deptId,
      status: toStatus(values.active),
      type: "program",
      medicalpercent: parsePercent(values.buProgramMedicalPct),
    }
    const raw = await api.post<ApiEnvelope<{ id: number }>>("/budgetprograms", body)
    const createdId = (raw as any)?.data?.id
    if (createdId == null) throw new Error("Create response missing id")
    const detail = await api.get<ApiEnvelope<BudgetProgramResDto>>(`/budgetprograms/${encodeURIComponent(String(createdId))}`)
    const entity = (detail as any)?.data
    if (!entity) throw new Error("Failed to load created budget program")
    const mapped = mapBudgetProgramToProgramRow(entity as BudgetProgramResDto)
    return { ...mapped, hierarchyLevel: 1 }
  }

  // BU Sub-Program creation (from Budget Units tab "BU Sub-Program" section)
  if (tab === "Budget Units" && values.formSection === "BU Sub-Program") {
    const parentProgramId =
      lookups.budgetProgramIdByName?.[values.buSubProgramBudgetUnitProgramName.trim()]
    if (!parentProgramId) throw new Error("Please Select Budget Program")

    // Load parent Budget Program to get its budgetUnitId and departmentId.
    const parentDetail = await api.get<ApiEnvelope<BudgetProgramResDto>>(
      `/budgetprograms/${encodeURIComponent(String(parentProgramId))}`
    )
    const parentEntity = (parentDetail as any)?.data as BudgetProgramResDto | undefined
    const budgetUnitId =
      parentEntity && typeof parentEntity.budgetUnit?.id === "number"
        ? parentEntity.budgetUnit.id
        : undefined
    const departmentId =
      parentEntity && typeof parentEntity.department?.id === "number"
        ? parentEntity.department.id
        : lookups.departmentIdByName?.[values.buSubProgramDepartment.trim()] ??
          lookups.departmentIdByName?.[values.budgetUnitDepartment.trim()]

    if (!budgetUnitId) throw new Error("Budget Unit not found for selected program")
    if (!departmentId) throw new Error("Please Select Department")

    const body: Record<string, unknown> = {
      code: values.buSubProgramCode.trim(),
      name: values.buSubProgramName.trim(),
      description: values.buSubProgramDescription.trim(),
      budgetUnitId,
      departmentId,
      status: toStatus(values.active),
      type: BudgetProgramTypeEnum.SUBPROGRAM,
      medicalpercent: parsePercent(values.buSubProgramMedicalPct),
      parentId: parentProgramId,
    }

    const raw = await api.post<ApiEnvelope<{ id: number }>>("/budgetprograms", body)
    const createdId = (raw as any)?.data?.id
    if (createdId == null) throw new Error("Create response missing id")
    const detail = await api.get<ApiEnvelope<BudgetProgramResDto>>(
      `/budgetprograms/${encodeURIComponent(String(createdId))}`
    )
    const entity = (detail as any)?.data
    if (!entity) throw new Error("Failed to load created budget sub program")
    const mapped = mapBudgetProgramToProgramRow(entity as BudgetProgramResDto)
    return { ...mapped, hierarchyLevel: 2 }
  }

  if (tab === "Time Study programs") {
    const isPrimary = values.formSection === "BU Program"
    const isSecondary = values.formSection === "BU Sub-Program"
    const type: TimeStudyProgramTypeEnum = isPrimary
      ? TimeStudyProgramTypeEnum.PRIMARY
      : isSecondary
        ? TimeStudyProgramTypeEnum.SECONDARY
        : TimeStudyProgramTypeEnum.SUBPROGRAM

    const departmentName = isPrimary
      ? values.buProgramDepartment
      : isSecondary
        ? values.buSubProgramDepartment
        : values.budgetUnitDepartment

    const deptId = lookups.departmentIdByName?.[departmentName.trim()]
    if (!deptId) throw new Error("Please Select Department")

    let budgetProgramId: number | undefined = undefined
    let parentId: number | undefined = undefined

    if (isPrimary) {
      budgetProgramId = lookups.budgetProgramIdByName?.[values.buProgramBudgetUnitName.trim()]
      if (!budgetProgramId) throw new Error("Please Select Budget Program")
    } else if (isSecondary || !isPrimary) {
      // For secondary and tertiary (subprogram), the selected "TS Program" is the Primary Time Study Program.
      // We must fetch it to get its ID (parentId) and its budgetProgramId.
      const primaryName = isSecondary 
        ? values.buSubProgramBudgetUnitProgramName.trim()
        : values.budgetUnitName.trim()
        
      const search = new URLSearchParams()
      search.set("page", "1")
      search.set("limit", "100")
      search.set("status", TimeStudyProgramStatusEnum.ACTIVE)
      search.set("type", TimeStudyProgramTypeEnum.PRIMARY)
      
      const res = await api.get<ApiEnvelope<{ data?: any[] }>>(`/timestudyprograms?${search.toString()}`)
      const list = Array.isArray(res?.data?.data) ? res.data.data : []
      const found = list.find((p: any) => p.name === primaryName)
      
      if (!found) throw new Error(`Could not find active TS Program: ${primaryName}`)
      
      parentId = found.id
      budgetProgramId = found.budgetProgram?.id
      if (!budgetProgramId) throw new Error(`TS Program '${primaryName}' is missing budgetProgramId`)
    }

    const code = isPrimary
      ? values.buProgramProgramCode.trim()
      : isSecondary
        ? values.buSubProgramCode.trim()
        : values.buProgramProgramCode.trim() // TS Sub-Program Two maps Code to buProgramProgramCode

    const name = isPrimary
      ? values.buProgramProgramName.trim()
      : isSecondary
        ? values.buSubProgramName.trim()
        : values.buProgramProgramName.trim() // TS Sub-Program Two maps Name to buProgramProgramName

    const body = {
      code,
      name,
      budgetProgramId,
      departmentId: deptId,
      status: toStatus(values.active),
      type,
      costAllocation: values.costAllocation,
      isMultiCode: false,
      multiCodeType: TimeStudyProgramMultiCodeTypeEnum.NORMAL,
      groupMaster: false,
      ...(parentId ? { parentId } : {}),
    }

    const raw = await api.post<ApiEnvelope<{ id: number; code?: string }>>("/timestudyprograms", body)
    const createdId = (raw as any)?.data?.id
    if (createdId == null) throw new Error("Create response missing id")
    const detail = await api.get<ApiEnvelope<TimeStudyProgramResDto>>(`/timestudyprograms/${encodeURIComponent(String(createdId))}`)
    const entity = (detail as any)?.data
    if (!entity) throw new Error("Failed to load created time study program")
    return mapTimeStudyProgramToProgramRow(entity as TimeStudyProgramResDto)
  }

  throw new Error("Create not supported for this section yet")
}

export async function apiUpdateProgram(input: UpdateProgramInput & {
  lookups?: {
    departmentIdByName?: Record<string, number>
    budgetUnitIdByName?: Record<string, number>
    budgetProgramIdByName?: Record<string, number>
  }
}): Promise<ProgramRow> {
  const { id, tab, values } = input

  if (tab === "Budget Units" && values.formSection === "Budget Unit") {
    // We omit departmentId because it is locked in the UI during edit mode
    // and the backend will preserve the existing relation.
    const body: Record<string, unknown> = {
      code: values.budgetUnitCode.trim(),
      name: values.budgetUnitName.trim(),
      description: values.budgetUnitDescription.trim(),
      status: toStatus(values.active),
      medicalpercent: parsePercent(values.budgetUnitMedicalPct),
    }
    const raw = await api.put<ApiEnvelope<BudgetUnitResDto>>(`/budgetunits/${encodeURIComponent(id)}`, body)
    const entity = (raw as any)?.data
    if (!entity) throw new Error("Update response missing data")
    return mapBudgetUnitToProgramRow(entity as BudgetUnitResDto)
  }

  if (tab === "Budget Units" && values.formSection === "BU Program") {
    // We omit departmentId and budgetUnitId because they are locked.
    const body: Record<string, unknown> = {
      code: values.buProgramProgramCode.trim(),
      name: values.buProgramProgramName.trim(),
      description: values.buProgramDescription.trim(),
      status: toStatus(values.active),
      type: "program",
      medicalpercent: parsePercent(values.buProgramMedicalPct),
    }
    const raw = await api.put<ApiEnvelope<BudgetProgramResDto>>(
      `/budgetprograms/${encodeURIComponent(id)}`,
      body
    )
    const entity = (raw as any)?.data
    if (!entity) throw new Error("Update response missing data")

    const mapped = mapBudgetProgramToProgramRow(entity as BudgetProgramResDto)
    return { ...mapped, hierarchyLevel: 1 }
  }

  // BU Sub-Program update (from Budget Units tab "BU Sub-Program" section)
  if (tab === "Budget Units" && values.formSection === "BU Sub-Program") {
    // In edit mode we do NOT allow changing parent program / BU / department,
    // so we only update editable fields and keep existing relations.
    const body: Record<string, unknown> = {
      code: values.buSubProgramCode.trim(),
      name: values.buSubProgramName.trim(),
      description: values.buSubProgramDescription.trim(),
      status: toStatus(values.active),
      type: BudgetProgramTypeEnum.SUBPROGRAM,
      medicalpercent: parsePercent(values.buSubProgramMedicalPct),
    }

    const raw = await api.put<ApiEnvelope<BudgetProgramResDto>>(
      `/budgetprograms/${encodeURIComponent(id)}`,
      body
    )
    const entity = (raw as any)?.data
    if (!entity) throw new Error("Update response missing data")

    const mapped = mapBudgetProgramToProgramRow(entity as BudgetProgramResDto)
    return { ...mapped, hierarchyLevel: 2 }
  }

  if (tab === "Time Study programs") {
    const isPrimary = values.formSection === "BU Program"
    const isSecondary = values.formSection === "BU Sub-Program"
    const type = isPrimary ? "primary" : isSecondary ? "secondary" : "subprogram"

    const code = isPrimary
      ? values.buProgramProgramCode.trim()
      : isSecondary
        ? values.buSubProgramCode.trim()
        : values.buProgramProgramCode.trim() // TS Sub-Program Two uses buProgramProgramCode

    const name = isPrimary
      ? values.buProgramProgramName.trim()
      : isSecondary
        ? values.buSubProgramName.trim()
        : values.buProgramProgramName.trim() // TS Sub-Program Two uses buProgramProgramName

    // We omit departmentId and budgetProgramId because they are locked.
    const body: Record<string, unknown> = {
      code,
      name,
      status: toStatus(values.active),
      type,
      costAllocation: values.costAllocation,
      isMultiCode: false,
      multiCodeType: TimeStudyProgramMultiCodeTypeEnum.NORMAL,
      groupMaster: false,
    }
    const raw = await api.put<ApiEnvelope<TimeStudyProgramResDto>>(
      `/timestudyprograms/${encodeURIComponent(id)}`,
      body
    )
    const entity = (raw as any)?.data
    if (!entity) throw new Error("Update response missing data")

    return mapTimeStudyProgramToProgramRow(entity as TimeStudyProgramResDto)
  }

  throw new Error("Update not supported for this section yet")
}

export async function apiGetProgramRowById(input: {
  /** Current Program tab where edit was triggered */
  activeTab: ProgramTab
  row: ProgramRow
}): Promise<ProgramRow> {
  const { activeTab, row } = input

  // Budget Units tab can contain BU rows (level 0) and lazy-loaded Budget Program rows (children).
  if (activeTab === "Budget Units") {
    const isBudgetUnitRow = row.hierarchyLevel === 0 || row.type === "bu" || (!row.parentId && row.type !== "program" && row.type !== "subprogram")
    if (isBudgetUnitRow) {
      const raw = await api.get<ApiEnvelope<BudgetUnitResDto>>(
        `/budgetunits/${encodeURIComponent(row.id)}`
      )
      const entity = (raw as ApiEnvelope<BudgetUnitResDto>)?.data ?? (raw as any)
      return mapBudgetUnitToProgramRow(entity as BudgetUnitResDto)
    }

    const raw = await api.get<ApiEnvelope<BudgetProgramResDto>>(
      `/budgetprograms/${encodeURIComponent(row.id)}`
    )
    const entity = (raw as ApiEnvelope<BudgetProgramResDto>)?.data ?? (raw as any)
    const mapped = mapBudgetProgramToProgramRow(entity as BudgetProgramResDto)
    return {
      ...mapped,
      hierarchyLevel: row.hierarchyLevel,
      parentId: row.parentId,
      type: mapped.type || row.type,
      tab: activeTab, // Always use current activeTab rather than mapper defaults
    }
  }

  // Time Study programs tab.
  if (activeTab === "Time Study programs") {
    const raw = await api.get<ApiEnvelope<TimeStudyProgramResDto>>(
      `/timestudyprograms/${encodeURIComponent(row.id)}`
    )
    const entity = (raw as ApiEnvelope<TimeStudyProgramResDto>)?.data ?? (raw as any)
    return mapTimeStudyProgramToProgramRow(entity as TimeStudyProgramResDto)
  }
 // Program Activity Relation not yet wired to backend.
  return row
}

