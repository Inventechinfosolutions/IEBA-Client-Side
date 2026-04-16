import { useAuth } from "@/contexts/AuthContext"
import {
  usePersonalTimeStudy,
  useSelfLeave,
  useTodos,
  useReportsByRole,
  useHolidays,
  useTimeRecordRequests
} from "../queries/dashboardQueries"
import { PersonalTimeStudyCard } from "../components/PersonalTimeStudyCard"
import { PersonalLeaveCard } from "../components/PersonalLeaveCard"
import { ReportsCard } from "../components/ReportsCard"
import { TodoCard } from "../components/TodoCard"
import { TimeStudyStatusCard } from "../components/TimeStudyStatusCard"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, XCircle } from "lucide-react"
import { PayrollPeriod } from "../enums/dashboard.enum"

export function UserDashboard() {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const payrollType = PayrollPeriod.Biweekly // Correct enum value

  const deptRoles = user?.departmentRoles ?? []
  const currentDeptRole = deptRoles[0]
  const departmentId = currentDeptRole?.departmentId
  const roleId = currentDeptRole?.roleId

  const personalTS = usePersonalTimeStudy({
    userId,
    payrollType,
    reqMins: 480,
    departmentId,
    roleId,
  })
  const timeRecordRequests = useTimeRecordRequests({
    userId,
    payrollType,
    departmentId,
    roleId,
  })
  const selfLeave = useSelfLeave(userId)
  const todos = useTodos(userId)
  const reports = useReportsByRole({ departmentId, roleId })
  const holidays = useHolidays()

  const tsApproved = personalTS.data?.approved ?? 0
  const tsSubmitted = personalTS.data?.submitted ?? 0

  const selfLeaveTotal = selfLeave.data?.total ?? 0
  const selfLeaveApproved = selfLeave.data?.approved ?? 0
  const selfLeaveOpen = selfLeave.data?.requested ?? 0
  const selfLeaveRejected = selfLeave.data?.rejected ?? 0

  const nextHolidayMonth = holidays.data?.nextMonth ?? ""
  const nextHolidayDay = holidays.data?.nextDay ?? "0"

  const todoItems = todos.data ?? []
  const reportsData = reports.data ?? []

  const trApproved = timeRecordRequests.data?.approved ?? 0
  const trPending = timeRecordRequests.data?.pendingApproval ?? 0
  const trNotSubmitted = timeRecordRequests.data?.notSubmitted ?? 0

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Section: Calendar + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* Left: Calendar Widget (4/12 width) */}
        <div className="lg:col-span-4 xl:col-span-4 flex">
          <Card className="p-4 rounded-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border-[#E8EAF6] flex flex-col bg-white w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10 p-1.5 rounded-lg transition-all duration-200"><ChevronsLeft size={16} /></button>
                <button className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10 p-1.5 rounded-lg transition-all duration-200"><ChevronLeft size={16} /></button>
              </div>
              <h2 className="text-[16px] font-bold text-[#6C5DD3] tracking-tight">April 2026</h2>
              <div className="flex gap-2">
                <button className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10 p-1.5 rounded-lg transition-all duration-200"><ChevronRight size={16} /></button>
                <button className="text-[#6C5DD3] hover:bg-[#6C5DD3]/10 p-1.5 rounded-lg transition-all duration-200"><ChevronsRight size={16} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-[#111827] border-b border-[#F3F4F6]">
                    <th className="pb-2 text-left pl-1">MON</th>
                    <th className="pb-2">TUE</th>
                    <th className="pb-2">WED</th>
                    <th className="pb-2">THU</th>
                    <th className="pb-2">FRI</th>
                    <th className="pb-2">SAT</th>
                    <th className="pb-2">SUN</th>
                    <th className="pb-2">TOTAL(MIN.)</th>
                    <th className="pb-2 text-right pr-1">ACTION</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {[
                    [30, 31, 1, 2, 3, 4, 5],
                    [6, 7, 8, 9, 10, 11, 12],
                    [13, 14, 15, 16, 17, 18, 19],
                    [20, 21, 22, 23, 24, 25, 26],
                    [27, 28, 29, 30, 1, 2, 3],
                  ].map((week, weekIdx) => (
                    <tr key={weekIdx} className="hover:bg-gray-50/50 transition-colors">
                      {week.map((day, dayIdx) => {
                        const isCurrentMonth = (weekIdx === 0 && day > 7) || (weekIdx >= 4 && day < 7) ? false : true;
                        const hasEntry = dayIdx < 5 && isCurrentMonth;
                        const isSelected = day === 13 && weekIdx === 2;

                        return (
                          <td key={dayIdx} className="py-2 relative">
                            <div className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full font-semibold transition-all duration-300 ${isSelected ? "bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/25" :
                              isCurrentMonth ? "text-[#111827] hover:bg-gray-50" : "text-[#9CA3AF] font-normal"
                              }`}>
                              {day}
                            </div>
                            {hasEntry && (
                              <div className="absolute top-1.5 right-1/2 translate-x-3.5 text-[#6C5DD3] text-[9px] font-bold drop-shadow-sm">★</div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 font-bold text-[#111827]">0</td>
                      <td className="py-2 text-right pr-1">
                        <button className="text-orange-400 hover:text-orange-600 transition-all duration-200 transform hover:scale-110">
                          <XCircle size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

       
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[210px]">
              <PersonalTimeStudyCard
                totalApproved={tsApproved}
                totalSubmitted={tsSubmitted}
                percent="0 %"
                periodLabel="Bi Weekly"
                isLoading={personalTS.isLoading}
                noBlur={true}
              />
            </div>
            <div className="h-[210px]">
              <PersonalLeaveCard
                total={selfLeaveTotal}
                approved={selfLeaveApproved}
                open={selfLeaveOpen}
                rejected={selfLeaveRejected}
                nextHolidayMonth={nextHolidayMonth}
                nextHolidayDay={nextHolidayDay}
                isLoading={selfLeave.isLoading}
              />
            </div>
          </div>

      
          <div className="grid grid-cols-12 gap-4 h-[180px] min-h-0">
            <div className="col-span-12 h-full min-h-0 overflow-hidden">
              <ReportsCard reports={reportsData} isLoading={reports.isLoading} />
            </div>
          </div>
         
         
          {(trApproved > 0 || trPending > 0) && (
            <div className="h-[180px]">
              <TimeStudyStatusCard
                approved={trApproved}
                pendingApproval={trPending}
                notSubmitted={trNotSubmitted}
                isLoading={timeRecordRequests.isLoading}
              />
            </div>
          )}
        </div>



        <div className="lg:col-span-3">
          <div className="h-[406px]">
            <TodoCard items={todoItems} isLoading={todos.isLoading} />
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden rounded-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border-[#E8EAF6] bg-white">
        <div className="p-3 bg-white flex justify-end gap-8">
          <div className="text-[13px] flex items-center gap-2">
            <span className="text-[#6B7280] font-medium">Allocated TS Minutes:</span>
            <span className="font-bold text-[#111827]">0</span>
          </div>
          <div className="text-[13px] flex items-center gap-2">
            <span className="text-[#6B7280] font-medium">Actual Minutes:</span>
            <span className="font-bold text-[#6C5DD3]">0</span>
          </div>
          <div className="text-[13px] flex items-center gap-2">
            <span className="text-[#6B7280] font-medium">Balance:</span>
            <span className="font-bold text-[#6C5DD3]">0</span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[250px] px-4 pb-4">
          <div className="rounded-[5px] overflow-hidden border border-[#E8EAF6] bg-white">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#6C5DD3] text-white text-[12px] font-bold uppercase">
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center first:rounded-tl-[15px]">Program</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Activity</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Start</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">End</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Travel</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Total</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Notes</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Desc</th>
                  <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center last:rounded-tr-[15px]">Status</th>
                </tr>
              </thead>
            <tbody className="bg-white">
              <tr className="group">
                <td colSpan={9} className="text-center py-16 bg-white">
                  <div className="flex flex-col items-center gap-3 opacity-40 group-hover:opacity-60 transition-all duration-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-[15px] flex items-center justify-center ring-1 ring-gray-100">
                      <img src="/placeholder-no-data.png" alt="" className="w-8 h-8 grayscale" />
                    </div>
                    <span className="text-[#9CA3AF] text-[14px] font-medium">No study data available for this period</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </Card>
    </div>




  )
}
