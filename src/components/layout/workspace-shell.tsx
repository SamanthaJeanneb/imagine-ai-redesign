"use client";

import { cn } from "cn";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import {
  ChatProvider,
  NEW_THREAD_ID,
  type PreviewData,
  useChat,
} from "@/components/features/agent/chat-provider";
import {
  ProfileSelector,
  ProfileSelectorLabel,
  ProfileSelectorPrefix,
} from "@/components/features/agent/profile-selector";
import {
  EditorSheetInset,
  EditorTabStrip,
  type EditorTab,
} from "@/components/features/files/editor-tab-strip";
import {
  ChatFileTree,
  type FileSection,
} from "@/components/features/files/file-tree";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import {
  AccountControls,
  AccountName,
  type AccountUser,
} from "@/components/layout/account";
import {
  DockedChatColumn,
  OverlayChatColumn,
  SheetChatColumn,
} from "@/components/layout/chat-column";
import { type ChatPanelMode } from "@/components/layout/chat-context-panel";
import {
  ChatControls,
  ChatHistoryMenu,
  ChatTitle,
} from "@/components/layout/chat-controls";
import {
  FilesPanelApiProvider,
  FilesPanelCloseButton,
  FilesPanelDragHint,
  FilesPanelFiles,
  FilesPanelFrame,
  FilesPanelHeader,
  FilesPanelSearch,
  FilesPanelSkills,
  FilesPanelTabs,
} from "@/components/layout/files-panel";
import { PageAsideHostProvider } from "@/components/layout/page-aside";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useResizable } from "@/lib/use-resizable";
import {
  Sidebar,
  SidebarExpandButton,
  type SidebarThread,
} from "@/components/layout/sidebar";
import {
  ChatOverlayToggle,
  MobileNavButton,
  WorkspaceHeaderBar,
  WorkspaceHeaderEnd,
  WorkspaceHeaderTitle,
} from "@/components/layout/workspace-header";
import {
  WorkspaceFlushPage,
  WorkspaceInsetPage,
} from "@/components/layout/workspace-page-frame";
import {
  chatColumnFor,
  navKeyFor,
  threadIdFor,
  titleFrom,
} from "@/components/layout/workspace-routes";
import {
  COMPACT_QUERY,
  MOBILE_QUERY,
  useMediaQuery,
} from "@/lib/use-media-query";
import type { ReplyIntent, ScriptedReply } from "@/services/agent";
import type { OpenDocument } from "@/services/files";
import { fade } from "@/styles/motion";

interface WorkspaceShellProps {
  orgName: string;
  orgLogoUrl?: string;
  threads: readonly SidebarThread[];
  user: AccountUser;
  /** The LinkedIn identities the agent can work across. */
  profiles: readonly ProfileSummary[];
  /** Files available to the thread's right panel. */
  fileSections: readonly FileSection[];
  /** Skills appear beside files and open as editable markdown. */
  skills: readonly Skill[];
  /** Every workspace and skill document the editor can open. */
  documents: readonly OpenDocument[];
  /** The agent's scripted answers, for the conversation the shell owns. */
  replies: Record<ReplyIntent, ScriptedReply>;
  /** What the composer's Calendar and Analytics chips open. */
  previews: PreviewData;
  children: ReactNode;
}

const WORKSPACE_TAB_ID = "workspace";

/**
 * The signed-in shell: rail on the background, page on a surface that rounds
 * into it. Everything lives in one `LayoutGroup` so shared `layoutId`s survive
 * a route change, which is what lets the chat move between columns. The
 * conversation is owned here, above the pages, for the same reason.
 */
export function WorkspaceShell({
  replies,
  previews,
  children,
  ...frame
}: WorkspaceShellProps) {
  return (
    <ChatProvider replies={replies} previews={previews}>
      <WorkspaceFrame {...frame}>{children}</WorkspaceFrame>
    </ChatProvider>
  );
}

function WorkspaceFrame({
  orgName,
  orgLogoUrl,
  threads,
  user,
  profiles,
  fileSections,
  skills: initialSkills,
  documents,
  children,
}: Omit<WorkspaceShellProps, "replies" | "previews">) {
  const pathname = usePathname();
  const router = useRouter();
  const chat = useChat();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);
  // Where a page's own sidebar goes, beside the page. A ref callback into
  // state, so the page can portal into it once it exists.
  const [asideHost, setAsideHost] = useState<HTMLElement | null>(null);
  const filesResize = useResizable({
    defaultWidth: 400,
    min: 264,
    max: 560,
    edge: "start",
  });
  // Everyone still connected, to start. Disconnected profiles need connecting
  // before the agent can post as them, so they wait to be chosen on purpose.
  const [selectedProfileIds, setSelectedProfileIds] = useState<
    readonly string[]
  >(() =>
    profiles
      .filter((profile) => profile.status === "connected")
      .map((profile) => profile.id),
  );
  const activeKey = navKeyFor(pathname);
  // A conversation started here is not stored, so the rail would not know it.
  // It gets a row of its own, named "New chat" until the first message.
  const newThreadTitle =
    chat.threadId === NEW_THREAD_ID
      ? (titleFrom(chat.messages) ?? "New chat")
      : undefined;
  const visibleThreads: readonly SidebarThread[] =
    newThreadTitle === undefined
      ? threads
      : [{ id: NEW_THREAD_ID, title: newThreadTitle }, ...threads];
  const activeThreadId =
    activeKey === "agent" && newThreadTitle !== undefined
      ? NEW_THREAD_ID
      : threadIdFor(pathname);
  // The rail highlights one thing. With the new chat selected under Chats,
  // Agent above it stays quiet; `activeKey` still drives the page itself.
  const navActive = activeThreadId === NEW_THREAD_ID ? undefined : activeKey;
  const chatColumn = chatColumnFor(pathname);
  const docked = chatColumn !== undefined;
  const [panel, setPanel] = useState<ChatPanelMode | null>(null);
  const [railBefore, setRailBefore] = useState(false);
  const [skills, setSkills] = useState(initialSkills);
  const [activeFileId, setActiveFileId] = useState<string>();
  const [openDocumentIds, setOpenDocumentIds] = useState<readonly string[]>([]);
  const [activeEditorId, setActiveEditorId] = useState(WORKSPACE_TAB_ID);
  const [documentValues, setDocumentValues] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        documents.map((document) => [document.id, document.value]),
      ),
  );
  const [savedDocumentValues, setSavedDocumentValues] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      documents.map((document) => [document.id, document.value]),
    ),
  );

  // Frame and route changes reset what they made room for. Adjusted during
  // render against the last seen value, so there is no frame in between.
  const [seenCompact, setSeenCompact] = useState(isCompact);
  if (isCompact !== seenCompact) {
    setSeenCompact(isCompact);
    if (isCompact) setCollapsed(true);
    else setChatOverlayOpen(false);
  }
  const [seenMobile, setSeenMobile] = useState(isMobile);
  if (isMobile !== seenMobile) {
    setSeenMobile(isMobile);
    if (!isMobile) setMobileNavOpen(false);
  }
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    setMobileNavOpen(false);
    setChatOverlayOpen(false);
  }

  // The calendar and the files panel both need the full width, so either can
  // tuck the rail away. They share one memory of how the reader had it, taken
  // on the way in and given back only once neither still wants the width: with
  // a memory each, leaving the calendar with the files panel open would hand
  // the panel the calendar's own collapsed rail and leave it stuck shut.
  const railTaken = pathname.startsWith("/calendar") || panel === "files";
  const [seenRailTaken, setSeenRailTaken] = useState(railTaken);
  if (railTaken !== seenRailTaken) {
    setSeenRailTaken(railTaken);
    if (railTaken) {
      setRailBefore(collapsed);
      setCollapsed(true);
    } else {
      setCollapsed(railBefore);
    }
  }

  /**
   * Show a thread from the rail or the title's history. The new one has no
   * page of its own: empty, it is the landing; with messages, the thread on
   * `/agent`, whose URL then settles on its own.
   */
  function openThread(id: string) {
    chat.setPreview(null);
    if (id !== NEW_THREAD_ID) {
      router.push(`/agent/${id}`);
      return;
    }
    if (activeKey === "agent") return;
    router.push(chat.messages.length === 0 ? "/new-chat" : "/agent");
  }

  function openEditor(id: string) {
    if (!documents.some((document) => document.id === id)) return;
    setActiveFileId(id);
    setOpenDocumentIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setActiveEditorId(id);
  }

  function closeEditor(id: string) {
    setOpenDocumentIds((current) => current.filter((open) => open !== id));
    if (activeEditorId === id) setActiveEditorId(WORKSPACE_TAB_ID);
  }

  const activeDocument =
    activeEditorId === WORKSPACE_TAB_ID
      ? undefined
      : documents.find((document) => document.id === activeEditorId);
  const editorTabs: readonly EditorTab[] = openDocumentIds.flatMap((id) => {
    const document = documents.find((candidate) => candidate.id === id);
    return document === undefined
      ? []
      : [
          {
            id,
            label: document.meta.title,
            dirty:
              (documentValues[id] ?? document.value) !==
              (savedDocumentValues[id] ?? document.value),
          },
        ];
  });
  const attachedAssetId = chat.attached
    .flatMap((item) => (item.kind === "asset" ? [item.asset.id] : []))
    .at(-1);

  // On the agent page with a conversation open, the header belongs to the
  // thread: its name in the middle, its controls on the right. Beside the
  // calendar and analytics the chat takes the right side instead, so the
  // page header keeps the account and drops "Posting as".
  const chatOpen = activeKey === "agent" && chat.threadId !== null;
  const chatTitle =
    chat.threadId !== null
      ? (threads.find((thread) => thread.id === chat.threadId)?.title ??
        titleFrom(chat.messages) ??
        "New chat")
      : docked
        ? "New chat"
        : undefined;
  const compactProfiles = chatOpen || isMobile;
  const showPostingAs = !docked && !isMobile;
  const header = (
    <WorkspaceHeaderBar>
      <MobileNavButton
        open={mobileNavOpen}
        onClick={() => {
          setMobileNavOpen(true);
          setChatOverlayOpen(false);
        }}
      />
      <AnimatePresence initial={false}>
        {collapsed ? (
          <SidebarExpandButton
            key="expand"
            onExpand={() => {
              setCollapsed(false);
            }}
            // Optically aligns the chevron with the page's text column.
            className="-ml-2.5 hidden md:flex"
          />
        ) : null}
      </AnimatePresence>
      {profiles.length > 0 ? (
        <ProfileSelector
          profiles={profiles}
          selectedIds={selectedProfileIds}
          onSelectedIdsChange={setSelectedProfileIds}
          // First in the row, the faces sit on the page's text column;
          // after the expand chevron they take the row's gap instead.
          className={cn("min-w-0", !collapsed && "-ml-1.5")}
        >
          {/* With a conversation open the faces stand alone and its name
              follows them. Beside the calendar and analytics the chat has
              its own column, so the header drops "Posting as". */}
          {compactProfiles ? null : (
            <ProfileSelectorLabel key="label">
              {showPostingAs ? <ProfileSelectorPrefix key="prefix" /> : null}
            </ProfileSelectorLabel>
          )}
        </ProfileSelector>
      ) : null}
      <AnimatePresence initial={false}>
        {chatOpen && chatTitle !== undefined ? (
          <WorkspaceHeaderTitle key="title">
            <ChatTitle title={chatTitle}>
              <ChatHistoryMenu
                title={chatTitle}
                threads={visibleThreads}
                currentThreadId={chat.threadId}
                onSelectThread={openThread}
              />
            </ChatTitle>
          </WorkspaceHeaderTitle>
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false} mode="wait">
        {chatOpen ? (
          <WorkspaceHeaderEnd key="chat">
            <ChatControls panel={panel} onPanelChange={setPanel} />
          </WorkspaceHeaderEnd>
        ) : (
          <WorkspaceHeaderEnd key="account" className="items-center gap-xxs">
            {docked ? (
              <ChatOverlayToggle
                open={chatOverlayOpen}
                onOpenChange={(open) => {
                  setChatOverlayOpen(open);
                  if (open) setMobileNavOpen(false);
                }}
              />
            ) : null}
            <AccountControls
              user={user}
              onOpenSettings={() => {
                router.push("/settings");
              }}
              onSignOut={() => {
                // The mock has no session to end; leaving lands on sign-in.
                router.push("/sign-in");
              }}
            >
              {compactProfiles ? null : <AccountName />}
            </AccountControls>
          </WorkspaceHeaderEnd>
        )}
      </AnimatePresence>
    </WorkspaceHeaderBar>
  );
  const editorLayer =
    activeKey !== "agent" || openDocumentIds.length === 0 ? null : (
      <motion.div
        key="workspace-editor"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={fade.fast}
        data-slot="workspace-editor"
        className={cn(
          // The page's own inset, so the tab strip lines up with the column.
          "pointer-events-none absolute inset-x-0 top-0 z-20 px-page",
          activeDocument !== undefined && "bg-imagine-surface",
          activeDocument !== undefined &&
            (chat.attached.length === 0 ? "bottom-28" : "bottom-48"),
        )}
      >
        <EditorTabStrip
          home={{ id: WORKSPACE_TAB_ID, label: "Current chat" }}
          tabs={editorTabs}
          activeId={activeEditorId}
          onActivate={setActiveEditorId}
          onClose={closeEditor}
          className={cn(
            "pointer-events-auto",
            activeDocument !== undefined && "h-full",
          )}
        >
          {activeDocument === undefined ? null : (
            <EditorSheetInset>
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeDocument.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={fade.fast}
                  className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto"
                >
                  <MarkdownEditor
                    meta={activeDocument.meta}
                    value={
                      documentValues[activeDocument.id] ?? activeDocument.value
                    }
                    savedValue={
                      savedDocumentValues[activeDocument.id] ??
                      activeDocument.value
                    }
                    onValueChange={(value) => {
                      setDocumentValues((current) => ({
                        ...current,
                        [activeDocument.id]: value,
                      }));
                    }}
                    onSave={() => {
                      setSavedDocumentValues((current) => ({
                        ...current,
                        [activeDocument.id]:
                          documentValues[activeDocument.id] ??
                          activeDocument.value,
                      }));
                    }}
                    className="mx-auto p-xxl"
                  />
                </motion.div>
              </AnimatePresence>
            </EditorSheetInset>
          )}
        </EditorTabStrip>
      </motion.div>
    );
  const pageContent = (
    <PageAsideHostProvider host={asideHost}>{children}</PageAsideHostProvider>
  );
  const page =
    activeKey === "files" || activeKey === "calendar" ? (
      <WorkspaceFlushPage
        {...(editorLayer === null ? {} : { overlay: editorLayer })}
      >
        {pageContent}
      </WorkspaceFlushPage>
    ) : (
      <WorkspaceInsetPage
        {...(editorLayer === null ? {} : { overlay: editorLayer })}
      >
        {pageContent}
      </WorkspaceInsetPage>
    );
  // `contents` on wide frames so the page rail is a flex item of the row.
  // Hidden below `xl` before JS hydrates, so a third column cannot crush
  // the page while the window is still being measured.
  const pageAside = <div ref={setAsideHost} className="hidden xl:contents" />;
  const overlayChat = docked && isCompact;
  const columnContent =
    chatColumn === undefined
      ? undefined
      : {
          page: chatColumn,
          title: chatTitle ?? "New chat",
          threads: visibleThreads,
          currentThreadId: chat.threadId,
          onSelectThread: openThread,
        };
  const closeChatOverlay = () => {
    setChatOverlayOpen(false);
  };
  const column =
    columnContent === undefined ? null : isMobile ? (
      <SheetChatColumn
        key="chat"
        {...columnContent}
        onClose={closeChatOverlay}
      />
    ) : overlayChat ? (
      <OverlayChatColumn
        key="chat"
        {...columnContent}
        onClose={closeChatOverlay}
      />
    ) : (
      <DockedChatColumn
        key="chat"
        {...columnContent}
        className="max-xl:hidden"
      />
    );
  const contextPanel =
    panel !== "files" || !(activeKey === "agent" || docked) ? null : (
      <motion.div
        key="files-panel"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: filesResize.width, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={filesResize.transition}
        className="relative flex min-h-0 shrink-0 justify-end overflow-hidden border-l border-imagine-border"
      >
        <ResizeHandle
          edge="start"
          binding={filesResize.handle}
          dragging={filesResize.dragging}
          label="Resize files"
        />
        <FilesPanelFrame width={filesResize.width}>
          <FilesPanelHeader
            title={orgName}
            {...(orgLogoUrl === undefined ? {} : { logoUrl: orgLogoUrl })}
          >
            <FilesPanelCloseButton
              onPress={() => {
                setPanel(null);
              }}
            />
          </FilesPanelHeader>
          <FilesPanelSearch
            sections={fileSections}
            skills={skills}
            onOpenFile={setActiveFileId}
            onOpenAsset={(asset) => {
              chat.attach({ kind: "asset", asset });
            }}
            onOpenSkillFile={openEditor}
          />
          <FilesPanelTabs>
            <FilesPanelFiles>
              <ChatFileTree
                sections={fileSections}
                {...(activeFileId === undefined ? {} : { activeFileId })}
                {...(attachedAssetId === undefined
                  ? {}
                  : { activeAssetId: attachedAssetId })}
                onOpenFile={setActiveFileId}
                onEditFile={openEditor}
                onAttachFile={(file) => {
                  setActiveFileId(file.id);
                  chat.attach({ kind: "file", file });
                }}
                onOpenAsset={(asset) => {
                  chat.attach({ kind: "asset", asset });
                }}
              />
            </FilesPanelFiles>
            <FilesPanelSkills>
              <SkillsList
                skills={skills}
                {...(activeEditorId === WORKSPACE_TAB_ID
                  ? {}
                  : { openSkillId: activeEditorId })}
                onToggle={(id, enabled) => {
                  setSkills((current) =>
                    current.map((skill) =>
                      skill.id === id ? { ...skill, enabled } : skill,
                    ),
                  );
                }}
                onOpenFile={openEditor}
              />
            </FilesPanelSkills>
          </FilesPanelTabs>
          <FilesPanelDragHint />
        </FilesPanelFrame>
      </motion.div>
    );

  const showChatInFlow = column !== null && !overlayChat;
  const showChatOverlay = overlayChat && chatOverlayOpen;
  const overlayPanels = isCompact && !overlayChat;
  const inFlowPanels = !isCompact;
  const sidebar = (
    <Sidebar
      orgName={orgName}
      {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
      {...(navActive === undefined ? {} : { active: navActive })}
      {...(activeThreadId === undefined ? {} : { activeThreadId })}
      threads={visibleThreads}
      collapsed={isMobile ? false : collapsed}
      onCollapsedChange={isMobile ? undefined : setCollapsed}
      onNavigate={(key) => {
        // A preview left open would follow the chat into its column.
        chat.setPreview(null);
        setPanel(null);
        setMobileNavOpen(false);
        router.push(`/${key}`);
      }}
      onNewPost={() => {
        // Opens as a conversation at once, so the rail lists it as
        // "New chat" and the header carries the name.
        chat.startNew();
        setPanel(null);
        setMobileNavOpen(false);
        router.push("/new-chat");
      }}
      onOpenThread={(id) => {
        setMobileNavOpen(false);
        openThread(id);
      }}
    />
  );

  return (
    <FilesPanelApiProvider
      open={() => {
        setPanel("files");
      }}
      close={() => {
        setPanel(null);
      }}
    >
      <LayoutGroup>
        <div className="flex h-dvh overflow-hidden bg-imagine-background">
          <div
            className={cn(
              isMobile && mobileNavOpen
                ? "fixed inset-0 z-50 flex bg-imagine-foreground/10"
                : "hidden h-full md:flex",
            )}
            onClick={
              isMobile && mobileNavOpen
                ? () => {
                    setMobileNavOpen(false);
                  }
                : undefined
            }
          >
            <div
              className="h-full"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {sidebar}
            </div>
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col rounded-none bg-imagine-surface shadow-raised md:rounded-l-surface">
            {docked ? (
              <div className="flex min-h-0 min-w-0 flex-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {header}
                  {page}
                </div>
                {pageAside}
                {showChatInFlow ? (
                  <AnimatePresence initial={false}>{column}</AnimatePresence>
                ) : null}
                {inFlowPanels ? (
                  <AnimatePresence initial={false}>
                    {contextPanel}
                  </AnimatePresence>
                ) : null}
              </div>
            ) : (
              <>
                {header}
                <div className="relative flex min-h-0 min-w-0 flex-1">
                  {page}
                  {pageAside}
                  {showChatInFlow ? (
                    <AnimatePresence initial={false}>{column}</AnimatePresence>
                  ) : null}
                  {inFlowPanels ? (
                    <AnimatePresence initial={false}>
                      {contextPanel}
                    </AnimatePresence>
                  ) : null}
                </div>
              </>
            )}
            <AnimatePresence initial={false}>
              {showChatOverlay ? (
                <motion.div
                  key="chat-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade.fast}
                  className="absolute inset-0 z-40 flex justify-end bg-imagine-foreground/10"
                  onClick={() => {
                    setChatOverlayOpen(false);
                  }}
                >
                  <div
                    className="flex h-full max-w-full"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    {isMobile && contextPanel !== null ? (
                      contextPanel
                    ) : (
                      <>
                        {column}
                        {contextPanel}
                      </>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {overlayPanels && contextPanel !== null ? (
                <motion.div
                  key="panel-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade.fast}
                  className="absolute inset-0 z-40 flex justify-end bg-imagine-foreground/10"
                  onClick={() => {
                    setPanel(null);
                  }}
                >
                  <div
                    className="flex h-full max-w-full"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    {contextPanel}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </LayoutGroup>
    </FilesPanelApiProvider>
  );
}
