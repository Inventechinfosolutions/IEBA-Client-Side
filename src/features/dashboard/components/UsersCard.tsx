import { Link } from "react-router-dom"
import iconUsersOrange from "@/assets/icon-users-orange.png"
import iconActiveUsersPurple from "@/assets/icon-active-users-purple.png"
import type { UsersCardProps } from "../types"

export function UsersCard({
  userCount,
  activeUsers,
  showActiveUsers = false,
  isLoading,
}: UsersCardProps) {
  return (
    <Link
      to="/user"
      className="flex flex-col rounded-[10px] border border-[#E8EAF6] bg-white p-4 shadow-[0_0_20px_0_#0000001a] gap-y-3 hover:shadow-[0_8px_30px_rgba(108,93,211,0.12)] transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <img
          src={iconUsersOrange}
          alt="Users"
          className="h-10 w-10 shrink-0 object-contain"
        />
        {isLoading ? (
          <div className="h-5 w-20 animate-pulse rounded bg-[#e5e7eb]" />
        ) : (
          <span className="text-[16px] font-medium text-[#1a1a2e] whitespace-nowrap group-hover:text-[#6C5DD3] transition-colors">
            Users {userCount}
          </span>
        )}
      </div>

      {showActiveUsers && (
        <div className="flex items-center gap-3">
          <img
            src={iconActiveUsersPurple}
            alt="Active Users"
            className="h-10 w-10 shrink-0 object-contain"
          />
          {isLoading ? (
            <div className="h-5 w-28 animate-pulse rounded bg-[#e5e7eb]" />
          ) : (
            <span className="text-[16px] font-medium text-[#1a1a2e] whitespace-nowrap group-hover:text-[#6C5DD3] transition-colors">
              Active Users {activeUsers ?? 0}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
