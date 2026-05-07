import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { programKeys } from "../keys"
import { apiCreateProgram } from "../api"
import type { CreateProgramInput } from "../types"

async function createProgram(input: CreateProgramInput) {
  return apiCreateProgram(input)
}

export function useCreateProgram() {

  return useMutation({
    mutationFn: (input: CreateProgramInput) => createProgram(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programKeys.lists() })
    },
  })
}
