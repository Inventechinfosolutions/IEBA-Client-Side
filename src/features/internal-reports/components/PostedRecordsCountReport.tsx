import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { cn } from "@/lib/utils"

import { useRunPostedRecordsCount } from "../mutations/runPostedRecordsCount"
import { usePostedRecordsCountOptions } from "../queries/getPostedRecordsCountOptions"
import {
  POSTED_RECORDS_ALL_COUNTIES,
  POSTED_RECORDS_OUTPUT_TYPES,
  POSTED_RECORDS_QUARTERS,
  postedRecordsCountFormSchema,
} from "../schemas"
import type {
  PostedRecordsCountFormValues,
  PostedRecordsCountOptions,
  PostedRecordsCountRequest,
  PostedRecordsOutputType,
} from "../types"
import { buildPostedRecordsCountFileName, saveBlobAs } from "../utils/postedRecordsCountFormat"

const labelClassName = "mb-2 block text-[14px] font-normal text-[#2a2f3a]"
const selectTrigger =
  "!min-h-0 !h-12 w-full shrink-0 rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !py-0 !text-[14px] font-normal text-[#111827] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-0"
const primaryButton =
  "!h-[45px] w-full sm:!w-[120px] shrink-0 rounded-[8px] !border-0 !bg-[#6C5DD3] !text-[14px] !font-medium !text-white hover:!bg-[#5b4fc2]"
const secondaryButton =
  "!h-[45px] w-full sm:!w-[120px] shrink-0 rounded-[8px] !bg-[#E5E7EB] !text-[14px] !font-medium !text-[#374151] hover:!bg-[#D1D5DB]"

const QUARTER_OPTIONS = POSTED_RECORDS_QUARTERS.map((q) => ({ value: q, label: `Q${q}` }))
const OUTPUT_OPTIONS = POSTED_RECORDS_OUTPUT_TYPES.map((t) => ({ value: t, label: t }))

function currentFiscalYearId(): string {
  const now = new Date()
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${start + 1}`
}

function toRequest(values: PostedRecordsCountFormValues): PostedRecordsCountRequest {
  return {
    nameSpace: values.nameSpace,
    fiscalYearId: values.fiscalYearId,
    startQuarter: Number(values.startQuarter),
    endQuarter: Number(values.endQuarter),
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-[13px] text-red-500" role="alert">
      {message}
    </p>
  ) : null
}

function PostedRecordsCountForm({ options }: { options: PostedRecordsCountOptions }) {
  const countyOptions = useMemo(
    () => [
      { value: POSTED_RECORDS_ALL_COUNTIES, label: "All Clients" },
      ...options.counties.map((c) => ({ value: c.nameSpace, label: c.countyName })),
    ],
    [options.counties],
  )
  const fiscalYearOptions = useMemo(
    () => options.fiscalYears.map((fy) => ({ value: fy.id, label: fy.id })),
    [options.fiscalYears],
  )

  const defaultFiscalYear =
    options.fiscalYears.find((fy) => fy.id === currentFiscalYearId())?.id ?? options.fiscalYears[0]?.id ?? ""
  const defaultCounty =
    options.counties.find((c) => c.nameSpace === options.currentNameSpace)?.nameSpace ?? POSTED_RECORDS_ALL_COUNTIES

  const { control, handleSubmit, formState } = useForm<PostedRecordsCountFormValues>({
    resolver: zodResolver(postedRecordsCountFormSchema),
    defaultValues: {
      nameSpace: defaultCounty,
      fiscalYearId: defaultFiscalYear,
      startQuarter: "1",
      endQuarter: "4",
      outputType: "PDF",
    },
  })

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const run = useRunPostedRecordsCount()
  const [pendingAction, setPendingAction] = useState<"view" | "download" | null>(null)

  const replacePreview = (next: string | null) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return next
    })
  }

  const execute = (action: "view" | "download") =>
    handleSubmit(async (values) => {
      const outputType: PostedRecordsOutputType = action === "view" ? "PDF" : values.outputType
      setPendingAction(action)
      try {
        const result = await run.mutateAsync({ request: toRequest(values), outputType })
        if (action === "view" && result.kind === "PDF") {
          replacePreview(URL.createObjectURL(result.blob))
          return
        }
        const fileName =
          result.kind === "FILE" ? result.fileName : buildPostedRecordsCountFileName(values, "PDF")
        saveBlobAs(result.blob, fileName)
        toast.success("Report downloaded")
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return
        toast.error(err instanceof Error ? err.message : "Failed to run report")
      } finally {
        setPendingAction(null)
      }
    })()

  const onCancel = () => {
    run.cancel()
    setPendingAction(null)
    replacePreview(null)
  }

  const isBusy = pendingAction !== null

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClassName}>County</label>
          <Controller
            name="nameSpace"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={countyOptions}
                placeholder="Select county"
                className={selectTrigger}
                contentClassName="max-h-[260px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[14px] !font-normal"
              />
            )}
          />
          <FieldError message={formState.errors.nameSpace?.message} />
        </div>
        <div>
          <label className={labelClassName}>Fiscal Year</label>
          <Controller
            name="fiscalYearId"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={fiscalYearOptions}
                placeholder="Select fiscal year"
                className={selectTrigger}
                contentClassName="max-h-[220px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[14px] !font-normal"
              />
            )}
          />
          <FieldError message={formState.errors.fiscalYearId?.message} />
        </div>
        <div>
          <label className={labelClassName}>Beginning Quarter</label>
          <Controller
            name="startQuarter"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value}
                onChange={(v) => field.onChange(v as PostedRecordsCountFormValues["startQuarter"])}
                onBlur={field.onBlur}
                options={QUARTER_OPTIONS}
                placeholder="Qtr"
                className={selectTrigger}
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[14px] !font-normal"
              />
            )}
          />
          <FieldError message={formState.errors.startQuarter?.message} />
        </div>
        <div>
          <label className={labelClassName}>Ending Quarter</label>
          <Controller
            name="endQuarter"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value}
                onChange={(v) => field.onChange(v as PostedRecordsCountFormValues["endQuarter"])}
                onBlur={field.onBlur}
                options={QUARTER_OPTIONS}
                placeholder="Qtr"
                className={selectTrigger}
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[14px] !font-normal"
              />
            )}
          />
          <FieldError message={formState.errors.endQuarter?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Button type="button" className={primaryButton} disabled={isBusy} onClick={() => void execute("view")}>
          {pendingAction === "view" ? (
            <>
              <Loader2 className="mr-1 size-4 animate-spin" /> Loading…
            </>
          ) : (
            "View"
          )}
        </Button>
        <div className="w-full sm:w-[140px]">
          <label className={labelClassName}>Download Type</label>
          <Controller
            name="outputType"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value}
                onChange={(v) => field.onChange(v as PostedRecordsOutputType)}
                onBlur={field.onBlur}
                options={OUTPUT_OPTIONS}
                placeholder="Format"
                className={cn(selectTrigger, "!h-[45px]")}
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[14px] !font-normal"
              />
            )}
          />
        </div>
        <Button type="button" className={primaryButton} disabled={isBusy} onClick={() => void execute("download")}>
          {pendingAction === "download" ? (
            <>
              <Loader2 className="mr-1 size-4 animate-spin" /> Downloading…
            </>
          ) : (
            "Download"
          )}
        </Button>
        <Button type="button" className={secondaryButton} onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
          <iframe title="A010 preview" src={previewUrl} className="h-[85vh] min-h-[720px] w-full" />
        </div>
      ) : null}
    </form>
  )
}

export function PostedRecordsCountReport() {
  const optionsQuery = usePostedRecordsCountOptions(true)

  if (optionsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[14px] text-[#6B7280]">
        <Loader2 className="size-4 animate-spin" /> Loading counties and fiscal years…
      </div>
    )
  }
  if (optionsQuery.isError || !optionsQuery.data) {
    return (
      <p className="py-8 text-[14px] text-red-600" role="alert">
        {optionsQuery.error instanceof Error ? optionsQuery.error.message : "Could not load report options"}
      </p>
    )
  }
  return <PostedRecordsCountForm options={optionsQuery.data} />
}
