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
      // Invalidate all cached program lists so they refetch and reflect filter changes
      await queryClient.invalidateQueries({ queryKey: programKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) })
    },
  })
}
