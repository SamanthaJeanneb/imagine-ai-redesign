"use client";

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Textarea } from "@/components/ui/textarea";
import type { CommentDraftContent } from "@/entities/agent";
import type { PostAuthor } from "@/entities/post";
import { spring } from "@/styles/motion";

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

/** What is being answered, in a muted quote above the reply. */
function CommentTarget({ target }: { target: CommentDraftContent["target"] }) {
  return (
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
  );
}

/** The reply, indented under the quote: who it goes out as, then the body. */
function CommentReply({
  author,
  children,
}: {
  author: PostAuthor;
  children: ReactNode;
}) {
  return (
    <div className="ml-l flex items-start gap-s border-l-2 border-imagine-secondary/40 pl-m">
      <Person author={author} />
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <p className="flex items-baseline gap-s type-small">
          <span className="font-medium">{author.name}</span>
          <span className="truncate text-imagine-foreground-faint">
            {author.headline}
          </span>
        </p>
        {children}
      </div>
    </div>
  );
}

/** The reply as it will read once it goes out. */
function CommentBody({ body }: { body: string }) {
  return <p className="type-body whitespace-pre-line">{body}</p>;
}

/** The same reply, open for typing. */
function CommentField({
  body,
  onBodyChange,
}: {
  body: string;
  onBodyChange: (body: string) => void;
}) {
  return (
    <Textarea
      value={body}
      onChange={(event) => {
        onBodyChange(event.target.value);
      }}
      rows={4}
      autoFocus
      className="type-body"
    />
  );
}

/** The row under the reply. */
function CommentDraftActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-s pl-l">{children}</div>
  );
}

function PostCommentButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      <Icon name="paper-plane" size="s" data-icon="inline-start" />
      Post comment
    </Button>
  );
}

/** Once it has gone out the button stands as the record of it. */
function PostedCommentButton() {
  return (
    <Button size="sm" disabled>
      <Icon name="check" size="s" data-icon="inline-start" />
      Posted
    </Button>
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

  function post() {
    setEditing(false);
    setPosted(true);
    onPost?.(body);
  }

  return (
    <motion.div
      layout={!layoutLocked}
      layoutDependency={`${String(editing)}:${String(posted)}`}
      transition={spring.settle}
      data-slot="comment-draft"
      className="flex max-w-lg flex-col gap-m rounded-panel bg-imagine-surface p-l shadow-raised"
    >
      <CommentTarget target={target} />

      <CommentReply author={author}>
        {editing ? (
          <CommentField body={body} onBodyChange={setBody} />
        ) : (
          <CommentBody body={body} />
        )}
      </CommentReply>

      {posted ? (
        <CommentDraftActions>
          <PostedCommentButton />
        </CommentDraftActions>
      ) : editing ? (
        <CommentDraftActions>
          <PostCommentButton onClick={post} />
          <Button
            size="sm"
            variant="soft"
            aria-pressed
            onClick={() => {
              setEditing(false);
            }}
          >
            Done
          </Button>
        </CommentDraftActions>
      ) : (
        <CommentDraftActions>
          <PostCommentButton onClick={post} />
          <Button
            size="sm"
            variant="soft"
            aria-pressed={false}
            onClick={() => {
              setEditing(true);
            }}
          >
            Edit
          </Button>
        </CommentDraftActions>
      )}
    </motion.div>
  );
}
