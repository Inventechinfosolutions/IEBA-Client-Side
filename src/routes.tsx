import { createBrowserRouter, Navigate } from "react-router-dom"
import { GuestOnlyRoute } from "@/components/GuestOnlyRoute"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword"
import { OtpAuthentication } from "@/features/auth/pages/OtpAuthentication"
import { UsersPage, UserPage } from "@/features/users"
import { DepartmentRolePage } from "@/features/DepartmentRole/pages/DepartmentRolePage"
import { CountyActivityCodePage } from "@/features/CountyActivityCode/pages/CountyActivityCodePage"

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
      { index: true, element: <UsersPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "users/:id", element: <UserPage /> },
      { path: "department-role", element: <DepartmentRolePage /> },
      {
        path: "county-activity-code",
        element: <CountyActivityCodePage />,
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
