import { useMutation, useQueryClient } from "@tanstack/react-query"

import { uploadPayrollForm } from "../api/payrollApi"
import { payrollKeys } from "../key"
import type { PayrollFrequencyType } from "../types"

type UploadPayrollVariables = {
  uploadType: PayrollFrequencyType
  file: File | null
}

async function uploadPayrollFile({ uploadType, file }: UploadPayrollVariables) {
  if (!file) {
    throw new Error("Choose a file before uploading.")
  }
  return await uploadPayrollForm(file, uploadType)
}

export function useUploadPayrollFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadPayrollFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.lists() })
    },
  })
}
