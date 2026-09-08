import { AnalyticsPage as AnalyticsPageView } from "@/components/features/analytics/analytics-page";
import { getAnalyticsPageData } from "@/services/analytics";

/** The complete analytics workspace. */
export default function AnalyticsPage() {
  return <AnalyticsPageView data={getAnalyticsPageData()} />;
}
