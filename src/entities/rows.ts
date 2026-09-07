/**
 * The slice of SCHEMA.md the mock reads, in database shape: snake_case columns,
 * the same nullability, and status fields as plain strings because Postgres has
 * no enums here. This stands in for the generated `services/supabase/schemas`,
 * so rows stop at the entity transforms — nothing above them sees snake_case.
 *
 * Columns nothing renders yet (queue locks, embeddings, CRM mirrors, engagement
 * rollups) are left out on purpose.
 */

/** `public.users` */
export interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

/** `app.organizations` */
export interface OrganizationRow {
  id: string;
  name: string;
  created_by: string;
  post_label_options: string[] | null;
  created_at: string;
  updated_at: string;
}

/** `app.organization_members` */
export interface OrganizationMemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  member_name: string | null;
  joined_at: string | null;
}

/** `app.clients` — a LinkedIn identity the org posts as, not a human login. */
export interface ClientRow {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_company: boolean;
  linkedin_id: string | null;
  /** Storage object path. The mock stores a path the browser can load. */
  profile_picture_path: string | null;
  persona: string;
  status: string | null;
  created_at: string;
  updated_at: string;
}

/** `app.client_linkedin_auth` */
export interface ClientLinkedInAuthRow {
  id: string;
  client_id: string;
  unipile_account_id: string;
  status: string;
}

/** `client_posts.media` — a storage object, the same shape as `MediaFile`. */
export interface MediaFileRow {
  bucket: string;
  path: string;
}

/** `client_posts.analytics` — the payload LinkedIn returns after publish. */
export interface PostAnalyticsRow {
  impressions: number;
  engagements: number;
  engagement_rate: number;
  clicks: number;
  clickthrough_rate: number;
  profile_viewers_from_this_post: number;
  followers_gained_from_this_post: number;
  members_reached: number;
  reactions: number;
  comments: number;
  reposts: number;
}

/** `app.client_posts` — `scheduled_at` + `status` drive the calendar. */
export interface ClientPostRow {
  id: string;
  client_id: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  linkedin_post_id: string | null;
  media: MediaFileRow[] | null;
  analytics: PostAnalyticsRow | null;
  notes: string | null;
  post_label: string | null;
  created_at: string;
  updated_at: string;
}

/** `app.assets` */
export interface AssetRow {
  id: string;
  client_id: string;
  bucket: string;
  path: string;
  original_path: string | null;
  mime_type: string;
  caption: string | null;
  crop: { x: number; y: number; width: number; height: number } | null;
  status: string;
  processing_status: string | null;
  processing_error: string | null;
  used_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** `app.api_keys` */
export interface ApiKeyRow {
  id: string;
  org_id: string;
  key: string;
  key_prefix: string;
  last_used_at: string | null;
  rotated_at: string | null;
  created_at: string;
}

/** `app.crm_connections` — tokens omitted, they never reach the client. */
export interface CrmConnectionRow {
  id: string;
  org_id: string;
  provider: string;
  status: string;
  external_account_id: string;
  last_synced_at: string | null;
}

/** `agent.activities` — the timeline. */
export interface ActivityRow {
  id: string;
  user_id: string;
  platform: string;
  activity_type: string;
  status: string;
  metadata: {
    title: string;
    excerpt?: string;
    post_id?: string;
    client_id?: string;
  };
  created_at: string;
}

/** `mastra.mastra_threads` */
export interface ThreadRow {
  id: string;
  resourceId: string;
  title: string | null;
  metadata: { unread: boolean };
  createdAt: string;
  updatedAt: string;
}

/**
 * `mastra_messages.content.parts`. JSON is a bag of optional fields, so it stays
 * one loose shape here and `getThread` narrows it into renderable parts.
 */
export interface MessagePartRow {
  /** `text`, `emphasis`, `post_draft`, or `chart`. */
  type: string;
  text?: string;
  postId?: string;
  /** Chart: impressions for this client's last `limit` published posts. */
  clientId?: string;
  limit?: number;
  title?: string;
}

/** `mastra.mastra_messages` */
export interface MessageRow {
  id: string;
  thread_id: string;
  role: string;
  type: string;
  content: { parts: MessagePartRow[] };
  createdAt: string;
}

/**
 * `mastra.mastra_skills`. The real table carries versioned blobs; the mock keeps
 * the current markdown inline.
 */
export interface SkillRow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  file_name: string;
  content: string;
}

/**
 * `mastra.workspace_search`. Tenancy lives in `metadata.orgId`; `metadata.sourceFile`
 * groups chunks into a file, and `clientId` puts the file under a person.
 */
export interface WorkspaceFileRow {
  id: string;
  resourceId: string;
  content: string;
  metadata: { orgId: string; clientId?: string; sourceFile: string };
}

/** The whole mock database, grouped by Postgres schema. */
export interface Database {
  /** Fixed clock, so the calendar always lands on the same week. */
  now: string;
  /** Whether `/` opens the app or starts at sign-in. */
  onboarded: boolean;
  public: { users: UserRow[] };
  app: {
    organizations: OrganizationRow[];
    organization_members: OrganizationMemberRow[];
    clients: ClientRow[];
    client_linkedin_auth: ClientLinkedInAuthRow[];
    client_posts: ClientPostRow[];
    assets: AssetRow[];
    api_keys: ApiKeyRow[];
    crm_connections: CrmConnectionRow[];
  };
  agent: { activities: ActivityRow[] };
  mastra: {
    mastra_threads: ThreadRow[];
    mastra_messages: MessageRow[];
    mastra_skills: SkillRow[];
    workspace_search: WorkspaceFileRow[];
  };
}
