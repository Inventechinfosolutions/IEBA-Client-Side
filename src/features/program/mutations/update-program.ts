import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { programKeys } from "../keys"
import { apiUpdateProgram } from "../api"
import type { ProgramListResponse, ProgramRow, UpdateProgramInput } from "../types"

async function updateProgram(input: UpdateProgramInput) {
  return apiUpdateProgram(input)
}

export function useUpdateProgram() {

  return useMutation({
    mutationFn: (input: UpdateProgramInput) => updateProgram(input),
    onSuccess: async (updatedRow: ProgramRow, variables) => {
      // Update all cached program lists to reflect the freshly edited row
      queryClient.setQueriesData<ProgramListResponse>(
        { queryKey: programKeys.lists(), exact: false },
        (existing) => {
          if (!existing) return existing
          return {
            ...existing,
            items: existing.items.map((row) =>
              row.id === updatedRow.id ? { ...row, ...updatedRow } : row
            ),
          }
        }
      )

      // Optionally refresh the specific detail cache, but avoid re-fetching all lists
      await queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) })
    },
  })
}
