import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { UserForm } from "../components/UserForm"
import { useGetUser } from "../queries/getUser"
import { useUpdateUser } from "../mutations/updateUser"

export function UserPage() {
  const { id } = useParams<{ id: string }>()
  const [formOpen, setFormOpen] = useState(false)

  const { data: user, isLoading, isError, error } = useGetUser(id)
  const updateUserMutation = useUpdateUser()

  const handleUpdateUser = (values: { name: string; email: string; id?: string }) => {
    if (values.id) {
      updateUserMutation.mutate(
        { id: values.id, name: values.name, email: values.email },
        {
          onSuccess: () => setFormOpen(false),
        }
      )
    }
  }

  if (!id) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No user ID provided.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Loading user...
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center text-destructive">
        {error?.message ?? "Failed to load user"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/users">
          <Button variant="ghost" size="sm">
            ← Back to Users
          </Button>
        </Link>
        <Button onClick={() => setFormOpen(true)}>Edit User</Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">User Details</h1>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">ID</dt>
            <dd className="mt-1 text-sm font-medium">{user.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="mt-1 text-sm font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm font-medium">{user.email}</dd>
          </div>
        </dl>
      </div>

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleUpdateUser}
        isSubmitting={updateUserMutation.isPending}
        defaultValues={{ name: user.name, email: user.email }}
        userId={user.id}
        mode="edit"
      />
    </div>
  )
}
