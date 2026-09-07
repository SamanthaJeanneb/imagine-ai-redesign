import { notFound } from "next/navigation";

import { Kit } from "../kit/kit";

import { RadiusScope } from "./radius-scope";

/** Same kit, tighter radius. Development only. */
export default function KitSharpPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute("data-radius","sharp")`,
        }}
      />
      <RadiusScope />
      <Kit radiusScale="sharp" />
    </>
  );
}
