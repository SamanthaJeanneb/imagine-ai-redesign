import { redirect } from "next/navigation";

/** The earlier sign-in URL; the current page lives at `/sign-in`. */
export default function SignIn2Page() {
  redirect("/sign-in");
}
