import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiCreateUser } from "../api"
import { userModuleKeys } from "../keys"
import type { CreateUserModuleInput, CreateUserRequestDto, CreateUserResponseDto } from "../types"
import { contactsPayloadForCreate, normalizeLocationId } from "../utility/mapUserDetailsToForm"

function toAssignedMultiCodes(value: string | undefined): string[] | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return undefined
  const parts = raw
    .split(/[,;\n]+/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}

function toTsMinPerDay(value: string | undefined): number | undefined {
  const n = Number.parseInt(String(value ?? "").trim(), 10)
  if (!Number.isFinite(n)) return undefined
  return n
}

/** Backend MaxLength(255) on positionName (Position # field). */
function clampPositionName(raw: string): string {
  const t = raw.trim()
  if (t.length <= 255) return t
  return t.slice(0, 255)
}

function mapCreateInput(input: CreateUserModuleInput): CreateUserRequestDto {
  const locationId = normalizeLocationId(input.values.locationId)
  const contacts = contactsPayloadForCreate(input.values.phone)
  const positionName = clampPositionName(input.values.positionNo ?? "")
  const jcIds = input.values.jobClassificationIds ?? []
  return {
    loginId: input.values.loginId.trim(),
    password: input.values.password.trim(),
    firstName: input.values.firstName.trim(),
    lastName: input.values.lastName.trim(),
    employeeId: input.values.employeeNo.trim(),
    ...(positionName !== "" ? { positionName } : {}),
    ...(jcIds.length > 0 ? { jobClassificationIds: jcIds } : {}),
    active: input.values.active,
    pki: input.values.pkiUser,
    spmp: input.values.spmp,
    multilingual: input.values.multilingual,
    allowMultiCodes: input.values.allowMultiCodes,
    tsMinPerDay: toTsMinPerDay(input.values.tsMinDay) ?? 480,
    claimingUnit: input.values.claimingUnit.trim(),
    assignedMultiCodes: toAssignedMultiCodes(input.values.assignedMultiCodes),
    ...(locationId != null ? { locationId } : {}),
    ...(contacts ? { contacts } : {}),
  }
}

export function useCreateUserModuleRow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUserModuleInput): Promise<CreateUserResponseDto> => {
      const dto = mapCreateInput(input)
      return await apiCreateUser(dto)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
      // Details are loaded explicitly by the add/edit form after save to avoid duplicate GET /details calls.
    },
  })
}
