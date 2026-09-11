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

/** Wires "Send to chat" into the centered new-chat experience. */
export function FilesLibraryRoute(props: FilesLibraryRouteProps) {
  const chat = useChat();
  const router = useRouter();

  return (
    <FilesLibrary
      {...props}
      onSendToChat={(resource) => {
        chat.startNew();
        chat.attach(resource);
        router.push("/landing-2");
      }}
    />
  );
}
