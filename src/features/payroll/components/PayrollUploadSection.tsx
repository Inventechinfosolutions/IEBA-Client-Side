import { zodResolver } from "@hookform/resolvers/zod"
import { CloudUpload } from "lucide-react"
import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SingleSelectDropdown, type SingleSelectOption } from "@/components/ui/dropdown"
import { Label } from "@/components/ui/label"

import { payrollUploadFormSchema } from "../schemas"
import { PayrollFrequency, PAYROLL_FREQUENCY_OPTIONS } from "../enums/payrollFrequency"
import type { PayrollUploadFormValues, PayrollUploadSectionProps } from "../types"
import { downloadPayrollTemplate } from "../api/payrollApi"
import { triggerBrowserDownloadBlob } from "../utils/payrollCsv"

const sectionCardShadowClass = "shadow-[0_4px_16px_rgba(16,24,40,0.12)]"

const UPLOAD_TYPE_OPTIONS: SingleSelectOption[] = PAYROLL_FREQUENCY_OPTIONS

const defaultUploadValues: PayrollUploadFormValues = {
  uploadType: PayrollFrequency.BI_WEEKLY,
}

const primaryActionButtonClass =
  "h-[44px] rounded-[8px] border-0 bg-[var(--primary)] text-[12px] font-medium text-white hover:bg-[var(--primary)]/90 disabled:opacity-70"

export function PayrollUploadSection({ isUploading, onSubmitUpload }: PayrollUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<PayrollUploadFormValues>({
    resolver: zodResolver(payrollUploadFormSchema),
    defaultValues: defaultUploadValues,
    mode: "onSubmit",
  })

  const handlePickFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (list: FileList | null) => {
    const next = list && list.length > 0 ? list[0] : null
    setSelectedFile(next)
  }

  const handleDownloadTemplateClick = async () => {
    const blob = await downloadPayrollTemplate()
    triggerBrowserDownloadBlob("payroll-upload-template.xlsx", blob)
  }

  const submitUpload = form.handleSubmit((values) => {
    onSubmitUpload(values, selectedFile)
  })

  return (
    <div className="min-w-0 max-w-full">
      <Card
        className={`min-w-0 max-w-full gap-0 overflow-visible rounded-[8px] border-0 bg-white py-0 ring-0 ${sectionCardShadowClass}`}
      >
        <CardContent className="min-w-0 max-w-full px-5 py-5">
          <div className="flex min-w-0 max-w-full flex-wrap items-end gap-6">
            <div className="w-[min(100%,200px)] shrink-0 sm:w-[200px]">
              <Label className="mb-2 block text-[12px] font-medium text-(--primary)">Type:</Label>
              <Controller
                name="uploadType"
                control={form.control}
                render={({ field }) => (
                  <SingleSelectDropdown
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={UPLOAD_TYPE_OPTIONS}
                    placeholder="Select type"
                    className="h-[46px]! min-h-[46px]! w-full rounded-[6px]! border-[#d6d7dc]! bg-[#f3f4f6]! text-[14px]! text-[#111827]!"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px]"
                  />
                )}
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:gap-3">
              <div className="min-w-0 w-full max-w-[300px] shrink-0">
                <Label className="mb-2 block text-[12px] font-medium text-(--primary)">Attachment:</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
                <div className="flex h-[46px] min-w-0 max-w-full items-center gap-2 rounded-[6px] border border-[#d6d7dc] bg-white px-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePickFileClick}
                    className="h-9 shrink-0 rounded-[6px] border-[#d6d7dc] bg-white px-3 text-[14px] font-normal text-[#111827] hover:bg-[#f9fafb]"
                  >
                    Choose File
                  </Button>
                  <span
                    className={
                      selectedFile
                        ? "min-w-0 flex-1 truncate text-left text-[14px] text-[#111827]"
                        : "min-w-0 flex-1 truncate text-center text-[14px] text-[#6b7280]"
                    }
                  >
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
                  <CloudUpload className="size-5 shrink-0 text-(--primary)" aria-hidden />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  type="button"
                  disabled={isUploading}
                  onClick={submitUpload}
                  className={`min-w-[120px] px-8 ${primaryActionButtonClass}`}
                >
                  Upload
                </Button>
                <Button
                  type="button"
                  onClick={handleDownloadTemplateClick}
                  className={`min-w-[160px] px-6 ${primaryActionButtonClass}`}
                >
                  Download Template
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
