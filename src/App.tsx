
import { UserForm, UserTable, useUsers } from "@/features/users"

function App() {
  const {
    users,
    isLoading,
    createUser,
  } = useUsers()

  const handleCreateUser = (values: { name: string; email: string }) => {
    createUser.mutate(values)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Users</h1>
        <UserTable
          users={users}
          isLoading={isLoading}
        />
        <UserForm
          onSubmit={handleCreateUser}
          isLoading={createUser.isPending}
        />
      </div>
    </div>
  )
}

export default App
