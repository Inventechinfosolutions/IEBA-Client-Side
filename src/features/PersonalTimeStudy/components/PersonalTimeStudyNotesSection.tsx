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
        "flex w-full min-h-0 flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-primary/10",
        className
      )}
    >
      <Label
        htmlFor="pts-notes"
        className="mb-2 shrink-0 text-base font-semibold text-primary"
      >
        Notes
      </Label>
      <Textarea
        id="pts-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes…"
        className="min-h-[120px] flex-1 resize-y"
      />
      <div className="mt-3 flex shrink-0 justify-end">
        <Button type="button" onClick={onSave}>
          Save Notes
        </Button>
      </div>
    </section>
  )
}
