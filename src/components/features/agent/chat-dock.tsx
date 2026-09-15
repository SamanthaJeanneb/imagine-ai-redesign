"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { Activity, type ReactNode } from "react";

import { ChartContext } from "@/components/features/agent/chart-context";
import {
  useChat,
  type ChatAttachment,
} from "@/components/features/agent/chat-provider";
import {
  ALL_PREVIEWS,
  ComposerAttachButton,
  ComposerAttachments,
  ComposerDropZone,
  ComposerExpandAction,
  ComposerFrame,
  ComposerInput,
  ComposerInputRow,
  ComposerPreviewChips,
  ComposerProvider,
  ComposerSendButton,
  type ComposerPreview,
} from "@/components/features/agent/composer";
import { PostContext } from "@/components/features/agent/post-context";
import { PreviewSurface } from "@/components/features/agent/preview-surface";
import {
  AssetContext,
  FileContext,
} from "@/components/features/agent/resource-context";
import { ChartPreviewCard } from "@/components/features/analytics/chart-card";
import { CalendarPreview } from "@/components/features/calendar/calendar-grid";
import { useFilesPanelApi } from "@/components/layout/files-panel";

/**
 * Shared between each preview and the block on its page, so expanding morphs
 * the grid or the chart into place rather than cutting to it.
 */
export const PREVIEW_LAYOUT_ID: Record<ComposerPreview, string> = {
  calendar: "calendar-grid",
  analytics: "analytics-chart",
};

/** The composer's one box, wherever the chat is: the shell's column or the page. */
const COMPOSER_LAYOUT_ID = "composer";

const PREVIEW_PAGE: Record<ComposerPreview, string> = {
  calendar: "/calendar",
  analytics: "/analytics",
};

const EXPAND_LABEL: Record<ComposerPreview, string> = {
  calendar: "Open calendar",
  analytics: "Open analytics",
};

/* -------------------------------------------------------------------------- */
/* Shared internals: the conversation as the composer's state                  */
/* -------------------------------------------------------------------------- */

interface ChatComposerProviderProps {
  children: ReactNode;
}

/** The composer parts, backed by the conversation in `ChatProvider`. */
function ChatComposerProvider({ children }: ChatComposerProviderProps) {
  const chat = useChat();
  return (
    <ComposerProvider
      value={chat.draft}
      onValueChange={chat.setDraft}
      onSend={chat.send}
      onResourceDrop={chat.attach}
    >
      {children}
    </ComposerProvider>
  );
}

function placeholderFor(
  attached: readonly ChatAttachment[],
): string | undefined {
  if (attached.length > 1) {
    return `Ask about these ${String(attached.length)} items`;
  }
  switch (attached[0]?.kind) {
    case "post":
      return "Ask about this post";
    case "chart":
      return "Ask about this chart";
    case "file":
      return "Ask about this file";
    case "asset":
      return "Ask about this asset";
    default:
      return undefined;
  }
}

/** The field, with its placeholder following what is attached. */
function ChatInput({ className }: { className?: string }) {
  const chat = useChat();
  const placeholder = placeholderFor(chat.attached);
  return (
    <ComposerInput
      className={className}
      {...(placeholder === undefined ? {} : { placeholder })}
    />
  );
}

/** Attach opens the files panel where the shell provides one. */
function ChatAttachButton({ size }: { size: "icon" | "icon-sm" }) {
  const filesPanel = useFilesPanelApi();
  return (
    <ComposerAttachButton
      size={size}
      {...(filesPanel === null ? {} : { onClick: filesPanel.open })}
    />
  );
}

/** Posts, charts, files, and assets attached to the next message. */
function ChatAttachments({ className }: { className: string }) {
  const chat = useChat();
  const attached = chat.attached;
  return (
    <ComposerAttachments className={className}>
      {attached.length === 0 ? null : (
        <div className="flex flex-nowrap gap-xs overflow-x-auto pb-xxs">
          {attached.map((item) => {
            if (item.kind === "post") {
              return (
                <PostContext
                  key={item.post.id}
                  post={item.post}
                  onRemove={chat.clearAttached}
                  className="shrink-0"
                />
              );
            }
            if (item.kind === "chart") {
              return (
                <div key={item.chart.id} className="shrink-0">
                  <ChartContext
                    chart={item.chart}
                    onRemove={() => {
                      chat.clearAttached(item.chart.id);
                    }}
                  />
                </div>
              );
            }
            if (item.kind === "file") {
              return (
                <FileContext
                  key={item.file.id}
                  file={item.file}
                  className="shrink-0"
                  onRemove={() => {
                    chat.clearAttached(item.file.id);
                  }}
                />
              );
            }
            return (
              <AssetContext
                key={item.asset.id}
                asset={item.asset}
                className="shrink-0"
                onRemove={() => {
                  chat.clearAttached(item.asset.id);
                }}
              />
            );
          })}
        </div>
      )}
    </ComposerAttachments>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero: the landing prompt                                                    */
/* -------------------------------------------------------------------------- */

interface HeroChatDockProps {
  className?: string;
}

/** The landing's prompt box: larger type, no previews. */
export function HeroChatDock({ className }: HeroChatDockProps) {
  return (
    <ChatComposerProvider>
      <ComposerFrame
        layoutId={COMPOSER_LAYOUT_ID}
        layoutDependency="hero"
        className={cn("p-s", className)}
      >
        <ComposerDropZone />
        <ChatAttachments className="px-s pt-s" />
        <ComposerInputRow className="p-xs pl-s">
          <ChatAttachButton size="icon" />
          <ChatInput className="min-h-9 py-2 type-heading font-normal" />
          <ComposerSendButton size="icon" />
        </ComposerInputRow>
      </ComposerFrame>
    </ChatComposerProvider>
  );
}

/* -------------------------------------------------------------------------- */
/* Thread dock: the bottom bar with Calendar and Analytics previews            */
/* -------------------------------------------------------------------------- */

interface ThreadChatDockProps {
  /**
   * Which preview chips to offer. The chat beside the calendar has no use for
   * a calendar preview.
   */
  previews?: readonly ComposerPreview[];
  className?: string;
}

/**
 * The composer at the foot of a thread. Both previews stay mounted behind
 * `Activity`, so their cells and bars keep their state between opens; the
 * surface only shows the one whose chip is on.
 */
export function ThreadChatDock({
  previews = ALL_PREVIEWS,
  className,
}: ThreadChatDockProps) {
  const router = useRouter();
  const chat = useChat();
  // Only ever one of the offered previews: a filtered-out one would still
  // hold its page's shared layout id while that page held it too.
  const shown = previews.includes(chat.lastPreview)
    ? chat.lastPreview
    : (previews[0] ?? "calendar");
  const attachedPosts = chat.attachedPosts;

  return (
    <ChatComposerProvider>
      <ComposerFrame
        layoutId={COMPOSER_LAYOUT_ID}
        layoutDependency="dock"
        className={cn("p-xs", className)}
      >
        <ComposerDropZone />
        {/* The preview sits on top: the open chip below it dismisses, and
              Open calendar / Open analytics sits on that same row, trailing. */}
        <PreviewSurface open={chat.preview !== null}>
          {/* Only the visible preview carries the shared id: a hidden one
                would measure as nothing and the page's block would morph from it. */}
          <Activity mode={shown === "calendar" ? "visible" : "hidden"}>
            <CalendarPreview
              days={chat.previews.calendar}
              {...(shown === "calendar"
                ? { layoutId: PREVIEW_LAYOUT_ID.calendar }
                : {})}
              onOpenPost={(post) => {
                chat.toggleAttached({ kind: "post", post });
              }}
              onOpenEvent={chat.draftFromEvent}
              {...(attachedPosts.length === 0
                ? {}
                : { selectedPostId: attachedPosts.at(-1)?.id })}
            />
          </Activity>
          <Activity mode={shown === "analytics" ? "visible" : "hidden"}>
            {/* Side by side where the composer is wide, stacked in the
                  shell's chat column. */}
            <div className="@container">
              <div className="grid gap-xs @md:grid-cols-3">
                {chat.previews.analytics.map((chart, index) => (
                  <ChartPreviewCard
                    key={chart.id}
                    chart={chart}
                    selected={chat.attachedIds.includes(chart.id)}
                    onOpen={() => {
                      chat.toggleAttached({ kind: "chart", chart });
                    }}
                    /* The first card is the page's first block: the one the
                         expanded page morphs from. */
                    {...(shown === "analytics" && index === 0
                      ? { layoutId: PREVIEW_LAYOUT_ID.analytics }
                      : {})}
                  />
                ))}
              </div>
            </div>
          </Activity>
        </PreviewSurface>
        <ComposerPreviewChips
          previews={previews}
          value={chat.preview}
          onValueChange={chat.setPreview}
        >
          {chat.preview === null ? null : (
            <ComposerExpandAction
              onClick={() => {
                chat.expand(shown);
                router.push(PREVIEW_PAGE[shown]);
              }}
            >
              {EXPAND_LABEL[shown]}
            </ComposerExpandAction>
          )}
        </ComposerPreviewChips>
        <ChatAttachments className="px-xs pt-xs" />
        <ComposerInputRow className="p-xs">
          <ChatAttachButton size="icon-sm" />
          <ChatInput />
          <ComposerSendButton size="icon-sm" />
        </ComposerInputRow>
      </ComposerFrame>
    </ChatComposerProvider>
  );
}
