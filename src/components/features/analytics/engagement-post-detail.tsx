"use client";

import { motion } from "motion/react";

import type { ExplorerPost } from "@/components/features/analytics/engagement-explorer-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { initials } from "@/lib/initials";
import { fade } from "@/styles/motion";

/** The post under the cursor, the pinned one, or the latest. */
export function PostDetail({
  post,
  selected,
  onSelect,
}: {
  post: ExplorerPost;
  selected: boolean;
  onSelect?: (post: ExplorerPost) => void;
}) {
  return (
    <motion.article
      key={post.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.fast}
      className="flex flex-col gap-m"
    >
      <div className="flex items-center gap-s">
        <Avatar size="sm" shape={post.isCompany ? "square" : "circle"}>
          {post.avatarUrl ? (
            <AvatarImage src={post.avatarUrl} alt={post.profileName} />
          ) : null}
          <AvatarFallback>{initials(post.profileName)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate type-small text-imagine-foreground-muted">
          {post.profileName} · {post.label}
        </span>
      </div>
      <p className="line-clamp-2 type-small font-medium">{post.title}</p>
      <Button
        size="sm"
        variant={selected ? "default" : "soft"}
        onClick={() => onSelect?.(post)}
        disabled={onSelect === undefined || post.chip === undefined}
        className="self-start"
      >
        <Icon
          name={selected ? "check" : "paperclip"}
          size="s"
          data-icon="inline-start"
        />
        {selected ? "Attached" : "Attach to chat"}
      </Button>
    </motion.article>
  );
}
