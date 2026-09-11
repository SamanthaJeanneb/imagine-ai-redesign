import { redirect } from "next/navigation";

/** Signing in is step one, so the flow opens on the organization. */
export default function Onboarding2Page() {
  redirect("/onboarding-2/organization");
}
