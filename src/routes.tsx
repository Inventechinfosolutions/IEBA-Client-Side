import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { UsersPage, UserPage } from "@/features/users"


export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <UsersPage />  },
      { path: "users", element: <UsersPage /> },
      { path: "users/:id", element: <UserPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
