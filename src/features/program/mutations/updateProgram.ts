import { useMutation, useQueryClient } from "@tanstack/react-query"

import { programKeys } from "../keys"
import { updateMockProgram } from "../mock"
import type { UpdateProgramInput } from "../types"

async function updateProgram(input: UpdateProgramInput) {
  return updateMockProgram(input)
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProgramInput) => updateProgram(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: programKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) })
    },
  })
}
