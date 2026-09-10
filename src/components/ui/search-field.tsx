"use client";

// Imagine: search input with the magnifying glass inside and a clear affordance
// once there is a value. The dropdown lives in SearchBox; this field is the
// control itself, also used to filter lists that are already on screen.

import { cn } from "cn";

import { Icon } from "@/components/ui/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface SearchFieldProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> {
  value: string;
  onValueChange: (value: string) => void;
}

export function SearchField({
  value,
  onValueChange,
  className,
  placeholder = "Search",
  ...props
}: SearchFieldProps) {
  return (
    <InputGroup className={cn("h-8", className)}>
      <InputGroupAddon align="inline-start">
        <Icon name="magnifying-glass" size="s" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        {...props}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            aria-label="Clear search"
            onClick={() => {
              onValueChange("");
            }}
          >
            <Icon name="xmark" size="s" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
