import { CalendarPage } from "@/components/features/calendar/calendar-page";
import { getCalendarPosts } from "@/services/calendar";

/** Alternate calendar exploration: post editing stays inside page tabs. */
export default function CalendarTabsPage() {
  const { postsByDay, eventsByDay, today, mediaLibrary, labelOptions } =
    getCalendarPosts();

  return (
    <CalendarPage
      postsByDay={postsByDay}
      eventsByDay={eventsByDay}
      today={today}
      mediaLibrary={mediaLibrary}
      labelOptions={labelOptions}
      editorPresentation="tabs"
    />
  );
}
