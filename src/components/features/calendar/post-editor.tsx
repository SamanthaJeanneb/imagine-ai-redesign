"use client";

import { useState } from "react";

import { LinkedInPostEditor } from "@/components/features/calendar/linkedin-post-detail";
import {
  type PostChipData,
  type PostChipStatus,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import type { AssetTileData } from "@/components/features/files/asset-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface PostEditorValue {
  post: PostChipData;
  date: string;
  internalNotes: string;
}

interface PostEditorProps {
  value: PostEditorValue;
  onSave: (value: PostEditorValue) => void;
  onOpenAgent: (value: PostEditorValue) => void;
  /** The editor asking for its tab to go away, after a delete. */
  onClose: () => void;
  onDelete?: (postId: string) => void;
  /** Assets the editor can attach to the post. */
  mediaLibrary?: readonly AssetTileData[];
}

function labelsOf(post: PostChipData): readonly string[] {
  if (post.labels !== undefined) return post.labels;
  return post.label === undefined ? [] : [post.label];
}

function withLabels(
  labels: readonly string[],
): Pick<PostChipData, "label" | "labels"> {
  const [first, ...rest] = labels;
  if (first === undefined) return { label: undefined, labels: [] };
  return { labels: [first, ...rest], label: first };
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

const STATUS_LABEL: Record<PostChipStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Ready",
  published: "Published",
  failed: "Failed",
};

const EDITABLE_STATUSES: readonly {
  status: PostChipStatus;
  label: string;
}[] = [
  { status: "draft", label: "Draft" },
  { status: "in_review", label: "Review" },
  { status: "scheduled", label: "Ready" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

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
  onSave,
  onOpenAgent,
  onClose,
  onDelete,
  mediaLibrary,
}: PostEditorProps) {
  const [draft, setDraft] = useState(value);
  const [labelInput, setLabelInput] = useState("");
  const preview = draft.post.preview;
  const author = preview?.author;
  const body = preview?.body ?? draft.post.title;
  const labels = labelsOf(draft.post);

  function updatePost(patch: Partial<PostChipData>) {
    setDraft((current) => ({
      ...current,
      post: { ...current.post, ...patch },
    }));
  }

  function addLabel() {
    const next = labelInput.trim();
    if (next === "") return;
    const exists = labels.some(
      (item) =>
        item.localeCompare(next, undefined, { sensitivity: "accent" }) === 0,
    );
    if (!exists) updatePost(withLabels([...labels, next]));
    setLabelInput("");
  }

  function removeLabel(name: string) {
    updatePost(withLabels(labels.filter((item) => item !== name)));
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-imagine-surface">
      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-row items-center gap-s px-l py-m">
        <h2 className="type-body font-semibold">Edit post</h2>
        <span
          style={postChipStyle(draft.post.status)}
          className="rounded-control bg-[color-mix(in_srgb,var(--chip-color)_18%,transparent)] px-s py-xxs type-caption text-imagine-foreground-muted"
        >
          {STATUS_LABEL[draft.post.status]}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenAgent(draft);
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
              post={draft.post}
              body={body}
              mediaLibrary={mediaLibrary}
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
            {draft.post.engagement === undefined ? (
              <>
                <Avatar
                  shape={author?.kind === "company" ? "square" : "circle"}
                  className="size-7"
                >
                  {author?.avatarUrl === undefined ? null : (
                    <AvatarImage src={author.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>
                    {initials(author?.name ?? draft.post.profile)}
                  </AvatarFallback>
                </Avatar>
                <Input
                  aria-label="First comment"
                  placeholder="Add a first comment"
                  className="border-0 bg-transparent shadow-none"
                />
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
              value={draft.date}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  date: event.target.value,
                }));
              }}
            />
            <Input
              type="time"
              value={draft.post.time.padStart(5, "0")}
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
              {EDITABLE_STATUSES.map((item) => (
                <Button
                  key={item.status}
                  type="button"
                  variant={
                    draft.post.status === item.status ? "soft" : "outline"
                  }
                  aria-pressed={draft.post.status === item.status}
                  onClick={() => {
                    updatePost({ status: item.status });
                  }}
                  className="min-w-0"
                >
                  {item.label}
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
              value={draft.internalNotes}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  internalNotes: event.target.value,
                }));
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
              onDelete(draft.post.id);
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
            onSave({ ...draft, post: { ...draft.post, status: "published" } });
          }}
          className="ml-auto"
        >
          Publish now
        </Button>
        <Button
          type="button"
          onClick={() => {
            onSave(draft);
          }}
        >
          Save
        </Button>
      </footer>
    </div>
  );
}
