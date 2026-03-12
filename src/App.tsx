import { useState } from "react"
import { UserForm, UserTable, useUsers } from "@/features/users"

function App() {
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Users</h1>
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
    </div>
  )
}

export default App
