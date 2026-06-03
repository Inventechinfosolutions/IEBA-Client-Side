type DepartmentEditContextHeaderProps = {
  countyName?: string
  code?: string
  departmentName?: string
}

/** Read-only summary shown on edit tabs (Settings, Report Setting). */
export function DepartmentEditContextHeader({
  countyName,
  code,
  departmentName,
}: DepartmentEditContextHeaderProps) {
  return (
    <div className="pt-4 space-y-1">
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
  )
}
