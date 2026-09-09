"use client";

// Imagine: shadcn breadcrumb reduced to what the file manager needs. Slashes,
// not chevrons; ancestors are quiet buttons and the current crumb is bold. The
// current crumb can carry a caret menu listing its siblings, so switching
// libraries or folders happens in place instead of walking back up.

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";

function Breadcrumb({
  className,
  children,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Location"
      data-slot="breadcrumb"
      className={cn("flex min-w-0 items-center", className)}
      {...props}
    >
      <ol className="flex min-w-0 items-center gap-xs">{children}</ol>
    </nav>
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("flex min-w-0 items-center gap-xxs", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="breadcrumb-link"
      className={cn(
        "min-w-0 truncate rounded-xs type-body font-medium text-imagine-foreground-muted transition-colors outline-none hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-current="location"
      data-slot="breadcrumb-page"
      className={cn(
        "min-w-0 truncate type-body font-semibold text-imagine-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-separator"
      className={cn(
        "shrink-0 px-xxs type-body text-imagine-foreground-faint select-none",
        className,
      )}
      {...props}
    >
      /
    </li>
  );
}

export interface BreadcrumbMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Rendered instead of the icon, for avatars. */
  leading?: React.ReactNode;
}

interface BreadcrumbMenuProps {
  /** Names what the menu switches between, e.g. "Switch library". */
  label: string;
  items: readonly BreadcrumbMenuItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/** The caret beside the current crumb. Opens its siblings. */
function BreadcrumbMenu({
  label,
  items,
  selectedId,
  onSelect,
}: BreadcrumbMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={label}
          className="-ml-xxs size-6 text-imagine-foreground-faint hover:text-imagine-foreground data-open:text-imagine-foreground"
        >
          <Icon name="chevron-down" size="s" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-imagine-foreground-faint">
          {label}
        </DropdownMenuLabel>
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => {
                onSelect(item.id);
              }}
              className={cn("gap-s", selected && "font-medium")}
            >
              <span className="flex size-5 shrink-0 items-center justify-center text-imagine-foreground-muted">
                {item.leading ??
                  (item.icon === undefined ? null : (
                    <Icon name={item.icon} size="s" />
                  ))}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {selected ? (
                <Icon name="check" size="s" className="shrink-0" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbMenu,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
