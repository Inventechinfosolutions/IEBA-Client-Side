import { useMutation, useQueryClient } from "@tanstack/react-query"

import { masterCodeKeys } from "../keys"
import { MOCK_NETWORK_DELAY_MS, delay, mockMasterCodeRows } from "../mock"
import type { CreateMasterCodeInput, MasterCodeRow } from "../types"

async function createMasterCode(input: CreateMasterCodeInput): Promise<MasterCodeRow> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const nextId = String(mockMasterCodeRows.length + 1)
  const activityDescription = input.values.activityDescription.trim()
  const nextRow: MasterCodeRow = {
    id: nextId,
    code: input.values.code.trim(),
    name: input.values.name.trim(),
    spmp: input.values.spmp,
    allocable: input.values.allocable,
    ffpPercent: input.values.ffpPercent?.trim() || "0.00",
    match: input.values.match === "E" || input.values.match === "N" ? input.values.match : "N",
    status: input.values.active,
    activityDescription: activityDescription.length > 0 ? activityDescription : undefined,
  }

  mockMasterCodeRows.unshift(nextRow)
  return nextRow
}

export function useCreateMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMasterCodeInput) => createMasterCode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
    },
  })
}
