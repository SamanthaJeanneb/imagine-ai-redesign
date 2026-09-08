import { FilesWorkspacePage } from "@/components/features/files/files-workspace-page";
import { getDocuments, getFileSections, getSkills } from "@/services/files";
import { getWorkspace } from "@/services/workspace";

export default function FilesPage() {
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
