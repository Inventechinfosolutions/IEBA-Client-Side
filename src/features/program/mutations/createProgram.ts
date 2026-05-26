import { useMutation } from "@tanstack/react-query"

import { apiCreateProgram } from "../api"
import type { CreateProgramInput } from "../types"

async function createProgram(input: CreateProgramInput) {
  return apiCreateProgram(input)
}

export function useCreateProgram() {
  return useMutation({
    mutationFn: (input: CreateProgramInput) => createProgram(input),
    // No automatic list refetch after save — the caller handles invalidation on modal Exit.
  })
}
