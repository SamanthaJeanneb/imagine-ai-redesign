"use client";

import { useState } from "react";

import type { PostEditorValue } from "@/components/features/calendar/post-editor";
import type { PostChipData } from "@/entities/post";
import type { PostsByDay } from "@/lib/calendar";
import type { NewPostProfile } from "@/services/posts";

/** A post and the day it sits on. */
interface DatedPost {
  post: PostChipData;
  date: string;
}

/**
 * What the calendar shows on top of the posts it was handed: the edits, the
 * deletes, and the drafts written since it opened. This mock editor keeps
 * changes for the life of the calendar page, including moving a post to
 * another day.
 */
export function useCalendarPosts(postsByDay: PostsByDay) {
  const [edits, setEdits] = useState<Record<string, PostEditorValue>>({});
  const [deletedPostIds, setDeletedPostIds] = useState<readonly string[]>([]);
  const [drafted, setDrafted] = useState<readonly DatedPost[]>([]);

  const byDay: Record<string, readonly PostChipData[]> = {};
  const dated: readonly DatedPost[] = [
    ...Object.entries(postsByDay).flatMap(([date, posts]) =>
      posts.map((post) => ({ post, date })),
    ),
    ...drafted,
  ];
  for (const original of dated) {
    if (deletedPostIds.includes(original.post.id)) continue;
    const edit = edits[original.post.id];
    const post = edit?.post ?? original.post;
    const date = edit?.date ?? original.date;
    byDay[date] = [...(byDay[date] ?? []), post];
  }

  const all = Object.values(byDay).flat();

  function dateFor(postId: string): string | undefined {
    return Object.entries(byDay).find(([, posts]) =>
      posts.some((post) => post.id === postId),
    )?.[0];
  }

  /** What the editor opens with: the saved edit, or the post as it stands. */
  const editorValueFor = (postId: string): PostEditorValue | undefined => {
    const post = all.find((candidate) => candidate.id === postId);
    const date = dateFor(postId);
    if (post === undefined || date === undefined) return undefined;
    return edits[post.id] ?? { post, date, internalNotes: "" };
  };

  /** A blank draft on `date`, ready to write. */
  const draft = (
    profile: NewPostProfile,
    date: string,
    time: string,
  ): PostChipData => {
    const post: PostChipData = {
      id: `new_${String(Date.now())}`,
      title: "Untitled post",
      time,
      profile: profile.profile,
      status: "draft",
      preview: { author: profile.author, body: "" },
    };
    setDrafted((current) => [...current, { post, date }]);
    return post;
  };

  const save = (value: PostEditorValue) => {
    setEdits((current) => ({ ...current, [value.post.id]: value }));
  };

  const remove = (postId: string) => {
    setDeletedPostIds((current) => [...current, postId]);
  };

  return { byDay, dateFor, editorValueFor, draft, save, remove };
}
