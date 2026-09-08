import { AnalyticsPage as AnalyticsPageView } from "@/components/features/analytics/analytics-page";
import { getAnalyticsOverview } from "@/services/analytics";

/** Last month's numbers and the shape of them. Phase 8 adds the controls and breakdowns. */
export default function AnalyticsPage() {
  const overview = getAnalyticsOverview("1m");

  return (
    <AnalyticsPageView
      stats={overview.stats}
      impressions={overview.impressions}
    />
  );
}
