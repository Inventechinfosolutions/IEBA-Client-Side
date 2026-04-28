import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type PersonalTimeStudyNotesSectionProps = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  className?: string
}

export function PersonalTimeStudyNotesSection({
  value,
  onChange,
  onSave,
  className,
}: PersonalTimeStudyNotesSectionProps) {
  return (
    <section
      className={cn(
        "flex w-full min-h-0 flex-col rounded-[8px] border-0 ring-0 bg-white p-3 shadow-[0_4px_16px_rgba(16,24,40,0.12)]",
        className
      )}
    >
      <Label
        htmlFor="pts-notes"
        className="mb-1 shrink-0 text-[11px] font-semibold text-primary"
      >
        Notes
      </Label>
      <Textarea
        id="pts-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes…"
        className="min-h-[70px] flex-1 resize-y text-[11px]"
      />
      <div className="mt-2 flex shrink-0 justify-end">
        <Button type="button" size="sm" className="h-7 text-[11px]" onClick={onSave}>
          Save Notes
        </Button>
      </div>
    </section>
  )
}
