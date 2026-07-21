import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiUpdateUser } from "../api"
import { userModuleKeys } from "../keys"
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

/** Backend userprofile.positionName = Position # (not job classification label). */
function clampPositionName(raw: string): string {
  const t = raw.trim()
  if (t.length <= 255) return t
  return t.slice(0, 255)
}

function mapUpdateInput(input: UpdateUserModuleInput): UpdateUserRequestDto {
  const { values, defaultValues, allowLoginIdUpdate = false } = input
  
  if (!defaultValues) {
    const passwordTrimmed = values.password.trim()
    const locationId = normalizeLocationId(values.locationId)
    const jcIds = values.jobClassificationIds ?? []
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      ...(passwordTrimmed !== "" ? { password: passwordTrimmed } : {}),
      employeeId: values.employeeNo.trim(),
      positionName: clampPositionName(values.positionNo ?? ""),
      jobClassificationIds: jcIds,
      active: values.active,
      pki: values.pkiUser,
      spmp: values.spmp,
      multilingual: values.multilingual,
      allowMultiCodes: values.allowMultiCodes ? true : null,
      tsMinPerDay: toTsMinPerDay(values.tsMinDay),
      claimingUnit: values.claimingUnit.trim(),
      assignedMultiCodes: toAssignedMultiCodes(values.assignedMultiCodes),
      ...(locationId != null ? { locationId } : {}),
      contacts: contactsPayloadForUpdate(values.phone),
      primarySupervisorId: (values.supervisorPrimaryId ?? "").trim(),
      backupSupervisorId: (values.supervisorSecondaryId ?? "").trim(),
      supervisorApportioning: values.supervisorApportioning,
      activationStartDate: values.activationStartDate || undefined,
      activationEndDate: values.activationEndDate || undefined,
    }
  }

  const dto: UpdateUserRequestDto = {}

  if (values.firstName.trim() !== (defaultValues.firstName ?? "").trim()) {
    dto.firstName = values.firstName.trim()
  }
  if (values.lastName.trim() !== (defaultValues.lastName ?? "").trim()) {
    dto.lastName = values.lastName.trim()
  }

  if (
    allowLoginIdUpdate &&
    values.loginId.trim() !== (defaultValues.loginId ?? "").trim()
  ) {
    dto.loginId = values.loginId.trim()
  }
  
  const passwordTrimmed = values.password.trim()
  if (passwordTrimmed !== "" && passwordTrimmed !== (defaultValues.password ?? "").trim()) {
    dto.password = passwordTrimmed
  }
  if (values.employeeNo.trim() !== (defaultValues.employeeNo ?? "").trim()) {
    dto.employeeId = values.employeeNo.trim()
  }
  
  const posVal = clampPositionName(values.positionNo ?? "")
  const posDef = clampPositionName(defaultValues.positionNo ?? "")
  if (posVal !== posDef) {
    dto.positionName = posVal
  }

  const currentJcIds = values.jobClassificationIds ?? []
  const defaultJcIds = defaultValues.jobClassificationIds ?? []
  const jcIdsChanged =
    currentJcIds.length !== defaultJcIds.length ||
    currentJcIds.some((id, idx) => id !== defaultJcIds[idx])
  if (jcIdsChanged) {
    dto.jobClassificationIds = currentJcIds
  }

  if (values.active !== defaultValues.active) {
    dto.active = values.active
  }
  if (values.pkiUser !== defaultValues.pkiUser) {
    dto.pki = values.pkiUser
  }
  if (values.spmp !== defaultValues.spmp) {
    dto.spmp = values.spmp
  }
  if (values.multilingual !== defaultValues.multilingual) {
    dto.multilingual = values.multilingual
  }
  if (values.allowMultiCodes !== defaultValues.allowMultiCodes) {
    dto.allowMultiCodes = values.allowMultiCodes ? true : null
  }
  
  const currentTsMin = toTsMinPerDay(values.tsMinDay)
  const defaultTsMin = toTsMinPerDay(defaultValues.tsMinDay)
  if (currentTsMin !== defaultTsMin) {
    dto.tsMinPerDay = currentTsMin
  }

  if (values.claimingUnit.trim() !== (defaultValues.claimingUnit ?? "").trim()) {
    dto.claimingUnit = values.claimingUnit.trim()
  }

  const currentMultiCodes = toAssignedMultiCodes(values.assignedMultiCodes)
  const defaultMultiCodes = toAssignedMultiCodes(defaultValues.assignedMultiCodes)
  const multiCodesChanged =
    JSON.stringify(currentMultiCodes) !== JSON.stringify(defaultMultiCodes)
  if (multiCodesChanged) {
    dto.assignedMultiCodes = currentMultiCodes
  }

  const locVal = normalizeLocationId(values.locationId)
  const locDef = normalizeLocationId(defaultValues.locationId)
  if (locVal !== locDef) {
    dto.locationId = locVal ?? undefined
  }

  if (values.phone.trim() !== (defaultValues.phone ?? "").trim()) {
    dto.contacts = contactsPayloadForUpdate(values.phone)
  }

  if ((values.supervisorPrimaryId ?? "").trim() !== (defaultValues.supervisorPrimaryId ?? "").trim()) {
    dto.primarySupervisorId = (values.supervisorPrimaryId ?? "").trim()
  }

  if ((values.supervisorSecondaryId ?? "").trim() !== (defaultValues.supervisorSecondaryId ?? "").trim()) {
    dto.backupSupervisorId = (values.supervisorSecondaryId ?? "").trim()
  }

  if (values.supervisorApportioning !== defaultValues.supervisorApportioning) {
    dto.supervisorApportioning = values.supervisorApportioning
  }

  if ((values.activationStartDate || "") !== (defaultValues.activationStartDate || "")) {
    dto.activationStartDate = values.activationStartDate || undefined
  }

  if ((values.activationEndDate || "") !== (defaultValues.activationEndDate || "")) {
    dto.activationEndDate = values.activationEndDate || undefined
  }

  return dto
}

export function useUpdateUserModuleRow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateUserModuleInput): Promise<CreateUserResponseDto> => {
      const dto = mapUpdateInput(input)
      return await apiUpdateUser(input.id, dto)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
      // Detail is refetched explicitly by the edit form after save to avoid duplicate GET /details calls.
    },
  })
}
