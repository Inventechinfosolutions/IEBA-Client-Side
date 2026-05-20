import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

import type { ProgramsUpdateFormValues } from "../types"

type UpdateUserProgramAssignmentsInput = {
  fiscalYearId: string
  userId: string
  isUpdate?: boolean
  values: ProgramsUpdateFormValues
  initialValues?: ProgramsUpdateFormValues
}

/** Matches backend DTO: `id` is programId when isupdate=false, assignment row id when isupdate=true. */
type UserProgramAssignmentItemDto = {
  id: number
  budgetedfte: number
  allocatedfte: number
}

type CreateUserProgramAssignmentReqDto = {
  programAssignments: UserProgramAssignmentItemDto[]
}

function toRequestBody(values: ProgramsUpdateFormValues): CreateUserProgramAssignmentReqDto {
  return {
    programAssignments: values.programs.map((p) => {
      const id = Number(p.id)
      if (!Number.isFinite(id)) {
        throw new Error(`Invalid program id: ${p.id}`)
      }
      return {
        id,
        budgetedfte: Number(p.budgetedFte),
        allocatedfte: Number(p.allocatedFte),
      }
    }),
  }
}

async function postUserProgramAssignments(
  input: UpdateUserProgramAssignmentsInput
): Promise<void> {
  if (input.initialValues) {
    const initialMap = new Map(
      input.initialValues.programs.map((p) => [
        p.id,
        { budgetedFte: Number(p.budgetedFte) || 0, allocatedFte: Number(p.allocatedFte) || 0 }
      ])
    )
    
    let hasChanges = false
    for (const p of input.values.programs) {
      const match = initialMap.get(p.id)
      const currentBudgeted = Number(p.budgetedFte) || 0
      const currentAllocated = Number(p.allocatedFte) || 0
      if (!match) {
        if (currentBudgeted > 0 || currentAllocated > 0) {
          hasChanges = true
          break
        }
      } else {
        if (currentBudgeted !== match.budgetedFte || currentAllocated !== match.allocatedFte) {
          hasChanges = true
          break
        }
      }
    }
    
    if (!hasChanges) {
      const currentIds = new Set(input.values.programs.map(p => p.id))
      for (const [id, match] of initialMap.entries()) {
        if (!currentIds.has(id)) {
          if (match.budgetedFte > 0 || match.allocatedFte > 0) {
            hasChanges = true
            break
          }
        }
      }
    }

    if (!hasChanges) {
      throw new Error("No changes to save")
    }
  }

  const search = new URLSearchParams()
  search.set("isupdate", String(input.isUpdate ?? false))
  search.set("fiscalYear", input.fiscalYearId)
  search.set("userId", input.userId)

  const body = toRequestBody(input.values)

  const res = await api.post<ApiResponseDto<unknown>>(
    `/userprogramassignment?${search.toString()}`,
    body
  )

  // apiRequest already throws on `success:false`, but keep a tight guard
  if (res && typeof res === "object" && "success" in res && res.success === false) {
    throw new Error(res.message ?? "Update failed")
  }
}

export function useUpdateUserProgramAssignments() {
  return useMutation({
    mutationFn: postUserProgramAssignments,
  })
}

