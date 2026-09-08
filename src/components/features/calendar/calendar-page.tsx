"use client";

import { motion } from "motion/react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import {
  type CalendarDay,
  CalendarGrid,
} from "@/components/features/calendar/calendar-grid";
import { fade } from "@/styles/motion";

interface CalendarPageProps {
  /** "September 2026". */
  label: string;
  days: readonly CalendarDay[];
}

/**
 * The calendar page's body. The grid carries the composer preview's layout
 * id, so expanding the preview morphs it into place; selecting a post attaches
 * it to the chat in the column beside it.
 */
export function CalendarPage({ label, days }: CalendarPageProps) {
  const chat = useChat();

  return (
    <div className="flex flex-1 flex-col gap-xl px-xxl pb-xxl">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fade.base}
        className="type-heading"
      >
        {label}
      </motion.h1>
      <CalendarGrid
        days={days}
        density="page"
        layoutId={PREVIEW_LAYOUT_ID.calendar}
        onOpenPost={(post) => {
          chat.setAttached(chat.attached?.id === post.id ? null : post);
        }}
        {...(chat.attached === null
          ? {}
          : { selectedPostId: chat.attached.id })}
      />
    </div>
  );
}
