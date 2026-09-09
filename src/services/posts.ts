import type {
  LinkedInPostContent,
  PostAuthor,
} from "@/components/features/agent/linkedin-post-draft";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { AssetTileData } from "@/components/features/files/asset-tile";
import { type Asset, getAssetType, transformAssetRow } from "@/entities/asset";
import { type Client, transformClientRow } from "@/entities/client";
import { type Post, toChipStatus, transformPostRow } from "@/entities/post";
import { formatTime, toTitle } from "@/lib/format";
import { getDb } from "@/mocks/db";

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
  return {
    author: toAuthor(client),
    body: post.content,
    ...(media.length > 0 ? { media } : {}),
  };
}

export function toPostChip(
  post: Post,
  client: Client,
  assets: ReadonlyMap<string, Asset>,
): PostChipData {
  return {
    id: post.id,
    title: toTitle(post.content, 48),
    time: post.scheduledAt === null ? "" : formatTime(post.scheduledAt),
    profile: toProfileLabel(client),
    status: toChipStatus(post.status),
    preview: toPostContent(post, client, assets),
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
