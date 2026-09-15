"use client";

import { cn } from "cn";
import { useRef } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import {
  LinkedInPostActions,
  LinkedInPostActor,
  LinkedInPostEditableMedia,
  LinkedInPostImpressions,
  LinkedInPostMedia,
  LinkedInPostPlainCard,
  LinkedInPostPlainField,
  LinkedInPostProvider,
} from "@/components/features/agent/linkedin-post-draft";
import {
  LinkedInReaction,
  LinkedInReactionCluster,
  linkedInReactionType,
  linkedInReactionTypes,
} from "@/components/features/agent/linkedin-reaction";
import { DashedActionRow } from "@/components/ui/dashed-action";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { COUNT } from "@/lib/format";

interface LinkedInPostEditorProps {
  post: PostChipData;
  body: string;
  onBodyChange: (body: string) => void;
  onMediaChange?: (media: readonly AssetTileData[]) => void;
}

/** LinkedIn's preview shows at most two images. */
const MEDIA_LIMIT = 2;

function mediaKind(file: File): AssetTileData["kind"] | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function assetsFromFiles(
  files: readonly File[],
  limit: number,
): AssetTileData[] {
  const assets: AssetTileData[] = [];
  for (const file of files) {
    if (assets.length >= limit) break;
    const kind = mediaKind(file);
    if (kind === null) continue;
    assets.push({
      id: `upload-${crypto.randomUUID()}`,
      kind,
      src: URL.createObjectURL(file),
      caption: file.name,
    });
  }
  return assets;
}

function revokeBlobSrc(src: string | undefined) {
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}

export function LinkedInPostEditor({
  post,
  body,
  onBodyChange,
  onMediaChange,
}: LinkedInPostEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preview = post.preview;
  if (preview === undefined) return null;

  const media = preview.media ?? [];
  const stats = preview.stats;
  const reactors = post.engagement?.reactors ?? [];
  const comments = post.engagement?.comments ?? [];
  const remainingReactions = Math.max(
    0,
    (stats?.reactions ?? 0) - reactors.length,
  );

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-l">
      {/* The post as the feed will show it, typed into in place. It stays
          unfolded: this is the whole post, not a preview of it. */}
      <LinkedInPostProvider
        author={preview.author}
        body={body}
        media={media}
        stats={stats}
        defaultExpanded
      >
        <LinkedInPostPlainCard>
          <LinkedInPostActor timestamp={post.time} you />
          <LinkedInPostPlainField onBodyChange={onBodyChange} />
          {onMediaChange === undefined ? (
            <LinkedInPostMedia />
          ) : (
            <LinkedInPostEditableMedia
              onRemoveMedia={(id) => {
                const removed = media.find((item) => item.id === id);
                revokeBlobSrc(removed?.src);
                onMediaChange(media.filter((item) => item.id !== id));
              }}
            />
          )}
          <LinkedInPostActions />
          <LinkedInPostImpressions />
        </LinkedInPostPlainCard>
      </LinkedInPostProvider>

      {onMediaChange === undefined || media.length >= MEDIA_LIMIT ? null : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length === 0) return;
              const uploaded = assetsFromFiles(
                files,
                MEDIA_LIMIT - media.length,
              );
              if (uploaded.length === 0) return;
              onMediaChange([...media, ...uploaded]);
            }}
          />
          <DashedActionRow
            icon="upload"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            {media.length === 0 ? "Add media" : "Add another image"}
          </DashedActionRow>
        </>
      )}

      {post.engagement === undefined ? null : (
        <section>
          <div className="mb-l flex items-center justify-between gap-m">
            <div className="flex min-w-0 items-center">
              {reactors.slice(0, 6).map((reactor, index) => (
                <span
                  key={`${reactor.id}:${reactor.reaction}`}
                  title={`${reactor.name} reacted ${reactor.reaction}`}
                  className={cn("relative block", index > 0 && "-ml-xs")}
                >
                  <PersonAvatar
                    name={reactor.name}
                    avatarUrl={reactor.avatarUrl}
                    className="size-8 ring-2 ring-imagine-surface"
                  />
                  <LinkedInReaction
                    type={linkedInReactionType(reactor.reaction)}
                    className="absolute -right-0.5 -bottom-0.5 ring-2"
                  />
                </span>
              ))}
              <span className="ml-s truncate type-small text-imagine-foreground-muted">
                {remainingReactions > 0
                  ? `and ${COUNT.format(remainingReactions)} others`
                  : `${COUNT.format(reactors.length)} reactions`}
              </span>
              <LinkedInReactionCluster
                types={linkedInReactionTypes(
                  reactors.map((reactor) => reactor.reaction),
                )}
                className="ml-s shrink-0"
              />
            </div>
            <span className="shrink-0 type-small text-imagine-foreground-muted">
              {COUNT.format(stats?.comments ?? comments.length)} comments
            </span>
          </div>

          <div className="flex items-center gap-s">
            <PersonAvatar
              name={preview.author.name}
              avatarUrl={preview.author.avatarUrl}
              className="size-9"
            />
            {/* Commenting from here is not wired up yet, so the field, Like,
                and Reply below read as the feed's chrome rather than controls
                that answer a click. */}
            <span className="flex min-h-10 flex-1 items-center rounded-full bg-imagine-surface-raised px-m type-small text-imagine-foreground-muted">
              Add a comment…
            </span>
          </div>

          <div className="my-m flex items-center gap-xs type-small font-semibold">
            Most relevant
            <Icon
              name="chevron-down"
              size="s"
              className="text-imagine-foreground-muted"
            />
          </div>

          <div className="flex flex-col gap-l">
            {comments.map((comment) => (
              <article key={comment.id} className="flex items-start gap-s">
                <PersonAvatar
                  name={comment.author.name}
                  avatarUrl={comment.author.avatarUrl}
                  className="mt-xxs size-9 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="rounded-xl bg-imagine-surface-raised px-m py-s">
                    <div className="flex items-start justify-between gap-s">
                      <div className="min-w-0">
                        <p className="truncate type-small font-semibold">
                          {comment.author.name}
                        </p>
                        <p className="truncate type-caption text-imagine-foreground-muted">
                          {comment.author.headline}
                        </p>
                      </div>
                      <span className="shrink-0 type-caption text-imagine-foreground-muted">
                        {comment.when}
                      </span>
                    </div>
                    <p className="mt-s type-small whitespace-pre-line">
                      {comment.body}
                    </p>
                  </div>
                  <div className="mt-xs flex items-center gap-xs px-s type-caption font-semibold text-imagine-foreground-muted">
                    <span>Like</span>
                    <span aria-hidden="true">·</span>
                    <span>Reply</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
