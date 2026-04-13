import { useMutation } from "@tanstack/react-query"

import { uploadPayrollForm } from "../api/payrollApi"
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
  return useMutation({
    mutationFn: uploadPayrollFile,
  })
}
