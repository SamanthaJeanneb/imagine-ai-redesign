"use client";

// Imagine: shadcn sonner with Icon instead of lucide, Spinner for loading,
// and a narrowed theme value (no cast).

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";

function toasterTheme(theme: string | undefined): ToasterProps["theme"] {
  return theme === "dark" || theme === "light" ? theme : "system";
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={toasterTheme(theme)}
      className="toaster group"
      icons={{
        success: <Icon name="circle-check" />,
        info: <Icon name="circle-info" />,
        warning: <Icon name="triangle-exclamation" />,
        error: <Icon name="circle-xmark" />,
        loading: <Spinner />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "cn-toast rounded-panel! border-transparent! bg-imagine-surface! text-imagine-foreground! shadow-floating!",
          description: "text-imagine-foreground-muted!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
