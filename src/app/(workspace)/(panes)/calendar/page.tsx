import type { Metadata } from "next";

import { CalendarPage as CalendarPageView } from "@/components/features/calendar/calendar-page";
import { getCalendarPosts } from "@/services/calendar";

export const metadata: Metadata = {
  title: "Calendar",
  description: "What is scheduled to publish, week by week.",
};

/**
 * The page hands over the chips rather than a grid: the view, the month, and
 * the search all change in the browser, and `lib/calendar` builds the cells.
 */
export default function CalendarPage() {
  const { postsByDay, eventsByDay, today, newPostProfile } = getCalendarPosts();

  return (
    <CalendarPageView
      postsByDay={postsByDay}
      eventsByDay={eventsByDay}
      today={today}
      newPostProfile={newPostProfile}
    />
  );
}
