import { ReportForm } from "../components/ReportForm"
import { useReportsModule } from "../hooks/useReportsModule"

export function ReportsPage() {
  const reportsModule = useReportsModule()

  return (
    <div className="w-full">
      <ReportForm module={reportsModule} />
    </div>
  )
}

export default ReportsPage

