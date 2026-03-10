import { Button } from "@/components/ui/button"
import type { User } from "../queries/getUsers"

type UserTableProps = {
  users: User[]
  isLoading?: boolean
  onAddUser?: () => void
}

export function UserTable({ users, isLoading, onAddUser }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Loading users...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {onAddUser && (
        <div className="flex justify-end">
          <Button onClick={onAddUser}>Add User</Button>
        </div>
      )}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/10 bg-primary/5">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No users found. Add a user to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm">{user.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.email}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
