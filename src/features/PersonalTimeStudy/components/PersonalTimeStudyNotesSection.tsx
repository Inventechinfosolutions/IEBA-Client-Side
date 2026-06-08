import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

type PersonalTimeStudyNotesSectionProps = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  className?: string
  isSaving?: boolean
}

export function PersonalTimeStudyNotesSection({
  value,
  onChange,
  onSave,
  className,
  isSaving = false,
}: PersonalTimeStudyNotesSectionProps) {
  return (
    <section
      className={cn(
        "relative flex w-full min-h-0 flex-col rounded-[10px] border-0 bg-white p-3 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0 max-h-[248px]",
        className
      )}
    >
      {isSaving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-[6px]">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}
      <Label
        htmlFor="pts-notes"
        className="mb-1 shrink-0 text-[13px] font-bold text-[#6C5DD3]"
      >
        Notes
      </Label>
      <Textarea
        id="pts-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes…"
        className="flex-1 w-full min-h-0 h-[88px] resize-none rounded-[8px] border border-[#E5E7EB] text-[12px] placeholder:text-[11px] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] overflow-y-auto"
        style={{ fieldSizing: "normal" } as any}
        disabled={isSaving}
      />
      <div className="mt-2 flex shrink-0 justify-end">
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-[8px] bg-[#6C5DD3] px-4 text-[12px] hover:bg-[#6C5DD3]/90"
          onClick={onSave}
          disabled={isSaving}
        >
          Save Notes
        </Button>
      </div>
    </section>
  )
}
