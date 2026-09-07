import { notFound } from "next/navigation";

import { Kit } from "./kit";

/** Design-system review. Development only. */
export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <Kit />;
}
