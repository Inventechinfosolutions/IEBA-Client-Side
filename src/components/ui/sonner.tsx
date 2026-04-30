import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, CircleXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-5 fill-green-500 text-white" />
        ),
        info: (
          <InfoIcon className="size-5 fill-blue-500 text-white" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 fill-yellow-500 text-white" />
        ),
        error: (
          <CircleXIcon className="size-5 fill-red-500 text-white" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin text-gray-500" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
