import { FilesWorkspacePage } from "@/components/features/files/files-workspace-page";
import { getDocuments, getFileSections, getSkills } from "@/services/files";
import { getWorkspace } from "@/services/workspace";

/** The earlier Files layout: tree on the left, editor beside it. */
export default function FilesWorkspaceRoute() {
  const workspace = getWorkspace();

  return (
    <FilesWorkspacePage
      title={workspace.name}
      {...(workspace.logoUrl === undefined
        ? {}
        : { logoUrl: workspace.logoUrl })}
      sections={getFileSections()}
      skills={getSkills()}
      documents={getDocuments()}
    />
  );
}
