import { api } from "@/lib/api"
import type { Department, DepartmentUpsertValues } from "../types"

/** Opt out with `VITE_DEPARTMENT_SEND_ADDRESS=false` if Nest DTO still rejects nested `address`. */
const SEND_DEPARTMENT_ADDRESS_IN_BODY =
  import.meta.env.VITE_DEPARTMENT_SEND_ADDRESS !== "false"

/** Nest-style envelope from `ApiResponseDto.success(result, …)`. */
type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

type PaginationMeta = {
  total?: number
  totalItems?: number
  page?: number
  limit?: number
  itemsPerPage?: number
  currentPage?: number
  itemCount?: number
  totalPages?: number
}

type DepartmentListResponseDto = {
  data: unknown[]
  meta?: PaginationMeta
}

type DepartmentResDto = Record<string, unknown> & {
  id?: number
  code?: string
  name?: string
  // backend often uses `status` rather than `active`
  status?: unknown
  // new API may include computed address + contact profiles
  addresses?: unknown
  address?: unknown
  primaryContact?: unknown
  secondaryContact?: unknown
  billingContact?: unknown
  allowMultiCodes?: boolean
  multiCodes?: unknown
  allowUserOrCostpoolDirect?: boolean
  costallocation?: boolean
  apportioning?: boolean
  autoApportioning?: boolean
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
}

/**
 * POST/PUT nested `address` — must match Nest nested DTO + `Address` entity fields.
 * Use `addressLine1` (not `area`); `area`/`type` on `address` trigger forbidNonWhitelisted if not on the DTO.
 */
type DepartmentAddressCreateDto = {
  addressLine1: string
  city: string
  state: string
  zipCode: string
}

/**
 * POST/PUT body — `address` matches Nest whitelist; GET still maps `addresses[]` / nested `address` for display.
 */
type CreateDepartmentReqDto = {
  code: string
  name: string
  status: "active" | "inactive"
  address?: DepartmentAddressCreateDto
  apportioning?: boolean
  costallocation?: boolean
  autoApportioning?: boolean
  allowUserOrCostpoolDirect?: boolean
  allowMultiCodes?: boolean
  multiCodes?: string[]
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
}

type UpdateDepartmentReqDto = Partial<CreateDepartmentReqDto>

type CreateDepartmentResponseDto = {
  id: number
  code: string
}

/** Map one Address row / nested object → UI shape (GET by id, PUT response, list item). */
function pickAddressFromObject(o: Record<string, unknown>): Department["address"] | null {
  const line1 =
    o.street ??
    o.area ??
    o.streetLine1 ??
    o.street_line_1 ??
    o.addressLine1 ??
    o.address_line_1 ??
    o.line1 ??
    o.line_1 ??
    o.address1 ??
    o.address_1
  const line2 = o.line2 ?? o.line_2 ?? o.addressLine2 ?? o.address_line_2 ?? o.address2 ?? o.address_2
  let street: unknown = line1
  if (line1 != null && line2 != null) {
    const a = String(line1).trim()
    const b = String(line2).trim()
    street = b ? `${a} ${b}` : a
  }

  const city = o.city ?? o.cityName ?? o.city_name ?? o.town
  const state = o.state ?? o.stateCode ?? o.state_code ?? o.region ?? o.province
  const zip =
    o.zip ?? o.zipCode ?? o.zip_code ?? o.postalCode ?? o.postal_code ?? o.postal ?? o.pincode ?? o.pin_code

  if (street == null && city == null && state == null && zip == null) return null

  return {
    street: street == null ? "" : String(street).trim(),
    city: city == null ? "" : String(city).trim(),
    state: state == null ? "" : String(state).trim(),
    zip: zip == null ? "" : String(zip).trim(),
  }
}

function addressHasContent(a: Department["address"]): boolean {
  return !!(a.street.trim() || a.city.trim() || a.state.trim() || a.zip.trim())
}

/**
 * Reads `addresses[]`, nested `address`, or flat department fields after GET/PUT.
 * If `addresses` is `[]`, nothing is mapped (same as before).
 */
function addressFromDtoShape(dto: DepartmentResDto): Department["address"] | null {
  const raw = dto as Record<string, unknown>

  const list = raw.addresses
  if (Array.isArray(list)) {
    for (const item of list) {
      if (!item || typeof item !== "object") continue
      const parsed = pickAddressFromObject(item as Record<string, unknown>)
      if (parsed && addressHasContent(parsed)) return parsed
    }
  }

  const nested = raw.address
  if (nested && typeof nested === "object") {
    const parsed = pickAddressFromObject(nested as Record<string, unknown>)
    if (parsed && addressHasContent(parsed)) return parsed
  }

  const parsed = pickAddressFromObject(raw)
  if (parsed && addressHasContent(parsed)) return parsed
  return null
}

function contactFromDtoShape(raw: unknown): Department["primaryContact"] | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const name = o.name ?? o.fullName ?? o.displayName
  const email = o.email ?? o.mail
  const phone = o.phone ?? o.mobile ?? o.mobilePhone
  const location = o.location ?? o.officeLocation ?? o.site
  if (name == null && email == null && phone == null && location == null) return null
  return {
    name: name == null ? "" : String(name).trim(),
    email: email == null ? "" : String(email).trim(),
    phone: phone == null ? "" : String(phone).trim(),
    location: location == null ? "" : String(location).trim(),
  }
}

const EMPTY_DEPARTMENT_UI: Omit<Department, "id" | "code" | "name"> = {
  active: true,
  address: { street: "", city: "", state: "", zip: "" },
  primaryContact: { name: "", phone: "", email: "", location: "" },
  secondaryContact: { name: "", phone: "", email: "", location: "" },
  billingContact: { name: "", phone: "", email: "", location: "" },
  settings: {
    apportioning: false,
    costAllocation: false,
    autoApportioning: false,
    allowUserCostpoolDirect: false,
    allowMultiCodes: false,
    multiCodes: "",
    removeStartEndTime: false,
    removeSupportingDocument: false,
    removeAutoFillEndTime: false,
  },
}

type ToDepartmentUIOptions = {
  /** List rows need `address` for the table; GET-by-id / PUT responses often omit it — map only when true. */
  includeAddress?: boolean
}

function toDepartmentUI(dto: DepartmentResDto, options?: ToDepartmentUIOptions): Department {
  const includeAddress = options?.includeAddress !== false

  const idRaw = dto.id
  const codeRaw = dto.code
  const nameRaw = dto.name

  // status can be boolean or string; treat unknown as "active"
  const active =
    typeof (dto as { active?: unknown }).active === "boolean"
      ? ((dto as { active: boolean }).active as boolean)
      : typeof dto.status === "boolean"
        ? (dto.status as boolean)
        : typeof dto.status === "string"
          ? String(dto.status).toLowerCase() === "active"
          : true

  const allowMultiCodes =
    typeof dto.allowMultiCodes === "boolean"
      ? dto.allowMultiCodes
      : typeof (dto as { allowMultiCode?: unknown }).allowMultiCode === "boolean"
        ? ((dto as { allowMultiCode: boolean }).allowMultiCode as boolean)
        : false

  const multiCodesRaw = dto.multiCodes
  const multiCodes =
    Array.isArray(multiCodesRaw)
      ? multiCodesRaw.map((v) => String(v).trim()).filter(Boolean).join(",")
      : multiCodesRaw == null
        ? ""
        : String(multiCodesRaw).trim()

  const mappedAddress = includeAddress ? addressFromDtoShape(dto) : null
  const mappedPrimary = contactFromDtoShape(dto.primaryContact)
  const mappedSecondary = contactFromDtoShape(dto.secondaryContact)
  const mappedBilling = contactFromDtoShape(dto.billingContact)

  return {
    ...EMPTY_DEPARTMENT_UI,
    id: idRaw == null ? "" : String(idRaw),
    code: typeof codeRaw === "string" ? codeRaw : "",
    name: typeof nameRaw === "string" ? nameRaw : "",
    active,
    ...(mappedAddress ? { address: mappedAddress } : {}),
    ...(mappedPrimary ? { primaryContact: mappedPrimary } : {}),
    ...(mappedSecondary ? { secondaryContact: mappedSecondary } : {}),
    ...(mappedBilling ? { billingContact: mappedBilling } : {}),
    settings: {
      ...EMPTY_DEPARTMENT_UI.settings,
      apportioning: dto.apportioning ?? false,
      costAllocation: dto.costallocation ?? false,
      autoApportioning: dto.autoApportioning ?? false,
      allowUserCostpoolDirect: dto.allowUserOrCostpoolDirect ?? false,
      allowMultiCodes,
      multiCodes,
      removeStartEndTime: dto.startorEndTime ?? false,
      removeSupportingDocument: dto.supportingDoc ?? false,
      removeAutoFillEndTime: dto.removeAutoFillEndTime ?? false,
    },
  }
}

function toCreateUpdateDto(values: DepartmentUpsertValues): CreateDepartmentReqDto {
  const codes =
    values.settings.allowMultiCodes && values.settings.multiCodes?.trim()
      ? values.settings.multiCodes
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : []

  const a = values.address
  const address: DepartmentAddressCreateDto | undefined = addressHasContent(a)
    ? {
        addressLine1: a.street.trim(),
        city: a.city.trim(),
        state: a.state.trim(),
        zipCode: a.zip.trim(),
      }
    : undefined

  return {
    code: values.code.trim(),
    name: values.name.trim(),
    status: values.active ? "active" : "inactive",
    ...(SEND_DEPARTMENT_ADDRESS_IN_BODY && address ? { address } : {}),
    apportioning: values.settings.apportioning,
    costallocation: values.settings.costAllocation,
    autoApportioning: values.settings.autoApportioning,
    allowUserOrCostpoolDirect: values.settings.allowUserCostpoolDirect,
    allowMultiCodes: values.settings.allowMultiCodes,
    multiCodes: codes,
    removeAutoFillEndTime: values.settings.removeAutoFillEndTime,
    startorEndTime: values.settings.removeStartEndTime,
    supportingDoc: values.settings.removeSupportingDocument,
  }
}

export async function getDepartments(params?: {
  page?: number
  limit?: number
}): Promise<{ items: Department[]; total: number }> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 100

  const res = await api.get<ApiEnvelope<DepartmentListResponseDto>>(
    `/departments?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`
  )

  const payload = (res?.data ?? res) as DepartmentListResponseDto
  const list = Array.isArray(payload?.data) ? payload.data : []
  const items = list.map((x) => toDepartmentUI(x as DepartmentResDto, { includeAddress: true }))

  const meta = payload?.meta
  const total =
    typeof meta?.totalItems === "number"
      ? meta.totalItems
      : typeof meta?.total === "number"
        ? meta.total
        : typeof meta?.itemCount === "number"
          ? meta.itemCount
          : items.length

  return { items, total }
}

export async function getDepartmentById(id: string): Promise<Department> {
  const res = await api.get<ApiEnvelope<DepartmentResDto>>(`/departments/${id}`)
  const payload = (res?.data ?? res) as DepartmentResDto
  return toDepartmentUI(payload, { includeAddress: false })
}

export async function createDepartment(
  values: DepartmentUpsertValues
): Promise<CreateDepartmentResponseDto> {
  const body = toCreateUpdateDto(values)
  const res = await api.post<ApiEnvelope<CreateDepartmentResponseDto>>(
    "/departments",
    body
  )
  const payload = (res?.data ?? res) as CreateDepartmentResponseDto
  if (payload?.id == null) {
    throw new Error("Invalid create department response")
  }
  return payload
}

export async function updateDepartment(
  id: string,
  values: DepartmentUpsertValues
): Promise<Department> {
  const body: UpdateDepartmentReqDto = toCreateUpdateDto(values)
  const res = await api.put<ApiEnvelope<DepartmentResDto>>(
    `/departments/${id}`,
    body
  )
  const payload = (res?.data ?? res) as DepartmentResDto
  return toDepartmentUI(payload, { includeAddress: false })
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete<void>(`/departments/${id}`)
}

