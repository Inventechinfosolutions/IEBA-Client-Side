import { useMutation, useQueryClient } from "@tanstack/react-query"

import { masterCodeKeys } from "../keys"
import { MOCK_NETWORK_DELAY_MS, delay, mockMasterCodeRows } from "../mock"
import type { MasterCodeRow, UpdateMasterCodeInput } from "../types"

async function updateMasterCode(input: UpdateMasterCodeInput): Promise<MasterCodeRow> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const current = mockMasterCodeRows.find((row) => row.id === input.id)
  if (!current) {
    throw new Error("Master code row not found.")
  }

  const activityDescription = input.values.activityDescription.trim()
  const updatedRow: MasterCodeRow = {
    ...current,
    code: input.values.code.trim(),
    name: input.values.name.trim(),
    spmp: input.values.spmp,
    allocable: input.values.allocable,
    ffpPercent: input.values.ffpPercent?.trim() || "0.00",
    match: input.values.match === "E" || input.values.match === "N" ? input.values.match : current.match,
    status: input.values.active,
    activityDescription: activityDescription.length > 0 ? activityDescription : current.activityDescription,
    id: input.id,
  }

  const rowIndex = mockMasterCodeRows.findIndex((row) => row.id === input.id)
  if (rowIndex >= 0) {
    mockMasterCodeRows[rowIndex] = updatedRow
  }

  return updatedRow
}

export function useUpdateMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMasterCodeInput) => updateMasterCode(input),
    onSuccess: (updatedRow) => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: masterCodeKeys.detail(updatedRow.id),
      })
    },
  })
}
