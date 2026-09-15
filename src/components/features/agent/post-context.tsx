"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import {
  CONTEXT_CHIP_LINE,
  ContextChipInline,
  ContextChipRemove,
} from "@/components/features/agent/context-chip";
import { LinkedInPost } from "@/components/features/agent/linkedin-post-draft";
import {
  type PostChipData,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { spring } from "@/styles/motion";

interface PostContextProps {
  post: PostChipData;
  onRemove?: (id: string) => void;
  className?: string;
}

/**
 * A post attached to the composer as context: the status rail, title, time,
 * and profile, with a remove action. Selecting a post on the calendar adds
 * one of these so the next message is about that post, and hovering it shows
 * the post itself. The chart equivalent is `ChartContext`.
 */
export function PostContext({ post, onRemove, className }: PostContextProps) {
  const layoutLocked = useLayoutLocked();
  const chip = (
    <motion.div
      layout={layoutLocked ? false : "position"}
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={spring.snappy}
      data-slot="post-context"
      data-status={post.status}
      style={postChipStyle(post.status)}
      className={cn(CONTEXT_CHIP_LINE, "w-fit", className)}
    >
      <span
        aria-hidden="true"
        className="h-4 w-1 shrink-0 rounded-full bg-[var(--chip-color)]"
      />
      <ContextChipInline
        title={post.title}
        detail={`${post.time} · ${post.profile}`}
      />
      {onRemove ? (
        <ContextChipRemove
          label={post.title}
          onClick={() => {
            onRemove(post.id);
          }}
        />
      ) : null}
    </motion.div>
  );

  if (!post.preview) return chip;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
      <HoverCardContent
        aria-label={`Preview of ${post.title}`}
        className="w-[32rem]"
      >
        <LinkedInPost
          {...post.preview}
          timestamp={post.time}
          className="shadow-none"
        />
      </HoverCardContent>
    </HoverCard>
  );
}
