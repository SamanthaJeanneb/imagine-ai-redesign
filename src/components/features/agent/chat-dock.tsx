"use client";

import { useRouter } from "next/navigation";
import { Activity } from "react";

import { ChartContext } from "@/components/features/agent/chart-context";
import { useChat } from "@/components/features/agent/chat-provider";
import {
  Composer,
  type ComposerPreview,
} from "@/components/features/agent/composer";
import { PostContext } from "@/components/features/agent/post-context";
import { PreviewSurface } from "@/components/features/agent/preview-surface";
import { ChartCard } from "@/components/features/analytics/chart-card";
import { CalendarGrid } from "@/components/features/calendar/calendar-grid";

/**
 * Shared between each preview and the block on its page, so expanding morphs
 * the grid or the chart into place rather than cutting to it.
 */
export const PREVIEW_LAYOUT_ID: Record<ComposerPreview, string> = {
  calendar: "calendar-grid",
  analytics: "analytics-chart",
};

/** The composer's one box, wherever the chat is: the shell's column or the page. */
export const COMPOSER_LAYOUT_ID = "composer";

const PREVIEW_PAGE: Record<ComposerPreview, string> = {
  calendar: "/calendar",
  analytics: "/analytics",
};

const EXPAND_LABEL: Record<ComposerPreview, string> = {
  calendar: "Open calendar",
  analytics: "Open analytics",
};

interface ChatDockProps {
  variant?: "hero" | "dock";
  /**
   * Which preview chips to offer. The chat beside the calendar has no use for
   * a calendar preview.
   */
  previews?: readonly ComposerPreview[];
  animateLayout?: boolean;
  className?: string;
}

/**
 * The composer wired to the conversation: draft, attached post, and the
 * Calendar and Analytics previews. Both previews stay mounted behind
 * `Activity`, so their cells and bars keep their state between opens; the
 * surface only shows the one whose chip is on.
 */
export function ChatDock({
  variant = "dock",
  previews,
  animateLayout = true,
  className,
}: ChatDockProps) {
  const router = useRouter();
  const chat = useChat();
  const isDock = variant === "dock";
  const shown = chat.lastPreview;
  const attached = chat.attached;

  return (
    <Composer
      variant={variant}
      value={chat.draft}
      onValueChange={chat.setDraft}
      onSend={chat.send}
      animateLayout={animateLayout}
      layoutId={COMPOSER_LAYOUT_ID}
      className={className}
      {...(isDock
        ? {
            preview: chat.preview,
            onPreviewChange: chat.setPreview,
            ...(previews === undefined ? {} : { previews }),
          }
        : {})}
      {...(attached === null
        ? {}
        : attached.kind === "post"
          ? {
              placeholder: "Ask about this post",
              attachments: (
                <PostContext
                  posts={[attached.post]}
                  onRemove={chat.clearAttached}
                />
              ),
            }
          : {
              placeholder: "Ask about this chart",
              attachments: (
                <ChartContext
                  chart={attached.chart}
                  onRemove={chat.clearAttached}
                />
              ),
            })}
    >
      {isDock ? (
        <PreviewSurface
          open={chat.preview !== null}
          expandLabel={EXPAND_LABEL[shown]}
          onExpand={() => {
            chat.expand(shown);
            router.push(PREVIEW_PAGE[shown]);
          }}
        >
          {/* Only the visible preview carries the shared id: a hidden one
              would measure as nothing and the page's block would morph from it. */}
          <Activity mode={shown === "calendar" ? "visible" : "hidden"}>
            <CalendarGrid
              days={chat.previews.calendar}
              density="preview"
              {...(shown === "calendar"
                ? { layoutId: PREVIEW_LAYOUT_ID.calendar }
                : {})}
              onOpenPost={(post) => {
                chat.toggleAttached({ kind: "post", post });
              }}
              {...(chat.attachedId === null
                ? {}
                : { selectedPostId: chat.attachedId })}
            />
          </Activity>
          <Activity mode={shown === "analytics" ? "visible" : "hidden"}>
            {/* Side by side where the composer is wide, stacked in the
                shell's chat column. */}
            <div className="@container">
              <div className="grid gap-xs @md:grid-cols-3">
                {chat.previews.analytics.map((chart, index) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    dense
                    selected={chat.attachedId === chart.id}
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
      ) : null}
    </Composer>
  );
}
