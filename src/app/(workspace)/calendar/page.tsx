import { CalendarPage as CalendarPageView } from "@/components/features/calendar/calendar-page";
import { getCalendarPosts } from "@/services/calendar";

/**
 * The page hands over the chips rather than a grid: the view, the month, and
 * the search all change in the browser, and `lib/calendar` builds the cells.
 */
export default function CalendarPage() {
  const { postsByDay, today } = getCalendarPosts();

  return <CalendarPageView postsByDay={postsByDay} today={today} />;
}
