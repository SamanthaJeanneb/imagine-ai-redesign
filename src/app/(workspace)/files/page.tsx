import { FilesLibraryRoute } from "@/app/(workspace)/files/files-library-route";
import { getDocuments, getFileSections, getSkills } from "@/services/files";
import { getWorkspace } from "@/services/workspace";

/** The Files workspace: the library with its own sidebar. */
export default function FilesPage() {
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
