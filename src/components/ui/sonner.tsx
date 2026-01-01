import { useTheme } from "next-themes"
import { Toaster as Sonner  } from "sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import type {ToasterProps} from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group pointer-events-none"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-primary" />
        ),
        info: (
          <InfoIcon className="size-4 text-secondary" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-yellow-500" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-destructive" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary" />
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
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-primary/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-none group-[.toaster]:font-serif group-[.toaster]:uppercase group-[.toaster]:tracking-widest group-[.toaster]:border-l-4 group-[.toaster]:overflow-hidden group-[.toaster]:pointer-events-none",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-sans group-[.toast]:normal-case group-[.toast]:tracking-normal",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-bold group-[.toast]:rounded-none",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-none",
          success: "group-[.toaster]:border-l-primary group-[.toaster]:text-primary",
          error: "group-[.toaster]:border-l-destructive group-[.toaster]:text-destructive",
          info: "group-[.toaster]:border-l-secondary group-[.toaster]:text-secondary",
          warning: "group-[.toaster]:border-l-yellow-500 group-[.toaster]:text-yellow-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
