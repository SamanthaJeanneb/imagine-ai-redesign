import { Kit } from "../kit/kit";

import { RadiusScope } from "./radius-scope";

/** Same kit, tighter radius. Deployed alongside `/dev/kit`. */
export default function KitSharpPage() {
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
