import type { Metadata } from "next";

import { ApiDocs } from "@/components/features/settings/api-docs";

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "Reference documentation for the Imagine AI customer analytics REST API.",
};

/** Public analytics API reference, linked from Settings, API. */
export default function ApiDocsPage() {
  return <ApiDocs />;
}
