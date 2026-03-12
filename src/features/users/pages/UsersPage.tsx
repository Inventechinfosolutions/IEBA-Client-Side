import { useState } from "react"

import { UserForm } from "../components/UserForm"
import { UserTable } from "../components/UserTable"
import { useUsers } from "../hooks/useUsers"

export function UsersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const { users, isLoading, createUser, isCreating } = useUsers()

  const handleCreateUser = (values: { name: string; email: string }) => {
    createUser(values)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      <UserTable
        users={users}
        isLoading={isLoading}
        onAddUser={() => setFormOpen(true)}
      />
      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateUser}
        isSubmitting={isCreating}
      />
    </div>
  )
}
