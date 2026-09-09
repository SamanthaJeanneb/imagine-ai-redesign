import { FilesLibraryRoute } from "@/app/(workspace)/files-2/files-library-route";
import { getDocuments, getFileSections, getSkills } from "@/services/files";
import { getWorkspace } from "@/services/workspace";

export default function FilesLibraryPage() {
  const workspace = getWorkspace();

  return (
    <FilesLibraryRoute
      title={workspace.name}
      sections={getFileSections()}
      skills={getSkills()}
      documents={getDocuments()}
    />
  );
}
