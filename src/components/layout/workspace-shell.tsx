"use client";

import { cn } from "cn";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import {
  ChatProvider,
  NEW_THREAD_ID,
  type PreviewData,
  useChat,
} from "@/components/features/agent/chat-provider";
import type { ComposerPreview } from "@/components/features/agent/composer";
import { ProfileSelector } from "@/components/features/agent/profile-selector";
import {
  EditorTabStrip,
  type EditorTab,
} from "@/components/features/files/editor-tab-strip";
import type { FileSection } from "@/components/features/files/file-tree";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import type { Skill } from "@/components/features/files/skills-list";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import { AccountControls, type AccountUser } from "@/components/layout/account";
import { ChatColumn } from "@/components/layout/chat-column";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { type ChatPanelMode } from "@/components/layout/chat-context-panel";
import { ChatControls, ChatTitle } from "@/components/layout/chat-controls";
import { FilesPanel } from "@/components/layout/files-panel";
import { PageAsideHostProvider } from "@/components/layout/page-aside";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useResizable } from "@/lib/use-resizable";
import {
  Sidebar,
  SidebarExpandButton,
  type SidebarNavKey,
  type SidebarThread,
} from "@/components/layout/sidebar";
import { toTitle } from "@/lib/format";
import {
  COMPACT_QUERY,
  MOBILE_QUERY,
  useMediaQuery,
} from "@/lib/use-media-query";
import type {
  AgentMessage,
  ReplyIntent,
  ScriptedReply,
} from "@/services/agent";
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

const NAV_KEYS: readonly SidebarNavKey[] = [
  "agent",
  "calendar",
  "analytics",
  "files",
];

/** `/calendar` and `/agent/t1` both resolve to their nav item; `/settings` to none. */
function navKeyFor(pathname: string): SidebarNavKey | undefined {
  // The alternate agent landing is still the agent.
  if (pathname === "/landing-2") return "agent";
  // The alternate file manager is still Files.
  if (pathname === "/files-2") return "files";
  // The engagement analytics page is still Analytics.
  if (pathname === "/analytics-2") return "analytics";
  return NAV_KEYS.find(
    (key) => pathname === `/${key}` || pathname.startsWith(`/${key}/`),
  );
}

/** `/agent/t1` → `t1`. */
function threadIdFor(pathname: string): string | undefined {
  const [, base, threadId] = pathname.split("/");
  return base === "agent" ? threadId : undefined;
}

/**
 * Where the chat goes. It fills the page on `/agent`; beside the calendar and
 * analytics it is a column on the right; everywhere else it is put away.
 */
function chatColumnFor(pathname: string): ComposerPreview | undefined {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/analytics")) return "analytics";
  return undefined;
}

/** The first thing the user said, as a name for a thread that has none yet. */
function titleFrom(messages: readonly AgentMessage[]): string | undefined {
  for (const message of messages) {
    if (message.role !== "user") continue;
    for (const part of message.parts) {
      if (part.type === "text" && part.text.trim() !== "") {
        return toTitle(part.text, 40);
      }
    }
  }
  return undefined;
}

/** The header's right end swaps between the account and the chat's controls. */
const HEADER_SWAP = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: fade.fast,
} as const;

const WORKSPACE_TAB_ID = "workspace";

interface WorkspaceHeaderProps {
  collapsed: boolean;
  onExpand: () => void;
  /** Phone overlay is open; keeps the menu control in sync. */
  mobileNavOpen?: boolean;
  onOpenMobileNav?: () => void;
  profiles: readonly ProfileSummary[];
  selectedProfileIds: readonly string[];
  onSelectedIdsChange: (ids: readonly string[]) => void;
  compact: boolean;
  prefix: boolean;
  chatTitle?: string;
  chatThreads?: readonly SidebarThread[];
  currentThreadId?: string | null;
  onSelectThread?: (id: string) => void;
  chatOpen: boolean;
  /** Docked chat is an overlay; the header holds the way into it. */
  chatOverlay?: boolean;
  chatOverlayOpen?: boolean;
  onChatOverlayChange?: (open: boolean) => void;
  panel: ChatPanelMode | null;
  onPanelChange: (panel: ChatPanelMode | null) => void;
  user: AccountUser;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

/**
 * The page header row. On the left, the way out of the collapsed rail and
 * then which profiles the agent is posting as. On the right, the account.
 * With a conversation open the profiles shrink to their faces, its name
 * follows them, and its controls take the right. When the chat is docked
 * this row stays over the page so the column can take the full right side.
 * The space below the divider is `WorkspacePage`, not this row.
 */
function WorkspaceHeader({
  collapsed,
  onExpand,
  mobileNavOpen = false,
  onOpenMobileNav,
  profiles,
  selectedProfileIds,
  onSelectedIdsChange,
  compact,
  prefix,
  chatTitle,
  chatThreads,
  currentThreadId = null,
  onSelectThread,
  chatOpen,
  chatOverlay = false,
  chatOverlayOpen = false,
  onChatOverlayChange,
  panel,
  onPanelChange,
  user,
  onOpenSettings,
  onSignOut,
}: WorkspaceHeaderProps) {
  return (
    <div className="relative mt-m mb-m flex h-8 min-w-0 shrink-0 items-center gap-s px-l after:absolute after:inset-x-0 after:-bottom-m after:border-b after:border-imagine-border md:px-xxl">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Open menu"
        aria-expanded={mobileNavOpen}
        onClick={onOpenMobileNav}
        className="-ml-2.5 text-imagine-foreground-faint hover:text-imagine-foreground md:hidden"
      >
        <Icon name="sidebar" />
      </Button>
      <AnimatePresence initial={false}>
        {collapsed ? (
          <SidebarExpandButton
            key="expand"
            onExpand={onExpand}
            // Optically aligns the chevron with the page's text column.
            className="-ml-2.5 hidden md:flex"
          />
        ) : null}
      </AnimatePresence>
      {profiles.length > 0 ? (
        <ProfileSelector
          profiles={profiles}
          selectedIds={selectedProfileIds}
          onSelectedIdsChange={onSelectedIdsChange}
          compact={compact}
          {...(prefix ? {} : { prefix: false })}
          // First in the row, the faces sit on the page's text column;
          // after the expand chevron they take the row's gap instead.
          className={cn("min-w-0", !collapsed && "-ml-1.5")}
        />
      ) : null}
      <AnimatePresence initial={false}>
        {!chatOpen || chatTitle === undefined ? null : (
          <motion.div
            key="title"
            initial={{ opacity: 0, x: -8 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { ...fade.base, delay: 0.1 },
            }}
            exit={{ opacity: 0, x: -8, transition: fade.fast }}
            className="min-w-0"
          >
            <ChatTitle
              title={chatTitle}
              {...(chatThreads === undefined ? {} : { threads: chatThreads })}
              currentThreadId={currentThreadId}
              {...(onSelectThread === undefined ? {} : { onSelectThread })}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Both clusters end on the same glyph edge: the gear's or the
          panel toggle's, pulled in by the icon button's own padding. */}
      <AnimatePresence initial={false} mode="wait">
        {chatOpen ? (
          <motion.div
            key="chat"
            {...HEADER_SWAP}
            className="-mr-s ml-auto flex shrink-0"
          >
            <ChatControls panel={panel} onPanelChange={onPanelChange} />
          </motion.div>
        ) : (
          <motion.div
            key="account"
            {...HEADER_SWAP}
            className="-mr-s ml-auto flex shrink-0 items-center gap-xxs"
          >
            {chatOverlay ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={chatOverlayOpen ? "Hide chat" : "Open chat"}
                aria-pressed={chatOverlayOpen}
                onClick={() => {
                  onChatOverlayChange?.(!chatOverlayOpen);
                }}
                className={cn(
                  "xl:hidden",
                  chatOverlayOpen
                    ? "bg-imagine-surface-raised text-imagine-foreground"
                    : "text-imagine-foreground-muted hover:text-imagine-foreground",
                )}
              >
                <Icon name="message" />
              </Button>
            ) : null}
            <AccountControls
              user={user}
              onOpenSettings={onOpenSettings}
              onSignOut={onSignOut}
              compact={compact}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The inset every workspace page starts in, after the header divider. Pages
 * do not set their own top or side padding; this is the one frame.
 *
 * Padding lives on the scrollport, not the clip around it. `overflow-y-auto`
 * makes the inner box clip on x as well, and the landing composer sits flush
 * to that edge — its shadow and left radius disappear if the inset is outside.
 *
 * The side inset is `px-page`: the gutter on a laptop, and on a wide monitor
 * the space left over once the page is a centered `max-w-page` column. The
 * header above keeps its controls at the frame's edges, as chrome does. The
 * scrollport is the `frame` container so a page can ask whether it is running
 * narrower than the frame (`@page/frame`) and drop a bleed that no longer
 * reaches an edge.
 */
function WorkspacePage({
  children,
  overlay,
  flush = false,
}: {
  children: ReactNode;
  overlay?: ReactNode;
  /** Pane-based workspaces provide their own internal frame. */
  flush?: boolean;
}) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* File tabs sit in an overlay; this spacer keeps the thread from
          sliding under them. */}
      {overlay === undefined ? null : (
        <div aria-hidden="true" className="h-9 shrink-0" />
      )}
      <div
        className={cn(
          "@container/frame flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip overflow-y-auto",
          !flush && "px-page pt-l pb-l md:pt-xxl md:pb-xxl",
        )}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}

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
    defaultWidth: 320,
    min: 264,
    max: 520,
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
  const [railBeforeFiles, setRailBeforeFiles] = useState(false);
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

  useEffect(() => {
    if (isCompact) setCollapsed(true);
  }, [isCompact]);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isCompact) setChatOverlayOpen(false);
  }, [isCompact]);

  useEffect(() => {
    setMobileNavOpen(false);
    setChatOverlayOpen(false);
  }, [pathname]);

  function changePanel(next: ChatPanelMode | null) {
    if (next === "files" && panel !== "files") {
      setRailBeforeFiles(collapsed);
      setCollapsed(true);
    } else if (panel === "files" && next !== "files") {
      setCollapsed(railBeforeFiles);
    }
    setPanel(next);
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
    router.push(chat.messages.length === 0 ? "/landing-2" : "/agent");
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
  const editorTabs: readonly EditorTab[] = [
    { id: WORKSPACE_TAB_ID, label: "Current chat" },
    ...openDocumentIds.flatMap((id) => {
      const document = documents.find((candidate) => candidate.id === id);
      return document === undefined
        ? []
        : [
            {
              id,
              label: document.meta.title,
              closable: true,
              dirty:
                (documentValues[id] ?? document.value) !==
                (savedDocumentValues[id] ?? document.value),
            },
          ];
    }),
  ];
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
  const header = (
    <WorkspaceHeader
      collapsed={collapsed}
      onExpand={() => {
        setCollapsed(false);
      }}
      mobileNavOpen={mobileNavOpen}
      onOpenMobileNav={() => {
        setMobileNavOpen(true);
        setChatOverlayOpen(false);
      }}
      profiles={profiles}
      selectedProfileIds={selectedProfileIds}
      onSelectedIdsChange={setSelectedProfileIds}
      compact={chatOpen || isMobile}
      prefix={!docked && !isMobile}
      {...(chatTitle === undefined ? {} : { chatTitle })}
      chatThreads={visibleThreads}
      currentThreadId={chat.threadId}
      onSelectThread={openThread}
      chatOpen={chatOpen}
      chatOverlay={docked}
      chatOverlayOpen={chatOverlayOpen}
      onChatOverlayChange={(open) => {
        setChatOverlayOpen(open);
        if (open) setMobileNavOpen(false);
      }}
      panel={panel}
      onPanelChange={changePanel}
      user={user}
      onOpenSettings={() => {
        router.push("/settings");
      }}
      onSignOut={() => {
        // The mock has no session to end; leaving lands on sign-in.
        router.push("/sign-in");
      }}
    />
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
          )}
        </EditorTabStrip>
      </motion.div>
    );
  const page = (
    <WorkspacePage
      flush={activeKey === "files"}
      {...(editorLayer === null ? {} : { overlay: editorLayer })}
    >
      <PageAsideHostProvider host={asideHost}>{children}</PageAsideHostProvider>
    </WorkspacePage>
  );
  // `contents` on wide frames so the page rail is a flex item of the row.
  // Hidden below `xl` before JS hydrates, so a third column cannot crush
  // the page while the window is still being measured.
  const pageAside = <div ref={setAsideHost} className="hidden xl:contents" />;
  const overlayChat = docked && isCompact;
  const column =
    chatColumn === undefined ? null : (
      <ChatColumn
        key="chat"
        page={chatColumn}
        title={chatTitle ?? "New chat"}
        threads={visibleThreads}
        currentThreadId={chat.threadId}
        onSelectThread={openThread}
        overlay={overlayChat}
        fullWidth={isMobile}
        className={overlayChat ? undefined : "max-xl:hidden"}
        onClose={
          overlayChat
            ? () => {
                setChatOverlayOpen(false);
              }
            : undefined
        }
      />
    );
  const contextPanel =
    panel !== "files" ||
    chatTitle === undefined ||
    !(chatOpen || docked) ? null : (
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
        <FilesPanel
          width={filesResize.width}
          title={orgName}
          {...(orgLogoUrl === undefined ? {} : { logoUrl: orgLogoUrl })}
          sections={fileSections}
          skills={skills}
          dragHint
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
          onToggleSkill={(id, enabled) => {
            setSkills((current) =>
              current.map((skill) =>
                skill.id === id ? { ...skill, enabled } : skill,
              ),
            );
          }}
          onOpenSkillFile={openEditor}
          {...(activeEditorId === WORKSPACE_TAB_ID
            ? {}
            : { openSkillId: activeEditorId })}
          onClose={() => {
            changePanel(null);
          }}
        />
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
        changePanel(null);
        setMobileNavOpen(false);
        router.push(`/${key}`);
      }}
      onNewPost={() => {
        // Opens as a conversation at once, so the rail lists it as
        // "New chat" and the header carries the name.
        chat.startNew();
        changePanel(null);
        setMobileNavOpen(false);
        router.push("/landing-2");
      }}
      onOpenThread={(id) => {
        setMobileNavOpen(false);
        openThread(id);
      }}
    />
  );

  return (
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
                  changePanel(null);
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
  );
}
