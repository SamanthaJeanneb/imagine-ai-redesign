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
  className?: string;
}

/**
 * Somebody's face wherever one is shown: an author, a teammate, a competitor,
 * an engager. Always resolves to something, so a missing picture leaves
 * initials rather than an empty well.
 */
export function PersonAvatar({
  name,
  avatarUrl,
  shape = "circle",
  size = "default",
  className,
}: PersonAvatarProps) {
  return (
    <Avatar
      size={size}
      shape={shape}
      {...(className === undefined ? {} : { className })}
    >
      {avatarUrl === undefined ? null : <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
