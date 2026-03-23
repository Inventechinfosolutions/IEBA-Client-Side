import { useMutation, useQueryClient } from "@tanstack/react-query"

import { userModuleKeys } from "../keys"
import { MOCK_NETWORK_DELAY_MS, delay, mockUserRows } from "../mock"
import type { CreateUserModuleInput, UserModuleRow } from "../types"

async function createUserModuleRow(
  input: CreateUserModuleInput,
): Promise<UserModuleRow> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const nextId = String(
    mockUserRows.reduce((max, row) => Math.max(max, Number.parseInt(row.id, 10) || 0), 0) + 1,
  )
  const nextRow: UserModuleRow = {
    // Use explicit normalized values from form input for mock persistence.
    // Email is optional in the form, so fallback to loginId when empty.
    // This avoids optional undefined trim errors and keeps edit data stable.
    loginId: input.values.loginId.trim(),
    password: input.values.password.trim(),
    emailAddress: input.values.emailAddress?.trim() || input.values.loginId.trim(),
    id: nextId,
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
    department: input.values.claimingUnit?.trim() || "Public Health",
    roleAssignments: input.values.roleAssignments.length ? input.values.roleAssignments : ["User"],
    supervisorPrimary: input.values.supervisorPrimary?.trim() || "Rugeger Natalie",
    supervisorSecondary: input.values.supervisorSecondary?.trim() || "Rubens Patrick",
    spmp: input.values.spmp,
    tsMinDay: input.values.tsMinDay?.trim() || "480",
    programs: input.values.programs,
    activities: input.values.activities,
    supervisorApportioning: input.values.supervisorApportioning,
    multicodesEnabled: input.values.allowMultiCodes,
    assignedMultiCodes: input.values.assignedMultiCodes?.trim() || "",
    active: input.values.active,
  }
  mockUserRows.unshift(nextRow)

  return nextRow
}

export function useCreateUserModuleRow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserModuleInput) => createUserModuleRow(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userModuleKeys.lists() })
    },
  })
}
