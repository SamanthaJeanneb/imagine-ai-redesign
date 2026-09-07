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

/**
 * The mock ships no binaries, so tiles render as placeholders. A real client
 * would sign `bucket` + `path` into `src` here.
 */
export function toAssetTile(asset: Asset): AssetTileData {
  return {
    id: asset.id,
    kind: getAssetType(asset),
    ...(asset.caption === null ? {} : { caption: asset.caption }),
  };
}

function toAuthor(client: Client): PostAuthor {
  return {
    name: client.name,
    headline: client.description ?? (client.isCompany ? "Company page" : ""),
    ...(client.profilePicturePath === null
      ? {}
      : { avatarUrl: client.profilePicturePath }),
  };
}

/** "Acme" for a page, "Sarah" for a person — the calendar chip has one line. */
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
    .toSorted((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
}

/** Published posts that reported back, newest first. */
export function publishedPosts(): readonly Post[] {
  return getPosts()
    .filter((post) => post.status === "published" && post.analytics !== null)
    .toSorted((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""));
}
