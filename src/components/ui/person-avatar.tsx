import type { ReactNode } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarShape,
} from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

interface PersonAvatarProps {
  name: string;
  /** Absent, or a URL that 404s, falls back to the initials. */
  avatarUrl?: string;
  /** A company posts under a squared mark, a person under a round one. */
  shape?: AvatarShape;
  size?: "default" | "sm" | "lg";
  /**
   * What stands in when there is no picture. Defaults to the initials of
   * `name`; pass an icon for a company page, or `contactInitials` where the
   * name may arrive as an email address.
   */
  children?: ReactNode;
  /** For a face in a group, where the name is not written beside it. */
  title?: string;
  className?: string;
}

/**
 * Somebody's face wherever one is shown: an author, a teammate, a competitor,
 * an engager. Always resolves to something, so a missing picture leaves a
 * mark rather than an empty well.
 */
export function PersonAvatar({
  name,
  avatarUrl,
  shape = "circle",
  size = "default",
  children,
  title,
  className,
}: PersonAvatarProps) {
  return (
    <Avatar
      size={size}
      shape={shape}
      {...(title === undefined ? {} : { title })}
      {...(className === undefined ? {} : { className })}
    >
      {avatarUrl === undefined ? null : <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{children ?? initials(name)}</AvatarFallback>
    </Avatar>
  );
}
