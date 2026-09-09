"use client";

import { useRouter } from "next/navigation";

import { useChat } from "@/components/features/agent/chat-provider";
import { FilesLibrary } from "@/components/features/files/files-library";
import type { FileSection } from "@/components/features/files/file-tree";
import type { Skill } from "@/components/features/files/skills-list";
import type { OpenDocument } from "@/services/files";

interface FilesLibraryRouteProps {
  title: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documents: readonly OpenDocument[];
}

/** Wires the library's "Send to chat" into a fresh thread on `/agent`. */
export function FilesLibraryRoute(props: FilesLibraryRouteProps) {
  const chat = useChat();
  const router = useRouter();

  return (
    <FilesLibrary
      {...props}
      onSendToChat={(resource) => {
        chat.reset();
        chat.attach(resource);
        router.push("/agent");
      }}
    />
  );
}
