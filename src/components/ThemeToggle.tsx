import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] transition-all duration-300 hover:bg-[#F3F4F6] hover:text-[#111827] focus-visible:outline-none dark:border-[#27272a] dark:bg-[#09090b] dark:text-[#a1a1aa] dark:hover:bg-[#18181b] dark:hover:text-white",
        className
      )}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="size-[20px] transition-transform duration-500 rotate-0 scale-100 text-amber-400" />
      ) : (
        <Moon className="size-[20px] transition-transform duration-500 rotate-0 scale-100 text-[#6B7280]" />
      )}
    </button>
  )
}
