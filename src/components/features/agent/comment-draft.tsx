"use client";

import { motion } from "motion/react";
import { useState } from "react";

import type { PostAuthor } from "@/components/features/agent/linkedin-post-draft";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Textarea } from "@/components/ui/textarea";
import { spring } from "@/styles/motion";

/** What the agent is replying to: their comment on your post, or their own post. */
interface CommentTarget {
  author: PostAuthor;
  /** The comment, or the opening of their post. */
  text: string;
  /** "on your post 'The roadmap review…'" or "their latest post". */
  context: string;
}

export interface CommentDraftContent {
  target: CommentTarget;
  /** Who the reply is written as. */
  author: PostAuthor;
  body: string;
}

interface CommentDraftProps extends CommentDraftContent {
  /** Post it; the id is whatever the caller needs to act on. */
  onPost?: (body: string) => void;
}

function Person({ author }: { author: PostAuthor }) {
  return (
    <PersonAvatar
      name={author.name}
      avatarUrl={author.avatarUrl}
      shape={author.kind === "company" ? "square" : "circle"}
      size="sm"
    />
  );
}

/**
 * A comment, drafted. The thing being answered sits above in a muted quote;
 * the reply below reads as a LinkedIn comment from the profile, editable in
 * place. Post keeps the text in this session.
 */
export function CommentDraft({
  target,
  author,
  body: initialBody,
  onPost,
}: CommentDraftProps) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [posted, setPosted] = useState(false);
  const layoutLocked = useLayoutLocked();

  return (
    <motion.div
      layout={!layoutLocked}
      layoutDependency={`${String(editing)}:${String(posted)}`}
      transition={spring.settle}
      data-slot="comment-draft"
      className="flex max-w-lg flex-col gap-m rounded-panel bg-imagine-surface p-l shadow-raised"
    >
      <div className="flex items-start gap-s">
        <Person author={target.author} />
        <div className="flex min-w-0 flex-1 flex-col gap-xxs">
          <p className="type-small">
            <span className="font-medium">{target.author.name}</span>{" "}
            <span className="text-imagine-foreground-muted">
              {target.context}
            </span>
          </p>
          <blockquote className="rounded-control bg-imagine-background px-m py-s type-small text-imagine-foreground-muted">
            {target.text}
          </blockquote>
        </div>
      </div>

      <div className="ml-l flex items-start gap-s border-l-2 border-imagine-secondary/40 pl-m">
        <Person author={author} />
        <div className="flex min-w-0 flex-1 flex-col gap-xs">
          <p className="flex items-baseline gap-s type-small">
            <span className="font-medium">{author.name}</span>
            <span className="truncate text-imagine-foreground-faint">
              {author.headline}
            </span>
          </p>
          {editing ? (
            <Textarea
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
              }}
              rows={4}
              autoFocus
              className="type-body"
            />
          ) : (
            <p className="type-body whitespace-pre-line">{body}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-s pl-l">
        <Button
          size="sm"
          disabled={posted}
          onClick={() => {
            setEditing(false);
            setPosted(true);
            onPost?.(body);
          }}
        >
          <Icon
            name={posted ? "check" : "paper-plane"}
            size="s"
            data-icon="inline-start"
          />
          {posted ? "Posted" : "Post comment"}
        </Button>
        {posted ? null : (
          <Button
            size="sm"
            variant="soft"
            aria-pressed={editing}
            onClick={() => {
              setEditing((current) => !current);
            }}
          >
            {editing ? "Done" : "Edit"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
