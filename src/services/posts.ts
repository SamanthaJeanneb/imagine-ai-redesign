import type {
  LinkedInPostContent,
  PostAuthor,
} from "@/components/features/agent/linkedin-post-draft";
import type {
  PostChipData,
  PostEngagement,
  PostEngagementPerson,
} from "@/components/features/calendar/post-chip";
import type { AssetTileData } from "@/components/features/files/asset-tile";
import { type Asset, getAssetType, transformAssetRow } from "@/entities/asset";
import { type Client, transformClientRow } from "@/entities/client";
import {
  transformEngagementCommentRow,
  transformEngagementProfileRow,
  transformEngagementReactionRow,
} from "@/entities/engagement";
import { type Post, toChipStatus, transformPostRow } from "@/entities/post";
import { formatRelative, formatTime, toTitle } from "@/lib/format";
import { getDb, getNow } from "@/mocks/db";

/**
 * Shared mapping from posts, clients, and assets onto the shapes the post
 * components take. Calendar, analytics, and the agent thread all render the same
 * post, so they all come through here.
 */

export function getPosts(): readonly Post[] {
  return getDb().app.client_posts.map(transformPostRow);
}

export function indexClients(): ReadonlyMap<string, Client> {
  return new Map(
    getDb().app.clients.map((row) => {
      const client = transformClientRow(row);
      return [client.id, client];
    }),
  );
}

/** Keyed the way `client_posts.media` points at storage. */
export function indexAssetsByPath(): ReadonlyMap<string, Asset> {
  return new Map(
    getDb().app.assets.map((row) => {
      const asset = transformAssetRow(row);
      return [`${asset.bucket}/${asset.path}`, asset];
    }),
  );
}

/** Everything an editor can pick from when adding media to a post. */
export function getAssetLibrary(): readonly AssetTileData[] {
  return getDb().app.assets.map((row) => toAssetTile(transformAssetRow(row)));
}

export function getClientAssets(clientId: string): readonly Asset[] {
  return getDb()
    .app.assets.filter((row) => row.client_id === clientId)
    .map(transformAssetRow);
}

const EXAMPLE_ASSET_SRC: Record<string, string> = {
  ast_01:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=85",
  ast_02:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=85",
  ast_03:
    "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=85",
  ast_04:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=85",
  ast_05:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=85",
  ast_06:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=85",
  ast_07:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=85",
  ast_08:
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=85",
  ast_09:
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=85",
  ast_10:
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=85",
  ast_11:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=85",
  ast_12:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=85",
};

/**
 * Representative media keeps the static prototype useful. A real client
 * would replace these with signed URLs for `bucket` + `path`.
 */
export function toAssetTile(asset: Asset): AssetTileData {
  return {
    id: asset.id,
    kind: getAssetType(asset),
    ...(EXAMPLE_ASSET_SRC[asset.id] === undefined
      ? {}
      : { src: EXAMPLE_ASSET_SRC[asset.id] }),
    ...(asset.caption === null ? {} : { caption: asset.caption }),
    ...(asset.usedCount > 0 ? { inUse: true } : {}),
  };
}

export function toAuthor(client: Client): PostAuthor {
  return {
    name: client.name,
    headline: client.description ?? (client.isCompany ? "Company page" : ""),
    kind: client.isCompany ? "company" : "person",
    ...(client.profilePicturePath === null
      ? {}
      : { avatarUrl: client.profilePicturePath }),
  };
}

/** "Acme" for a page, "Sarah" for a person. The calendar chip has one line. */
function toProfileLabel(client: Client): string {
  if (client.isCompany) return client.name;
  return client.name.split(" ", 1)[0] ?? client.name;
}

/** The chip's label, when the post has one. Color comes from status. */
function toPostLabel(post: Post): Pick<PostChipData, "label"> {
  if (post.postLabel === null) return {};
  return { label: post.postLabel };
}

function toEngagementPerson(
  profile: ReturnType<typeof transformEngagementProfileRow>,
): PostEngagementPerson {
  return {
    id: profile.id,
    name: profile.name,
    headline: profile.headline,
    ...(profile.avatarUrl === null ? {} : { avatarUrl: profile.avatarUrl }),
  };
}

function toPostEngagement(postId: string): PostEngagement {
  const db = getDb().app;
  const profiles = new Map(
    db.engagement_profiles.map((row) => {
      const profile = transformEngagementProfileRow(row);
      return [profile.id, profile];
    }),
  );
  const now = getNow();

  const reactors = db.engagement_reactions.flatMap((row) => {
    const reaction = transformEngagementReactionRow(row);
    if (reaction.postId !== postId) return [];
    const profile = profiles.get(reaction.profileId);
    return profile === undefined
      ? []
      : [{ ...toEngagementPerson(profile), reaction: reaction.type }];
  });
  const comments = db.engagement_comments.flatMap((row) => {
    const comment = transformEngagementCommentRow(row);
    if (comment.postId !== postId) return [];
    const profile = profiles.get(comment.profileId);
    return profile === undefined
      ? []
      : [
          {
            id: comment.id,
            author: toEngagementPerson(profile),
            body: comment.text,
            when: formatRelative(comment.at, now),
          },
        ];
  });

  return { reactors, comments };
}

export function toPostMedia(
  post: Post,
  assets: ReadonlyMap<string, Asset>,
): readonly AssetTileData[] {
  return (post.media ?? []).flatMap((file) => {
    const asset = assets.get(`${file.bucket}/${file.path}`);
    return asset === undefined ? [] : [toAssetTile(asset)];
  });
}

export function toPostContent(
  post: Post,
  client: Client,
  assets: ReadonlyMap<string, Asset>,
): LinkedInPostContent {
  const media = toPostMedia(post, assets);
  const stats =
    post.analytics === null
      ? undefined
      : {
          reactions: post.analytics.reactions,
          comments: post.analytics.comments,
          reposts: post.analytics.reposts,
          impressions: post.analytics.impressions,
        };

  return {
    author: toAuthor(client),
    body: post.content,
    ...(media.length > 0 ? { media } : {}),
    ...(stats === undefined ? {} : { stats }),
  };
}

export function toPostChip(
  post: Post,
  client: Client,
  assets: ReadonlyMap<string, Asset>,
): PostChipData {
  return {
    id: post.id,
    title: toTitle(post.content, 72),
    time: post.scheduledAt === null ? "" : formatTime(post.scheduledAt),
    profile: toProfileLabel(client),
    status: toChipStatus(post.status),
    ...toPostLabel(post),
    preview: toPostContent(post, client, assets),
    ...(post.status === "published"
      ? { engagement: toPostEngagement(post.id) }
      : {}),
  };
}

/** Posts with a slot on the calendar, oldest first. Ideas have no date. */
export function scheduledPosts(): readonly Post[] {
  return getPosts()
    .filter((post) => post.scheduledAt !== null)
    .toSorted((a, b) =>
      (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""),
    );
}

/** Published posts that reported back, newest first. */
export function publishedPosts(): readonly Post[] {
  return getPosts()
    .filter((post) => post.status === "published" && post.analytics !== null)
    .toSorted((a, b) =>
      (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""),
    );
}
