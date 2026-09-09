import { AnalyticsPage2 } from "@/components/features/analytics/analytics-page-2";
import { getAnalyticsPageData } from "@/services/analytics";

/** The engagement-first analytics workspace: explorer, benchmark, ICP, team, best time, interactions. */
export default function AnalyticsPage2Route() {
  return <AnalyticsPage2 data={getAnalyticsPageData()} />;
}
