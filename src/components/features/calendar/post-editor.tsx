"use client";

import { useState } from "react";

import { LinkedInPostEditor } from "@/components/features/calendar/linkedin-post-detail";
import {
  type PostChipData,
  POST_STATUS_LABEL,
  PostStatusPill,
} from "@/components/features/calendar/post-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PostChipStatus } from "@/entities/post";

export interface PostEditorValue {
  post: PostChipData;
  date: string;
  internalNotes: string;
}

interface PostEditorProps {
  /** The post as it is now. The editor owns nothing: every edit comes back through `onChange`. */
  value: PostEditorValue;
  /** The next value, on every edit. The owner keeps it and renders it back. */
  onChange: (value: PostEditorValue) => void;
  onOpenAgent: (value: PostEditorValue) => void;
  /** The editor asking for its tab to go away, after a delete. */
  onClose: () => void;
  onDelete?: (postId: string) => void;
}

function labelsOf(post: PostChipData): readonly string[] {
  return post.labels ?? [];
}

/** The value with part of its post changed. */
function withPost(
  value: PostEditorValue,
  patch: Partial<PostChipData>,
): PostEditorValue {
  return { ...value, post: { ...value.post, ...patch } };
}

/** The value with `name` added to its labels, unless it is already there in some casing. */
function withLabelAdded(value: PostEditorValue, name: string): PostEditorValue {
  const labels = labelsOf(value.post);
  const exists = labels.some(
    (item) =>
      item.localeCompare(name, undefined, { sensitivity: "accent" }) === 0,
  );
  if (exists) return value;
  return withPost(value, { labels: [...labels, name] });
}

function withLabelRemoved(
  value: PostEditorValue,
  name: string,
): PostEditorValue {
  return withPost(value, {
    labels: labelsOf(value.post).filter((item) => item !== name),
  });
}

function LabelPill({
  name,
  onRemove,
}: {
  name: string;
  onRemove: (name: string) => void;
}) {
  return (
    <Badge variant="soft">
      {name}
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        aria-label={`Remove ${name}`}
        onClick={() => {
          onRemove(name);
        }}
      >
        <Icon name="xmark" />
      </Button>
    </Badge>
  );
}

/** The statuses a person sets by hand; publishing and failing happen to a post. */
const EDITABLE_STATUSES = [
  "draft",
  "in_review",
  "scheduled",
] as const satisfies readonly PostChipStatus[];

function titleFromBody(body: string): string {
  const firstLine = body.split("\n", 1)[0] ?? "";
  return firstLine === "" ? "Untitled post" : firstLine;
}

/**
 * A post's own tab: the post as it reads on LinkedIn, editable, with the
 * publishing controls beside it. The attached chip stays in the chat, so the
 * agent can be asked about whatever is on screen.
 */
export function PostEditor({
  value,
  onChange,
  onOpenAgent,
  onClose,
  onDelete,
}: PostEditorProps) {
  // The only state here is the label field's text before it becomes a label.
  const [labelInput, setLabelInput] = useState("");
  const preview = value.post.preview;
  const author = preview?.author;
  const body = preview?.body ?? value.post.title;
  const labels = labelsOf(value.post);

  function updatePost(patch: Partial<PostChipData>) {
    onChange(withPost(value, patch));
  }

  function addLabel() {
    const next = labelInput.trim();
    if (next === "") return;
    onChange(withLabelAdded(value, next));
    setLabelInput("");
  }

  function removeLabel(name: string) {
    onChange(withLabelRemoved(value, name));
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-imagine-surface">
      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-row items-center gap-s px-l py-m">
        <h2 className="type-body font-semibold">Edit post</h2>
        <PostStatusPill status={value.post.status} />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenAgent(value);
          }}
          className="ml-auto"
        >
          <Icon name="imagine" size="s" />
          Open in agent
        </Button>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-l overflow-y-auto px-l pb-l md:grid-cols-[minmax(0,1fr)_20rem] md:overflow-hidden">
        <div className="min-w-0 overflow-y-auto py-l">
          {preview === undefined ? (
            <Textarea
              aria-label="Post body"
              value={body}
              onChange={(event) => {
                updatePost({ title: titleFromBody(event.target.value) });
              }}
              className="min-h-64 resize-none type-body"
            />
          ) : (
            <LinkedInPostEditor
              post={value.post}
              body={body}
              onBodyChange={(nextBody) => {
                updatePost({
                  title: titleFromBody(nextBody),
                  preview: { ...preview, body: nextBody },
                });
              }}
              onMediaChange={(media) => {
                const { media: _dropped, ...rest } = preview;
                updatePost({
                  preview: media.length === 0 ? rest : { ...rest, media },
                });
              }}
            />
          )}

          <div className="mt-l flex items-center gap-s pt-m">
            {value.post.engagement === undefined ? (
              <>
                <PersonAvatar
                  name={author?.name ?? value.post.profile}
                  avatarUrl={author?.avatarUrl}
                  shape={author?.kind === "company" ? "square" : "circle"}
                  className="size-7"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* The first comment is not wired up yet, so it reads as
                        the promise it is rather than a field that loses what
                        you type. */}
                    <span className="min-w-0 flex-1 truncate type-body text-imagine-foreground-faint">
                      Schedule first comment
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    This comment will go out when your post is scheduled
                  </TooltipContent>
                </Tooltip>
              </>
            ) : null}
            <span className="ml-auto shrink-0 type-caption text-imagine-foreground-muted tabular-nums">
              {body.length.toLocaleString()} characters
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-l overflow-y-auto rounded-panel bg-imagine-surface-raised/35 p-l">
          <fieldset className="flex flex-col gap-xs">
            <legend className="mb-xs type-small text-imagine-foreground-muted">
              Schedule
            </legend>
            <Input
              type="date"
              value={value.date}
              onChange={(event) => {
                onChange({ ...value, date: event.target.value });
              }}
            />
            <Input
              type="time"
              value={value.post.time.padStart(5, "0")}
              onChange={(event) => {
                updatePost({ time: event.target.value });
              }}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-xs">
            <legend className="mb-xs type-small text-imagine-foreground-muted">
              Status
            </legend>
            <div className="grid grid-cols-3 gap-xs">
              {EDITABLE_STATUSES.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={value.post.status === status ? "soft" : "outline"}
                  aria-pressed={value.post.status === status}
                  onClick={() => {
                    updatePost({ status });
                  }}
                  className="min-w-0"
                >
                  {POST_STATUS_LABEL[status]}
                </Button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-xs">
            <label
              htmlFor="post-label"
              className="type-small text-imagine-foreground-muted"
            >
              Label
            </label>
            {labels.length > 0 ? (
              <div className="flex flex-wrap gap-xs">
                {labels.map((item) => (
                  <LabelPill key={item} name={item} onRemove={removeLabel} />
                ))}
              </div>
            ) : null}
            <Input
              id="post-label"
              value={labelInput}
              placeholder="Type a label and press Enter"
              onChange={(event) => {
                setLabelInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) {
                  return;
                }
                event.preventDefault();
                addLabel();
              }}
            />
          </div>

          <label className="flex flex-col gap-xs">
            <span className="type-small text-imagine-foreground-muted">
              Internal notes
            </span>
            <Textarea
              value={value.internalNotes}
              onChange={(event) => {
                onChange({ ...value, internalNotes: event.target.value });
              }}
              placeholder="Add a note for your team"
              className="min-h-32 resize-none"
            />
          </label>
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-6xl shrink-0 items-center gap-xs px-l py-m">
        {onDelete === undefined ? null : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onDelete(value.post.id);
              onClose();
            }}
            className="text-destructive hover:text-destructive"
          >
            Delete post
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            updatePost({ status: "published" });
          }}
          className="ml-auto"
        >
          Publish now
        </Button>
      </footer>
    </div>
  );
}
