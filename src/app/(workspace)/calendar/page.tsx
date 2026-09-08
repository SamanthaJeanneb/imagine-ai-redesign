import { CalendarPage as CalendarPageView } from "@/components/features/calendar/calendar-page";
import { getCalendarMonth } from "@/services/calendar";

/** The month, with the chat beside it. Phase 7 adds the toolbar and the other views. */
export default function CalendarPage() {
  const month = getCalendarMonth();

  return <CalendarPageView label={month.rangeLabel} days={month.days} />;
}
