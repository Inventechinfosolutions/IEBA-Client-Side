import { useNavigate } from "react-router-dom"
import { Bar, BarChart, XAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { PayrollManagementCardProps, PayrollChartData } from "../types"

const chartData: PayrollChartData[] = [
  { month: "Jan", progress: 90 },
  { month: "Feb", progress: 30 },
  { month: "Mar", progress: 50 },
  { month: "Apr", progress: 70 },
  { month: "May", progress: 10 },
]

const chartConfig = {
  progress: {
    label: "Progress",
    color: "#6C5DD3",
  },
} satisfies ChartConfig

export function PayrollManagementCard({ canViewPayroll, onDownloadTemplate }: PayrollManagementCardProps) {
  const navigate = useNavigate()

  if (!canViewPayroll) return null

  return (
    <div className="flex flex-col rounded-[10px] bg-white p-6 shadow-[0px_4px_20px_0px_#0000000D] border border-transparent">
      <div className="mb-6 text-center">
        <h3 className="text-[16px] font-medium text-[#1a1a2e]">Payroll Management</h3>
      </div>

      <div className="mb-6 h-[170px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={45}>
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
            />
            <Bar
              dataKey="progress"
              fill="#6C5DD3"
              radius={[12, 12, 0, 0]}
              background={{ fill: "#F3F4F6", radius: [12, 12, 0, 0] } as any}
            />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate("/payroll")}
          className="w-full rounded-full bg-[#6C5DD3] py-[7px] text-[13px] font-semibold text-white transition-colors hover:bg-[#5a4db8]"
        >
          Review Past Payroll
        </button>
        <button
          type="button"
          onClick={() => navigate("/payroll")}
          className="w-full rounded-full bg-[#6C5DD3] py-[7px] text-[13px] font-semibold text-white transition-colors hover:bg-[#5a4db8]"
        >
          Upload New Payroll
        </button>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="w-full rounded-full bg-[#6C5DD3] py-[7px] text-[13px] font-semibold text-white transition-colors hover:bg-[#5a4db8]"
        >
          Payroll Template
        </button>
      </div>
    </div>
  )
}
