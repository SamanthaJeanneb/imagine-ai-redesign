"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  ProfileDetail,
  type ProfileDetailData,
} from "@/components/features/settings/profile-detail";
import {
  ProfileList,
  type ProfileSummary,
} from "@/components/features/settings/profile-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { wait } from "@/lib/wait";
import { fade } from "@/styles/motion";

/**
 * The detail pane's edges. Wide, it is the page's own corner: square where it
 * meets the page's right and bottom edges, the surface radius where the white
 * curves into it, and the page inset as its padding.
 */
const PANE = "lg:rounded-none lg:rounded-tl-surface lg:p-xxl";

interface ProfilesSettingsProps {
  profiles: readonly ProfileSummary[];
  details: Record<string, ProfileDetailData>;
}

/** "linkedin.com/in/jane-doe" → "Jane Doe"; "/company/acme-labs" → "Acme Labs". */
function nameFromLinkedInUrl(url: string): string {
  const slug =
    url
      .replace(/\/+$/, "")
      .split("/")
      .filter((part) => part !== "")
      .at(-1) ?? "";
  const words = slug
    .split(/[-_.]+/)
    .filter((part) => part !== "" && !/^\d+$/.test(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return words.length === 0 ? "New profile" : words.join(" ");
}

interface AddProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string) => void;
}

function AddProfileDialog({
  open,
  onOpenChange,
  onAdd,
}: AddProfileDialogProps) {
  const [url, setUrl] = useState("");
  const valid = url.includes("linkedin.com/");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setUrl("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-l"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            onAdd(url.trim());
            onOpenChange(false);
            setUrl("");
          }}
        >
          <DialogHeader>
            <DialogTitle>Add a profile</DialogTitle>
            <DialogDescription>
              A person or a company page the agent should post as. They connect
              LinkedIn themselves afterward.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="profile-url">LinkedIn address</FieldLabel>
            <Input
              id="profile-url"
              autoFocus
              autoComplete="off"
              placeholder="linkedin.com/in/"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
              }}
            />
            <FieldDescription>
              Company pages use linkedin.com/company/.
            </FieldDescription>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Add profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Settings, Profiles. The list of LinkedIn identities with a detail pane that
 * follows the selection. Every action changes what is on screen: reconnecting
 * turns the status, indexing updates the count, removing closes the row and
 * the pane moves to its neighbor.
 */
export function ProfilesSettings({
  profiles: initialProfiles,
  details: initialDetails,
}: ProfilesSettingsProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [details, setDetails] = useState(initialDetails);
  const [selectedId, setSelectedId] = useState(initialProfiles[0]?.id);
  const [adding, setAdding] = useState(false);
  const [indexing, startIndexing] = useTransition();
  const selected = selectedId === undefined ? undefined : details[selectedId];

  function patch(id: string, change: Partial<ProfileDetailData>) {
    setDetails((current) => {
      const detail = current[id];
      return detail === undefined
        ? current
        : { ...current, [id]: { ...detail, ...change } };
    });
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === id
          ? {
              ...profile,
              ...(change.name === undefined ? {} : { name: change.name }),
              ...(change.status === undefined ? {} : { status: change.status }),
              ...(change.headline === undefined
                ? {}
                : { headline: change.headline }),
            }
          : profile,
      ),
    );
  }

  return (
    <div className="grid min-h-0 min-w-0 flex-1 gap-xl lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ProfileList
        profiles={profiles}
        {...(selectedId === undefined ? {} : { selectedId })}
        onSelect={setSelectedId}
        onAdd={() => {
          setAdding(true);
        }}
      />
      {/* Wide: the pane bleeds out of its grid area to the page's right and
          bottom edges and up to the tab strip's rule (the layout's gap), so
          the white curves into its grey right under the tabs. */}
      <div className="relative min-h-0 lg:-mt-xl lg:-mr-xxl lg:-mb-xxl">
        <AnimatePresence mode="wait" initial={false}>
          {selected === undefined ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.base}
              className={cn(
                "flex h-full min-h-64 flex-col items-center justify-center gap-m rounded-panel bg-imagine-surface-raised p-l text-center",
                PANE,
              )}
            >
              <Icon
                name="user"
                size="xl"
                className="text-imagine-foreground-faint"
              />
              <p className="type-small text-imagine-foreground-muted">
                Add a profile to get started.
              </p>
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  setAdding(true);
                }}
              >
                <Icon name="plus" size="s" data-icon="inline-start" />
                Add profile
              </Button>
            </motion.div>
          ) : (
            <ProfileDetail
              // One instance across selections: it cross-fades between
              // profiles itself. Only the empty state swaps in and out.
              key="detail"
              className={PANE}
              profile={selected}
              indexing={indexing}
              onReconnect={() => {
                patch(selected.id, { status: "connected" });
                toast.success(`${selected.name} reconnected`);
              }}
              {...(selected.kind === "person"
                ? {
                    onChangeCompany: () => {
                      patch(selected.id, { company: undefined });
                    },
                    onLinkCompany: (url: string) => {
                      const trimmed = url
                        .replace(/^https?:\/\/(www\.)?/, "")
                        .replace(/\/+$/, "");
                      patch(selected.id, {
                        company: {
                          name: nameFromLinkedInUrl(trimmed),
                          url: trimmed,
                        },
                      });
                    },
                  }
                : {})}
              onViewPersona={() => {
                router.push("/files");
              }}
              onIndexPosts={() => {
                const id = selected.id;
                startIndexing(async () => {
                  await wait(1200);
                  const count = details[id]?.postsIndexed ?? 0;
                  patch(id, { postsIndexed: count });
                  toast.success(
                    count === 0
                      ? "Nothing new to index"
                      : `${String(count)} posts up to date`,
                  );
                });
              }}
              onRemove={() => {
                const index = profiles.findIndex(
                  (profile) => profile.id === selected.id,
                );
                const remaining = profiles.filter(
                  (profile) => profile.id !== selected.id,
                );
                setProfiles(remaining);
                setSelectedId((remaining[index] ?? remaining[index - 1])?.id);
                toast(`Removed ${selected.name}`);
              }}
            />
          )}
        </AnimatePresence>
      </div>
      <AddProfileDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={(url) => {
          const address = url
            .replace(/^https?:\/\/(www\.)?/, "")
            .replace(/\/+$/, "");
          const kind = address.includes("/company/") ? "company" : "person";
          const id = `new-${address}`;
          const name = nameFromLinkedInUrl(address);
          const summary: ProfileSummary = {
            id,
            name,
            headline: kind === "company" ? "Company page" : "Not connected yet",
            kind,
            status: "disconnected",
          };
          setProfiles((current) => [...current, summary]);
          setDetails((current) => ({
            ...current,
            [id]: {
              id,
              name,
              headline: summary.headline,
              kind,
              status: "disconnected",
              postsIndexed: 0,
            },
          }));
          setSelectedId(id);
          toast.success(`${name} added. Connect LinkedIn to start posting.`);
        }}
      />
    </div>
  );
}
