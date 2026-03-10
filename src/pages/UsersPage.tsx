import { useState } from "react"
import { UserForm, UserTable, useUsers } from "@/features/users"

export function UsersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const {
    users,
    isLoading,
    createUser,
    isCreating,
  } = useUsers()

  const handleCreateUser = (values: { name: string; email: string }) => {
    createUser(values)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Users</h2>
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
