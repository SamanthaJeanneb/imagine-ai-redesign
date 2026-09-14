import { MeetingStep } from "@/app/(auth)/onboarding/meeting/meeting-step";
import { getStrategyMeetingUrl } from "@/services/onboarding";

export default function MeetingStepPage() {
  return <MeetingStep bookingUrl={getStrategyMeetingUrl()} />;
}
