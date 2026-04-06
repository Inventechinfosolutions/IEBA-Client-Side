import { useMutation } from "@tanstack/react-query"

import { apiUpdateUser } from "../api"
import type { CreateUserResponseDto, UpdateUserModuleInput, UpdateUserRequestDto } from "../types"
import { contactsPayloadForUpdate, normalizeLocationId } from "../utility/mapUserDetailsToForm"

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

function clampPositionName(raw: string): string {
  const t = raw.trim()
  if (t.length <= 255) return t
  return t.slice(0, 255)
}

function mapUpdateInput(input: UpdateUserModuleInput): UpdateUserRequestDto {
  const passwordTrimmed = input.values.password.trim()
  const locationId = normalizeLocationId(input.values.locationId)
  return {
    firstName: input.values.firstName.trim(),
    lastName: input.values.lastName.trim(),
    ...(passwordTrimmed !== "" ? { password: passwordTrimmed } : {}),
    employeeId: input.values.employeeNo.trim(),
    positionName: clampPositionName(input.values.jobClassification),
    active: input.values.active,
    pki: input.values.pkiUser,
    spmp: input.values.spmp,
    multilingual: input.values.multilingual,
    allowMultiCodes: input.values.allowMultiCodes,
    tsMinPerDay: toTsMinPerDay(input.values.tsMinDay),
    claimingUnit: input.values.claimingUnit.trim(),
    assignedMultiCodes: toAssignedMultiCodes(input.values.assignedMultiCodes),
    ...(locationId != null ? { locationId } : {}),
    contacts: contactsPayloadForUpdate(input.values.phone),
    primarySupervisorId: (input.values.supervisorPrimaryId ?? "").trim(),
    backupSupervisorId: (input.values.supervisorSecondaryId ?? "").trim(),
  }
}

export function useUpdateUserModuleRow() {
  return useMutation({
    mutationFn: async (input: UpdateUserModuleInput): Promise<CreateUserResponseDto> => {
      const dto = mapUpdateInput(input)
      return await apiUpdateUser(input.id, dto)
    },
  })
}
