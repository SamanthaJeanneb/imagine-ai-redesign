# Imagine database schema

Postgres schemas: `app` (product tables), `agent` (read-only views for the Mastra agent),
`mastra` (agent memory and runtime), `public`, `twitter`, `user_profile`.

No Postgres enums. Status, role, and type fields are strings.

## Relationships

```
public.users
└── app.organization_members.user_id
    └── app.organizations
        ├── app.clients                    LinkedIn identity managed by the org
        │   ├── app.client_posts           calendar / publishing
        │   ├── app.assets                 uploaded files
        │   ├── app.chat_sessions          legacy chat
        │   ├── app.client_linkedin_auth   LinkedIn account linkage
        │   └── engagement + targeting tables
        ├── app.crm_*                      CRM, keyed by org + Merge ids
        ├── app.subscriptions / org_usage  billing
        └── app.api_keys
```

A **client** is a LinkedIn person or company page the org manages, not a human login.
Human identity is `auth` / `public.users`. Tenancy is `organizations` +
`organization_members`.

---

# `app`

## `organizations`

A workspace. Owns clients, CRM data, billing.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `name` | string | Workspace name |
| `created_by` | string | User who created it |
| `internal_label` | string \| null | Internal classification |
| `post_label_options` | string[] \| null | Allowed values for `client_posts.post_label` |
| `created_at` | string | |
| `updated_at` | string | |

## `organization_members`

Membership join between a user and an org.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `org_id` | string | → `organizations.id` |
| `user_id` | string | Auth user |
| `role` | string | Permission level in the org |
| `member_name` | string \| null | Display name override |
| `joined_at` | string \| null | |
| `created_at` | string | |
| `updated_at` | string | |

## `clients`

A LinkedIn identity (person or company page) the org posts and engages as.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `org_id` | string | → `organizations.id` |
| `created_by` | string | |
| `name` | string | Display name |
| `description` | string \| null | |
| `is_company` | boolean | Company page vs person |
| `linkedin_id` | string \| null | LinkedIn's id for the identity |
| `profile_picture_path` | string \| null | Storage object path |
| `persona` | string | Full persona text used for generation |
| `status` | string \| null | Lifecycle state |
| `auto_comment` | boolean | Auto-commenting enabled |
| `engagement_pod` | boolean | Participates in the engagement pod |
| `created_at` | string | |
| `updated_at` | string | |

## `client_linkedin_auth`

Links a client to its connected LinkedIn account via Unipile.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `unipile_account_id` | string | Provider account id |
| `status` | string | Connection state |
| `created_at` | string | |
| `updated_at` | string | |

## `client_posts`

Posts written for a client. `scheduled_at` + `status` drive the calendar.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `content` | string | Post body |
| `status` | string | Draft / scheduled / published state |
| `scheduled_at` | string \| null | When it should publish |
| `linkedin_post_id` | string \| null | Set once live on LinkedIn |
| `published_from_us` | boolean | Published by this system vs found externally |
| `media` | Json \| null | Attached images/video |
| `first_comment` | string \| null | Auto-posted first comment |
| `first_comment_media` | Json \| null | Media for the first comment |
| `video_thumbnail` | Json \| null | Chosen video poster frame |
| `mentions` | Json \| null | Tagged accounts |
| `mentions_cache` | Json \| null | Resolved mention metadata |
| `analytics` | Json \| null | Impressions/engagement pulled back after publish |
| `notes` | string \| null | Internal note, not published |
| `post_label` | string \| null | Category from `organizations.post_label_options` |
| `attempts` | number | Publish retry count |
| `last_error` | string \| null | Last publish failure |
| `locked_at` | string \| null | Worker claim time |
| `locked_by` | string \| null | Worker id holding the claim |
| `lease_expires` | string \| null | When the claim goes stale |
| `created_at` | string | |
| `updated_at` | string | |

## `task_queue`

Generic scheduled-work queue for client tasks such as publishing.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `task_id` | string | Target row the task acts on |
| `task_type` | string | Kind of work |
| `status` | string | Queue state |
| `scheduled_at` | string | Earliest run time |
| `attempts` | number | Retry count |
| `last_error` | string \| null | |
| `locked_at` | string \| null | Worker claim time |
| `locked_by` | string \| null | Worker id |
| `lease_expires` | string \| null | Claim expiry |
| `created_at` | string | |
| `updated_at` | string | |

## `assets`

Uploaded media for a client. Objects live in storage bucket `app`, folders
`assets` and `chats`.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `bucket` | string | Storage bucket (`app`) |
| `path` | string | Object path in the bucket |
| `original_path` | string \| null | Pre-processing original |
| `mime_type` | string | |
| `caption` | string \| null | |
| `crop` | Json \| null | Crop rectangle applied in UI |
| `status` | string | Lifecycle state |
| `processing_status` | string \| null | Transcode/optimize progress |
| `processing_error` | string \| null | |
| `used_count` | number | Times attached to a post |
| `deleted_at` | string \| null | Soft delete |
| `created_at` | string | |
| `updated_at` | string | |

## `chat_sessions`

Legacy chat threads. Current agent memory is in `mastra`.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string \| null | → `clients.id` |
| `title` | string \| null | |
| `type` | string | Chat variant |
| `created_at` | string \| null | |
| `updated_at` | string \| null | |

## `chat_messages`

Messages in a legacy session. Edits create a new row and mark the old one superseded.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `session_id` | string | → `chat_sessions.id` |
| `parent_msg_id` | string \| null | Message this one replaces or answers |
| `role` | string | user / assistant / system |
| `content` | Json | Message parts |
| `is_superseded` | boolean | Replaced by a newer version |
| `created_at` | string | |
| `updated_at` | string | |

## `client_comments`

Comments the client posted on LinkedIn.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `linkedin_post_id` | string | Post commented on |
| `content` | string \| null | Comment text |
| `media` | Json \| null | |
| `created_at` | string \| null | |
| `updated_at` | string \| null | |

## `client_reactions`

Reactions the client left on LinkedIn.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `linkedin_post_id` | string | Post reacted to |
| `reaction_type` | string | Like, celebrate, etc. |
| `created_at` | string | |
| `updated_at` | string | |

## `targeted_accounts`

Accounts a client watches for engagement opportunities.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `added_by` | string | User who added the target |
| `name` | string | |
| `headline` | string \| null | |
| `profile_url` | string | |
| `profile_picture` | string \| null | |
| `created_at` | string | |
| `updated_at` | string | |

## `targeted_posts`

Posts scraped from targeted accounts.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `targeted_account_id` | string | → `targeted_accounts.id` |
| `text` | string | Post body |
| `post_url` | string | |
| `posted_at` | string \| null | |
| `author_name` | string | |
| `author_headline` | string \| null | |
| `author_profile_url` | string \| null | |
| `author_profile_picture` | string \| null | |
| `images` | string[] \| null | |
| `engagement_likes` | number \| null | |
| `engagement_comments` | number \| null | |
| `engagement_shares` | number \| null | |
| `created_at` | string | |
| `updated_at` | string | |

## `external_comments`

Other people's comments on targeted posts, used as reply context.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `post_id` | string | Targeted post |
| `platform_comment_id` | string | LinkedIn comment id |
| `parent_platform_comment_id` | string \| null | Parent for threaded replies |
| `comment_text` | string \| null | |
| `comment_url` | string \| null | |
| `author_name` | string | |
| `author_headline` | string \| null | |
| `author_profile_url` | string \| null | |
| `author_profile_picture` | string \| null | |
| `posted_at` | string \| null | |
| `created_at` | string | |
| `updated_at` | string | |

## `comment_suggestions`

Generated comment drafts for a post, ranked for review.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `post_id` | string | Post to comment on |
| `target_comment_id` | string \| null | Comment being replied to |
| `suggestion` | string | Draft text |
| `reasoning` | string \| null | Why it was suggested |
| `rank` | number \| null | Ordering |
| `status` | string | Pending / accepted / rejected |
| `comment_url` | string \| null | Set once posted |
| `created_at` | string | |

## `engagement_profiles`

LinkedIn people who engaged with client posts. One row per person, enriched.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `linkedin_profile_id` | string | LinkedIn's id |
| `public_identifier` | string \| null | URL slug |
| `name` | string \| null | |
| `first_name` | string \| null | |
| `last_name` | string \| null | |
| `headline` | string \| null | |
| `linkedin_url` | string \| null | |
| `profile_picture_path` | string \| null | Mirrored into storage |
| `location` | Json \| null | |
| `current_position` | Json \| null | Current title and company |
| `about` | string \| null | |
| `experience` | Json \| null | |
| `education` | Json \| null | |
| `skills` | Json \| null | |
| `follower_count` | number \| null | |
| `connections_count` | number \| null | |
| `is_premium` | boolean \| null | |
| `is_verified` | boolean \| null | |
| `is_open_to_work` | boolean \| null | |
| `raw_data` | Json \| null | Full scrape payload |
| `created_at` | string | |
| `updated_at` | string | |

## `engagement_profile_tags`

ICP scoring of an engaged profile, per client.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `profile_id` | string | → `engagement_profiles.id` |
| `category` | string \| null | Segment the profile falls into |
| `match_score` | number \| null | Fit score |
| `signals` | Json \| null | Evidence behind the score |
| `created_at` | string | |
| `updated_at` | string | |

## `engagement_comments`

Comments left on client posts by engaged profiles.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `post_id` | string | Client post |
| `profile_id` | string | → `engagement_profiles.id` |
| `linkedin_comment_id` | string | |
| `comment_text` | string \| null | |
| `comment_url` | string \| null | |
| `commented_at` | string \| null | |
| `created_at` | string | |

## `engagement_reactions`

Reactions left on client posts by engaged profiles.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `post_id` | string | Client post |
| `profile_id` | string | → `engagement_profiles.id` |
| `reaction_type` | string | |
| `apify_reaction_id` | string \| null | Scraper dedupe key |
| `created_at` | string | |

## `post_comments`

Earlier engagement model: comment with the author snapshotted on the row.
Superseded by `engagement_comments` + `engagement_profiles`.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `post_id` | string | Client post |
| `linkedin_comment_id` | string \| null | |
| `comment_text` | string \| null | |
| `author_name` | string \| null | |
| `author_headline` | string \| null | |
| `author_linkedin_id` | string \| null | |
| `author_profile_url` | string \| null | |
| `author_profile_picture` | string \| null | |
| `commented_at` | string \| null | |
| `created_at` | string \| null | |
| `updated_at` | string \| null | |

## `post_reactions`

Earlier engagement model for reactions, author snapshotted on the row.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `post_id` | string | Client post |
| `reaction_type` | string | |
| `author_name` | string \| null | |
| `author_headline` | string \| null | |
| `author_linkedin_id` | string \| null | |
| `author_profile_url` | string \| null | |
| `author_profile_picture` | string \| null | |
| `reacted_at` | string \| null | |
| `created_at` | string \| null | |
| `updated_at` | string \| null | |

## `mention_accounts`

Cache of LinkedIn accounts available to tag in posts.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `org_id` | string | → `organizations.id` |
| `linkedin_id` | string | |
| `name` | string | |
| `is_company` | boolean | |
| `headline` | string \| null | |
| `industry` | string \| null | |
| `location` | string \| null | |
| `profile_url` | string \| null | |
| `profile_picture_path` | string \| null | |
| `follower_count` | number \| null | |
| `connections_count` | number \| null | |
| `last_synced_at` | string | |
| `created_at` | string | |
| `updated_at` | string | |

## `persona_chunks`

A client's persona split into embedded chunks for retrieval.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `client_id` | string | → `clients.id` |
| `path` | string | Persona section the chunk came from |
| `chunk_index` | number | Order within the section |
| `content` | string | Chunk text |
| `content_hash` | string | Change detection |
| `embedding` | string \| null | Vector |
| `embedding_hash` | string \| null | |
| `embedding_model` | string \| null | |
| `dims` | number \| null | Vector dimensions |
| `created_at` | string | |
| `updated_at` | string | |

## `crm_connections`

An org's connection to an external CRM through Merge. Holds provider tokens.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `org_id` | string | → `organizations.id` |
| `provider` | string | CRM vendor |
| `status` | string | Connection state |
| `external_account_id` | string | Merge account id |
| `account_token` | string \| null | Provider token |
| `end_user_origin_id` | string \| null | Merge end-user id |
| `sync_cursors` | Json | Per-entity sync position |
| `last_synced_at` | string \| null | |
| `created_at` | string | |
| `updated_at` | string | |

## CRM entity tables

`crm_accounts`, `crm_contacts`, `crm_leads`, `crm_stages`, `crm_opportunities`,
and `crm_stage_history` are mirrors of CRM records. Every row shares these columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | Local PK |
| `org_id` | string | → `organizations.id` |
| `connection_id` | string | → `crm_connections.id` |
| `merge_id` | string | Merge's stable id; the key other CRM rows point at |
| `remote_id` | string \| null | Id in the source CRM |
| `remote_created_at` | string \| null | Created in source CRM |
| `remote_updated_at` | string \| null | Updated in source CRM |
| `remote_was_deleted` | boolean | Deleted upstream |
| `raw` | Json | Full source payload |
| `synced_at` | string | Last sync into this table |
| `created_at` | string | |
| `updated_at` | string | |

### `crm_accounts`

Companies. LinkedIn columns are enrichment added by this system.

| Column | Type | Meaning |
| --- | --- | --- |
| `name` | string \| null | |
| `domain` | string \| null | |
| `industry` | string \| null | |
| `size` | string \| null | Headcount band |
| `linkedin_slug` | string \| null | Matched company page |
| `linkedin_tagline` | string \| null | |
| `linkedin_follower_count` | number \| null | |
| `linkedin_logo_path` | string \| null | |
| `linkedin_profile_fetched_at` | string \| null | |
| `enriched_at` | string \| null | |

### `crm_contacts`

People at accounts.

| Column | Type | Meaning |
| --- | --- | --- |
| `name` | string \| null | |
| `email` | string \| null | |
| `company_name` | string \| null | |
| `account_merge_id` | string \| null | → `crm_accounts.merge_id` |
| `linkedin_slug` | string \| null | Matched profile |
| `linkedin_source` | string \| null | How the match was made |
| `enriched_at` | string \| null | |

### `crm_leads`

Unqualified prospects, with conversion pointers once promoted.

| Column | Type | Meaning |
| --- | --- | --- |
| `name` | string \| null | |
| `email` | string \| null | |
| `title` | string \| null | |
| `company_name` | string \| null | |
| `status` | string \| null | |
| `lead_source` | string \| null | |
| `converted_at` | string \| null | |
| `converted_account_merge_id` | string \| null | → `crm_accounts.merge_id` |
| `converted_contact_merge_id` | string \| null | → `crm_contacts.merge_id` |

### `crm_stages`

Pipeline stages.

| Column | Type | Meaning |
| --- | --- | --- |
| `name` | string \| null | |
| `category` | string \| null | Open / won / lost grouping |

### `crm_opportunities`

Deals.

| Column | Type | Meaning |
| --- | --- | --- |
| `name` | string \| null | |
| `amount` | number \| null | Deal value |
| `status` | string \| null | |
| `stage_merge_id` | string \| null | → `crm_stages.merge_id` |
| `stage_name` | string \| null | Denormalized stage name |
| `account_merge_id` | string \| null | → `crm_accounts.merge_id` |
| `contact_merge_ids` | string[] | → `crm_contacts.merge_id` |

### `crm_stage_history`

Stage transitions for an opportunity, for velocity reporting.

| Column | Type | Meaning |
| --- | --- | --- |
| `opportunity_merge_id` | string | → `crm_opportunities.merge_id` |
| `stage_merge_id` | string | → `crm_stages.merge_id` |
| `stage_name` | string \| null | Stage name at transition time |
| `entered_at` | string | When the deal entered the stage |
| `source_type` | string \| null | What recorded the transition |
| `source_id` | string \| null | |

## `subscriptions`

Stripe subscription and plan limits for an org.

| Column | Type | Meaning |
| --- | --- | --- |
| `org_id` | string | → `organizations.id` |
| `tier` | string | Plan name |
| `status` | string | Stripe status |
| `price_id` | string | Stripe price |
| `active_personas` | number | Personas allowed/in use |
| `persona_build_credits` | number | Remaining persona builds |
| `stripe_customer_id` | string | |
| `stripe_email` | string | |
| `stripe_subscription_id` | string | |
| `created_at` | string | |
| `updated_at` | string | |

## `subscription_events`

Stripe billing event ledger with MRR movement.

| Column | Type | Meaning |
| --- | --- | --- |
| `subscription_id` | string | Stripe subscription |
| `subscription_item_id` | string | |
| `customer_id` | string | |
| `email` | string | |
| `name` | string | |
| `event_type` | string | Created / updated / canceled |
| `event_timestamp` | string | |
| `local_event_timestamp` | string | |
| `created` | string | Stripe creation time |
| `currency` | string | |
| `plan_amount` | number | |
| `plan_interval_count` | number | |
| `price_recurring_interval` | string | |
| `price_id`, `price_id_1` | string | |
| `product_id` | string | |
| `mrr_change` | number | MRR delta |
| `quantity_change` | number | Seat delta |
| `rebate_cents` | number \| null | Credit applied |
| `updated_at` | string | |

## `custom_subscription_events`

Manually entered subscription records for deals booked outside Stripe:
amounts, plan intervals, `start_date`, `rebate_cents`, and `notes`.

## `org_usage`

Metered usage counters per org.

| Column | Type | Meaning |
| --- | --- | --- |
| `org_id` | string | → `organizations.id` |
| `persona_builder_runs` | number | Persona builds consumed |
| `created_at` | string | |
| `updated_at` | string | |

## `api_keys`

API keys issued to an org.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `org_id` | string | → `organizations.id` |
| `key` | string | Secret |
| `key_prefix` | string | Displayable prefix |
| `last_used_at` | string \| null | |
| `rotated_at` | string \| null | |
| `created_at` | string | |

## Functions

| Function | Returns |
| --- | --- |
| `analytics_posts_summary` | Post performance totals |
| `analytics_post_engagers` | Profiles that engaged a post |
| `analytics_aggregated_engagers` | Engagers rolled up across posts |
| `analytics_post_engagement_breakdown` | Engagement split by type |
| `post_engaged_companies` | Companies behind a post's engagers |
| `match_post_companies_by_similarity` | Company matches by embedding similarity |
| `crm_matched_interactions` | CRM records joined to LinkedIn engagement |
| `get_comment_suggestions_with_posts_by_client` | Suggestions with their posts |
| `get_persona_section` | One persona section |
| `match_persona_chunks` | Persona chunks by similarity |
| `replace_persona_chunks` | Rewrite a client's persona chunks |
| `supersede_and_insert_message` | Replace a chat message, insert successor |
| `supersede_chat_messages` | Mark messages superseded |
| `add_early_beta_subscription` | Grant a beta subscription |

---

# `agent`

Read model for the Mastra agent. Access is revoked from `public` and `anon`;
`authenticated` and `service_role` get usage.

## `activities`

Log of agent actions. The only real table in this schema.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `user_id` | string | Who the action ran for |
| `platform` | string | Target platform |
| `activity_type` | string | What was done |
| `status` | string | Outcome |
| `metadata` | Json | Action detail |
| `created_at` | string | |
| `updated_at` | string | |

## `member_org_ids()`

Returns `string[]` — org ids for `auth.uid()`. Every view filters on it.

## Views

Column-whitelisted, org-scoped views over `app` tables of the same name. All
columns are nullable because Postgres cannot infer view nullability.

`clients`, `client_posts`, `client_comments`, `client_reactions`, `assets`,
`organizations`, `organization_members`, `mention_accounts`, `persona_chunks`,
`comment_suggestions`, `targeted_accounts`, `targeted_posts`, `external_comments`,
`engagement_profiles`, `engagement_profile_tags`, `engagement_comments`,
`engagement_reactions`, `post_comments`, `post_reactions`, `crm_accounts`,
`crm_contacts`, `crm_leads`, `crm_stages`, `crm_opportunities`, `crm_stage_history`.

Omitted columns are the point of these views. `agent.clients` drops `created_by`
and `persona`; `agent.client_posts` drops queue internals (`attempts`, `last_error`,
locks, `mentions_cache`, `first_comment_media`, `video_thumbnail`).

Tables with no view: `api_keys`, `client_linkedin_auth`, `crm_connections`,
`chat_sessions`, `chat_messages`, `task_queue`, `subscriptions`,
`subscription_events`, `custom_subscription_events`, `org_usage`.

---

# `mastra`

Agent memory and runtime, created by migration rather than the generated types.
Embeddings are 768-dimensional (gemini-embedding-001), indexed HNSW with cosine
distance. Timestamp columns are duplicated with a `Z` suffix as `timestamptz`.

## Memory and chat

| Table | Meaning |
| --- | --- |
| `mastra_threads` | Conversation thread: `id`, `resourceId`, `title`, `metadata` |
| `mastra_messages` | Message in a thread: `thread_id`, `role`, `type`, `content` |
| `mastra_resources` | Per-resource working memory and metadata |
| `mastra_observational_memory` | Rolling observations per lookup key: buffered/active observation text, token counts, reflection state |
| `mastra_thread_state` | Runtime state attached to a thread |
| `mastra_notifications` | Thread notifications with delivery, dedupe, and coalescing state; PK (`threadId`, `id`) |
| `memory_messages_768` | Message embeddings; `metadata.thread_id` / `resource_id` filter recall |
| `memory_observations_768` | Observation-group embeddings |
| `workspace_search` | File-content embeddings. Shared across orgs, so tenancy is enforced in app code via `metadata.orgId` / `resourceId`; `metadata.sourceFile` groups chunks per file |

## Runtime, config, and evaluation

Agent and tool definitions with versioned history: `mastra_agents`,
`mastra_agent_versions`, `mastra_prompt_blocks`, `mastra_prompt_block_versions`,
`mastra_skills`, `mastra_skill_versions`, `mastra_skill_blobs`,
`mastra_workspaces`, `mastra_workspace_versions`, `mastra_mcp_clients`,
`mastra_mcp_client_versions`, `mastra_mcp_servers`, `mastra_mcp_server_versions`,
`mastra_tool_provider_connections`.

Execution: `mastra_workflow_definitions`, `mastra_workflow_snapshot`,
`mastra_background_tasks`, `mastra_schedules`, `mastra_schedule_triggers`,
`mastra_channel_installations`, `mastra_channel_config`, `mastra_favorites`.

Tracing and evaluation: `mastra_ai_spans` (span tree with entity, session, token,
and error detail), `mastra_scorers`, `mastra_scorer_definitions`,
`mastra_scorer_definition_versions`, `mastra_datasets`, `mastra_dataset_items`,
`mastra_dataset_versions`, `mastra_experiments`, `mastra_experiment_results`.

---

# `public`

## `users`

Human account record mirrored from auth.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | Auth user id |
| `email` | string \| null | |
| `name` | string \| null | |
| `full_name` | string \| null | |
| `avatar_url` | string \| null | |

## `waitlist`

Signup form submissions.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | string | PK |
| `email` | string | |
| `name` | string | |
| `company` | string \| null | |
| `linkedin_url` | string \| null | |
| `primary_goal` | string \| null | What they want to achieve |
| `biggest_blocker` | string \| null | |
| `interested_in_investing` | boolean | |
| `investment_stages` | string[] \| null | |
| `created_at` | string | |
| `updated_at` | string | |

---

# `twitter`

Earlier Twitter product, keyed by `user_id` rather than org.

| Table | Meaning |
| --- | --- |
| `access_tokens` | Twitter OAuth `access_token` + `access_secret` |
| `one_time_tokens` | In-flight OAuth handshake tokens with `expires_at` |
| `personas` | `tweet_guidelines`, `comment_guidelines`, `examples`, `attributes` |
| `previous_tweets` | Posted tweet history: `tweet_id`, `tweet_content`, `tweet_created_at` |
| `comment_settings` | Auto-comment config: `guide`, `examples`, `frequency`, `target_users`, `is_enabled` |
| `settings` | Automation flags (`auto_tweet`, `auto_like`, `auto_retweet`, `auto_comment`, `auto_reply_to_comments`, `co_pilot`), frequency objects, `target_users`, `model_language`, `is_onboarded` |

---

# `user_profile`

User-scoped records that predate the org model.

| Table | Meaning |
| --- | --- |
| `base_personas` | `user_id`, `attributes` Json — persona before client-level personas |
| `social_platforms` | `user_id`, `twitter` boolean — connected platforms |
| `subscriptions` | Per-user Stripe ids and `tier`, separate from `app.subscriptions` |
