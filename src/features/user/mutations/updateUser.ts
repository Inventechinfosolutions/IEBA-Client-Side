import { useMutation, useQueryClient } from "@tanstack/react-query"

import { userModuleKeys } from "../keys"
import { MOCK_NETWORK_DELAY_MS, delay, mockUserRows } from "../mock"
import type { UpdateUserModuleInput, UserModuleRow } from "../types"

async function updateUserModuleRow(
  input: UpdateUserModuleInput,
): Promise<UserModuleRow> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const existing = mockUserRows.find((row) => row.id === input.id)
  if (!existing) {
    throw new Error("Employee record not found")
  }

  const updated: UserModuleRow = {
    ...existing,
    loginId: input.values.loginId.trim(),
    password: input.values.password.trim(),
    emailAddress: input.values.emailAddress?.trim() || input.values.loginId.trim(),
    employeeNo: input.values.employeeNo.trim(),
    positionNo: input.values.positionNo?.trim(),
    location: input.values.location?.trim() || "Susanville",
    firstName: input.values.firstName.trim(),
    lastName: input.values.lastName.trim(),
    phone: input.values.phone?.trim(),
    jobClassification: input.values.jobClassification?.trim(),
    claimingUnit: input.values.claimingUnit?.trim(),
    multilingual: input.values.multilingual,
    allowMultiCodes: input.values.allowMultiCodes,
    pkiUser: input.values.pkiUser,
    employee: `${input.values.firstName.trim()} ${input.values.lastName.trim()}`.trim(),
    department: input.values.claimingUnit?.trim() || existing.department,
    roleAssignments: input.values.roleAssignments.length
      ? input.values.roleAssignments
      : existing.roleAssignments ?? ["User"],
    supervisorPrimary: input.values.supervisorPrimary?.trim() || existing.supervisorPrimary,
    supervisorSecondary:
      input.values.supervisorSecondary?.trim() || existing.supervisorSecondary,
    spmp: input.values.spmp,
    tsMinDay: input.values.tsMinDay?.trim() || existing.tsMinDay,
    programs: input.values.programs,
    activities: input.values.activities,
    supervisorApportioning: input.values.supervisorApportioning,
    multicodesEnabled: input.values.allowMultiCodes,
    assignedMultiCodes: input.values.assignedMultiCodes?.trim() || "",
    active: input.values.active,
  }

  const rowIndex = mockUserRows.findIndex((row) => row.id === input.id)
  if (rowIndex >= 0) {
    mockUserRows[rowIndex] = updated
  }

  return updated
}

export function useUpdateUserModuleRow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateUserModuleInput) => updateUserModuleRow(input),
    onSuccess: (updatedRow) => {
      queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: userModuleKeys.detail(updatedRow.id),
      })
    },
  })
}
