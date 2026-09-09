/** One mock round trip, so a pending state has a moment to show. */
export const MOCK_LATENCY = 600;

export function wait(ms: number = MOCK_LATENCY): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
