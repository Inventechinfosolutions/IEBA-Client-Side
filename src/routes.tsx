import { createBrowserRouter, Navigate } from "react-router-dom"
import { GuestOnlyRoute } from "@/components/GuestOnlyRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { MasterCodePage } from "@/features/master-code/pages/MasterCodePage"
import { ProgramPage } from "@/features/program"
import { TodoPage } from "@/features/todo"
import { UserModulePage } from "@/features/user"
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword"
import { OtpAuthentication } from "@/features/auth/pages/OtpAuthentication"
import { UsersPage, UserPage } from "@/features/users"
import { DepartmentRolePage } from "@/features/DepartmentRole/pages/DepartmentRolePage"
import { CountyActivityCodePage } from "@/features/CountyActivityCode/pages/CountyActivityCodePage"
import { SettingsPage } from "@/features/settings"

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
      { path: "users", element: <UsersPage /> },
      { path: "users/:id", element: <UserPage /> },
      { path: "department-role", element: <DepartmentRolePage /> },
      {
        path: "county-activity-code",
        element: <CountyActivityCodePage />,
      },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
