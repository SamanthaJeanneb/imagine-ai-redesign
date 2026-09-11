import { cn } from "cn";

import { Icon, type IconName } from "@/components/ui/icon";

/**
 * LinkedIn's six reactions, as Sharp Solid on LinkedIn's own badge colors.
 * Same `Icon` as the rest of the app: the names live in `ICON_NAMES`.
 */
export const LINKEDIN_REACTIONS = [
  "like",
  "celebrate",
  "love",
  "insightful",
  "support",
  "funny",
] as const;

export type LinkedInReactionType = (typeof LINKEDIN_REACTIONS)[number];

const REACTION: Record<
  LinkedInReactionType,
  { icon: IconName; color: string; label: string }
> = {
  like: { icon: "thumbs-up", color: "#378fe9", label: "Like" },
  celebrate: { icon: "hands-clapping", color: "#6dae4f", label: "Celebrate" },
  love: { icon: "heart", color: "#df704d", label: "Love" },
  insightful: { icon: "lightbulb", color: "#e7a33e", label: "Insightful" },
  support: { icon: "handshake", color: "#7a4de3", label: "Support" },
  funny: { icon: "face-smile", color: "#1dc0c0", label: "Funny" },
};

export function isLinkedInReaction(
  value: string,
): value is LinkedInReactionType {
  return Object.hasOwn(REACTION, value);
}

export function linkedInReactionType(value: string): LinkedInReactionType {
  return isLinkedInReaction(value) ? value : "like";
}

/** Unique types in the order they first appear, for the overlapping cluster. */
export function linkedInReactionTypes(
  values: readonly string[],
): LinkedInReactionType[] {
  const seen = new Set<LinkedInReactionType>();
  const types: LinkedInReactionType[] = [];
  for (const value of values) {
    const type = linkedInReactionType(value);
    if (seen.has(type)) continue;
    seen.add(type);
    types.push(type);
  }
  return types;
}

export function LinkedInReaction({
  type,
  className,
}: {
  type: LinkedInReactionType;
  className?: string;
}) {
  const reaction = REACTION[type];
  return (
    <span
      title={reaction.label}
      style={{ backgroundColor: reaction.color }}
      className={cn(
        "flex size-4 items-center justify-center overflow-hidden rounded-full text-white ring-1 ring-imagine-surface",
        className,
      )}
    >
      <Icon
        name={reaction.icon}
        active
        style={{ width: 8, height: 8, fontSize: 8 }}
      />
    </span>
  );
}

/** Overlapping badges, the way LinkedIn stacks the reactions a post drew. */
export function LinkedInReactionCluster({
  types,
  className,
}: {
  types: readonly LinkedInReactionType[];
  className?: string;
}) {
  if (types.length === 0) return null;
  return (
    <span className={cn("flex items-center", className)}>
      {types.map((type, index) => (
        <span
          key={type}
          className={cn("relative", index > 0 && "-ml-1")}
          style={{ zIndex: types.length - index }}
        >
          <LinkedInReaction type={type} />
        </span>
      ))}
    </span>
  );
}
