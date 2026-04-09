import { useMutation } from "@tanstack/react-query"

import { delayMockRequest, MOCK_NETWORK_DELAY_MS } from "../mock"
import type { PayrollFrequencyType } from "../types"

type UploadPayrollVariables = {
  uploadType: PayrollFrequencyType
  file: File | null
}

async function mockUploadPayrollPayload(input: UploadPayrollVariables): Promise<{ ok: true }> {
  if (import.meta.env.DEV) await delayMockRequest(MOCK_NETWORK_DELAY_MS)
  if (!input.file) {
    throw new Error("Choose a file before uploading.")
  }
  return { ok: true }
}

export function useUploadPayrollFile() {
  return useMutation({
    mutationFn: mockUploadPayrollPayload,
  })
}
