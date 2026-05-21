import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { programKeys } from "../keys"
import { apiUpdateProgram } from "../api"
import type { UpdateProgramInput } from "../types"

async function updateProgram(input: UpdateProgramInput) {
  return apiUpdateProgram(input)
}

export function useUpdateProgram() {
  return useMutation({
    mutationFn: (input: UpdateProgramInput) => updateProgram(input),
    onSuccess: async (_, variables) => {
      // Invalidate the detail cache only so future opens get fresh data.
      // List refetch is deferred to modal Exit — no table API call on save.
      await queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) })
    },
  })
}
