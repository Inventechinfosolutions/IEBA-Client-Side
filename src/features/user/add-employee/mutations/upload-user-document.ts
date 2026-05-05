import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiUploadUserDocument } from "../api"

export function useUploadUserDocument() {
  return useMutation({
    mutationFn: ({ userId, docType, file }: { userId: string; docType: string; file: File }) =>
      apiUploadUserDocument(userId, docType, file),
    onSuccess: () => {
      toast.success("Document uploaded successfully")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload document")
    },
  })
}
