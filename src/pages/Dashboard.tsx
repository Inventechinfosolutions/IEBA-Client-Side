import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  FolderOpen,
  XCircle,
  Briefcase,
  Users,
  User,
  ChevronDown,
  Calendar,
  Clock,
  ListTodo,
} from "lucide-react"
import { Link } from "react-router-dom"

const payrollData = [
  { month: "Jan", value: 65 },
  { month: "Feb", value: 80 },
  { month: "Mar", value: 45 },
  { month: "Apr", value: 90 },
  { month: "May", value: 70 },
]

const holidays = [
  { date: "02-16-2026", name: "Presidents' Day" },
  { date: "03-31-2026", name: "Cesar Chavez Day" },
  { date: "05-25-2026", name: "Memorial Day" },
  { date: "06-19-2026", name: "Juneteenth" },
]

const reports = [
  { id: "P100", name: "Employee Time Summation" },
  { id: "P101", name: "Employee by Function Code" },
  { id: "P110", name: "Time Study Daily" },
  { id: "P111", name: "Daily - Start/Stop" },
  { id: "P112", name: "Daily - Start/Stop/Travel" },
  { id: "TSCR", name: "Time Study Calculation Report" },
]

export function Dashboard() {
  const maxPayrollValue = Math.max(...payrollData.map((d) => d.value))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Personal Time Study */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <CardTitle className="text-base">Personal Time Study</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Total Time approved:</span>
              <span className="font-medium text-foreground">0</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Total Time submitted:</span>
              <span className="font-medium text-foreground">0</span>
            </div>
            <Link to="/personal-time-study">
              <Button variant="outline" size="sm" className="mt-2 border-primary text-primary hover:bg-primary/10">
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Personal Leave Requests */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <CardTitle className="text-base">
                Personal Leave Requests (0)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Approved 0</span>
              <span className="text-muted-foreground">Open 0</span>
              <span className="text-muted-foreground">Rejected 0</span>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Holiday</span>
                <span className="text-muted-foreground">March 31</span>
              </div>
              <Calendar className="size-8 text-muted-foreground mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Time Study Status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <CardTitle className="text-base">Time Study Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
                <span className="text-sm">Approved 0</span>
              </div>
              <Button size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-4 text-primary" />
                <span className="text-sm">Pending Approval 0</span>
              </div>
              <Button size="sm">Approve</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-primary" />
                <span className="text-sm">Not Submitted 0</span>
              </div>
              <Button size="sm">Notify</Button>
            </div>
          </CardContent>
        </Card>

        {/* To Do */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <ListTodo className="size-4 text-primary" />
              <CardTitle className="text-base">To Do</CardTitle>
            </div>
            <Link to="/to-do">
              <Button variant="ghost" size="sm" className="text-primary">
                More...
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <span className="text-2xl font-semibold">77</span>
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span className="text-2xl font-semibold">3</span>
              <span className="text-sm text-muted-foreground">Active Users</span>
            </div>
            <Link to="/users">
              <Button variant="outline" size="sm" className="mt-2 border-primary text-primary hover:bg-primary/10">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Payroll Management */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payroll Management</CardTitle>
              <Button variant="ghost" size="icon-sm" className="text-primary hover:bg-primary/10">
                <ChevronDown className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-3">
              {payrollData.map((d) => (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-24 w-full flex-col justify-end rounded-t bg-primary/10">
                    <div
                      className="w-full rounded-t bg-primary transition-all"
                      style={{
                        height: `${(d.value / maxPayrollValue) * 100}%`,
                        minHeight: "8px",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button size="sm">Review Past Payroll</Button>
              <Button size="sm">Upload New Payroll</Button>
              <Button size="sm">Payroll Template</Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <ChevronDown className="size-4 text-primary" />
              <CardTitle className="text-base">Reports</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
              More...
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-primary">{report.id}</span>
                  <span>{report.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Holidays */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {holidays.map((h) => (
                <div
                  key={h.date}
                  className="flex items-center gap-2 rounded-lg border border-primary/20 p-2"
                >
                  <span className="text-xs font-medium text-primary">{h.date}</span>
                  <span className="text-sm">{h.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Leave Requests & Departmental Statistics - Combined */}
        <Card className="lg:col-span-3 shadow-sm">
          <div className="space-y-6">
            <div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" />
                  <CardTitle className="text-base">Staff Leave Requests</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Open 0</span>
                  <span className="text-muted-foreground">Approved 0</span>
                  <span className="text-muted-foreground">Rejected 0</span>
                </div>
              </CardContent>
            </div>
            <div className="border-t pt-4">
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div>
                    <span className="text-2xl font-semibold">3</span>
                    <p className="text-sm text-muted-foreground">Departments</p>
                  </div>
                  <div>
                    <span className="text-2xl font-semibold">104</span>
                    <p className="text-sm text-muted-foreground">Programs</p>
                  </div>
                  <div>
                    <span className="text-2xl font-semibold">80</span>
                    <p className="text-sm text-muted-foreground">Activities</p>
                  </div>
                  <div>
                    <span className="text-2xl font-semibold">8</span>
                    <p className="text-sm text-muted-foreground">Job Pools</p>
                  </div>
                  <div>
                    <span className="text-2xl font-semibold">19</span>
                    <p className="text-sm text-muted-foreground">Cost Pools</p>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
