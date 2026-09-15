"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";

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
import { fade, spring } from "@/styles/motion";

interface PostContextProps {
  posts: readonly PostChipData[];
  onRemove?: (id: string) => void;
  className?: string;
}

interface PostContextChipProps {
  post: PostChipData;
  onRemove?: (id: string) => void;
}

/**
 * A post attached to the composer as context: the status rail, title, time,
 * and profile, with a remove action. Hover shows the post itself.
 */
function PostContextChip({ post, onRemove }: PostContextChipProps) {
  const chip = (
    <div
      data-slot="post-context-chip"
      data-status={post.status}
      style={postChipStyle(post.status)}
      className={CONTEXT_CHIP_LINE}
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
    </div>
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

/**
 * The strip of posts attached to the composer. Selecting a post on the
 * calendar adds it here so the next message is about that post. Renders
 * nothing when empty, and chips spring in and out as the set changes.
 */
export function PostContext({ posts, onRemove, className }: PostContextProps) {
  const layoutLocked = useLayoutLocked();
  return (
    <div
      data-slot="post-context"
      className={cn("flex flex-wrap gap-xs empty:hidden", className)}
    >
      <AnimatePresence
        initial={false}
        mode={layoutLocked ? "sync" : "popLayout"}
      >
        {posts.map((post) => (
          <motion.div
            key={post.id}
            layout={layoutLocked ? false : "position"}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, transition: fade.fast }}
            transition={spring.snappy}
          >
            <PostContextChip post={post} onRemove={onRemove} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
