import { PageLoader } from "@/components/motion/logo-loader";

/** Route-level loading state: the wordmark shimmering on the background. */
export default function Loading() {
  return <PageLoader className="bg-imagine-background" />;
}
