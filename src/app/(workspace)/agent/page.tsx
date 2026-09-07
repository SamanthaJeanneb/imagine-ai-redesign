import { getCurrentUser } from "@/services/workspace";

/** Placeholder. The shell arrives in Phase 4 and the landing in Phase 5. */
export default function AgentPage() {
  const user = getCurrentUser();
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-s bg-imagine-background px-xl text-center">
      <h1 className="type-display">Welcome, {firstName}</h1>
      <p className="type-body text-imagine-foreground-muted">
        Your workspace opens here.
      </p>
    </main>
  );
}
