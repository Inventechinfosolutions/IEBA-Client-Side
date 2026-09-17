type DepartmentEditContextHeaderProps = {
  countyName?: string
  code?: string
  departmentName?: string
  /** System-coded / non-editable report items (shown to the right of Code / Department). */
  hardCodedNotes?: string[]
}

/** Read-only summary shown on edit tabs (Settings, Report Setting, Reports mapping). */
export function DepartmentEditContextHeader({
  countyName,
  code,
  departmentName,
  hardCodedNotes = [],
}: DepartmentEditContextHeaderProps) {
  const notes = hardCodedNotes.map((n) => n.trim()).filter(Boolean)

  return (
    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-1">
        {countyName ? (
          <div className="text-[14px] font-[600] text-[#374151]">
            County Name: <span className="text-[#6C5DD3]">{countyName}</span>
          </div>
        ) : null}
        <div className="text-[14px] font-[600] text-[#374151]">
          Code: <span className="text-[#6C5DD3]">{code}</span>
        </div>
        <div className="text-[14px] font-[600] text-[#374151]">
          Department Name: <span className="text-[#6C5DD3]">{departmentName}</span>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className="w-full max-w-[420px] rounded-[8px] border border-[#E9E5FF] bg-[#F8F7FF] px-3 py-2 sm:shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
            System-coded (not editable)
          </div>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] font-medium text-[#374151]">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
