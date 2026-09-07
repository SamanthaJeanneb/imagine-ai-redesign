import { redirect } from "next/navigation";

import { isOnboarded } from "@/services/onboarding";

/** New users start at sign-in. Flip `onboarded` in the mock to skip the flow. */
export default function HomePage() {
  redirect(isOnboarded() ? "/agent" : "/sign-in");
}
