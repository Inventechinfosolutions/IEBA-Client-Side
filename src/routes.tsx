import { createBrowserRouter, Navigate } from "react-router-dom"
import { GuestOnlyRoute } from "@/components/GuestOnlyRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage, ForgotPassword, OtpAuthentication } from "@/features/auth"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { MasterCodePage } from "@/features/master-code"
import { ProgramPage } from "@/features/program"
import { TodoPage } from "@/features/todo";
import { UserModulePage } from "@/features/user"
import { LeaveApprovalPage } from "@/features/leave-approval"
import { UsersPage, UserPage } from "@/features/users"
import { DepartmentRolePage } from "@/features/DepartmentRole/pages/DepartmentRolePage"
import { CountyActivityCodePage } from "@/features/CountyActivityCode/pages/CountyActivityCodePage"
import { SettingsPage } from "@/features/settings"
import { ScheduleTimeStudyPage } from "@/features/schedule-time-study"
import { ProfilePage } from "@/features/Profile"
import { CostPoolPage } from "@/features/cost-pool"
import { JobClassificationPage } from "@/features/job-classification"
import { JobPoolPage } from "@/features/job-pool"
import { FteAllocationPage } from "@/features/fte-allocation"
import { DepartmentPage } from "@/features/department"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <GuestOnlyRoute>
        <ForgotPassword />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/otp",
    element: (
      <GuestOnlyRoute>
        <OtpAuthentication />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "master-code", element: <MasterCodePage /> },
      { path: "program", element: <ProgramPage /> },
      { path: "to-do", element: <TodoPage /> },
      { path: "user", element: <UserModulePage /> },
      { path: "leave-approval", element: <LeaveApprovalPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "users/:id", element: <UserPage /> },
      { path: "department-role", element: <DepartmentRolePage /> },
      {
        path: "county-activity-code",
        element: <CountyActivityCodePage />,
      },
      { path: "settings", element: <SettingsPage /> },
      {
        path: "schedule-time-study",
        element: <ScheduleTimeStudyPage />,
      },
      { path: "costpool", element: <CostPoolPage /> },
      { path: "fte-allocation", element: <FteAllocationPage /> },
      { path: "department", element: <DepartmentPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "job-classification", element: <JobClassificationPage /> },
      { path: "job-pool", element: <JobPoolPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
