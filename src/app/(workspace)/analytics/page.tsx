import type { Metadata } from "next";

import { AnalyticsPage as AnalyticsPageView } from "@/components/features/analytics/analytics-page";
import { getAnalyticsPageData } from "@/services/analytics";

export const metadata: Metadata = {
  title: "Analytics",
  description: "How the workspace's LinkedIn posts are performing.",
};

/** The complete analytics workspace. */
export default function AnalyticsPage() {
  return <AnalyticsPageView data={getAnalyticsPageData()} />;
}
