# Imagine AI Redesign — Implementation Plan

Companion to `PROJECT.md` (rules) and `SCHEMA.md` (data). This document decides
architecture, design tokens, motion, mock data, and build order. It contains no code.
Where `PROJECT.md` and a wireframe disagree, the wireframe wins on layout and behavior;
`PROJECT.md` wins on visual rules.

Skills to keep open while implementing: `.agents/skills/mastering-typescript`,
`.agents/skills/vercel-react-best-practices`, `.agents/skills/shadcn`,
`.cursor/skills/motion`.

## What this is

A front end mock, built to replace the UI of the real app at `~/Desktop/imagine-app`
(`apps/web`). Every screen reads one JSON file. There is no database, no auth, no
mutations that outlive a page. The measure of success is that the screens look and move
right, and that dropping them into the real app is mostly moving folders and swapping a
data source. See [§9 Porting](#9-porting-to-imagine-app).

The failure mode to avoid is building infrastructure the mock does not need and the real
app already has: request layers, validation layers, query caches, test suites over
fixture data. Build the screen. Read the JSON. Stop.

## Hard rules

- **Open and analyze the wireframe images before building each screen.** At the start of
every UI phase, read the PNG files listed in that phase's "Wireframes" line (and
`pink-application.png` for color density), and check the built screen against them before
marking the phase done. Follow the general structure and behavior; interpret the rest and
make it look great.
- **Reference `imagine-app`, never copy its code.** This is a clean rebuild. `SCHEMA.md`
carries over, and type names and shapes are matched deliberately so the port is cheap.
Nothing else comes across.
- **Simplest thing that renders.** No abstraction earns its place until a second caller
needs it. If a layer exists only to be correct in principle, delete it.
- **No tests over mock data.** `pnpm typecheck` and `pnpm lint` are the gates. The mock
JSON is checked by being annotated where it is imported, so a bad edit is a compile
error. Do not add unit tests for selectors that format strings.
- One mock JSON file. Feature code never fabricates data inline. `/dev/kit` is the
exception: it shows components in states the mock does not contain.
- Animation is Motion (`motion` package, imported from `motion/react`). Framer Motion is
the same library under its old name; never install or import `framer-motion` alongside
it.
- Icons are Font Awesome Pro 7, **Sharp** family, Regular style, loaded once via the Kit
CSS embed in `src/app/layout.tsx`. Sharp Solid is for active/selected only; Brands is for
the LinkedIn and provider logos only. No Lucide, no Material Symbols. Feature code uses
the `Icon` component, never raw `fa-` classes.
- No inline styles, no raw color values outside the token file.
- No em dashes in any product copy or mock data (labels, headings, descriptions,
placeholders, toasts, JSON strings). Use a period, comma, or colon instead.
- Every element, click, and transition has motion.
- **Stop at the end of every phase and wait for review.** Each stop includes a short
summary and the exact `localhost` URLs to open.
- **Keep the dev server running.** Start `pnpm dev` in Phase 0 and leave it up. Confirm
the pages for that phase render without console errors before handing off.
- **Always commit and push** on `main` after every phase, before the review stop. Do not
force-push.

---

## 1. Wireframe notes

The wireframes fix structure and behavior, not visual polish. They are screenshots, so
anything cut off at the frame edge is the crop, not the design: the calendar is a full
week, lists continue, columns are complete.

### Shell

Left sidebar (logo, primary action, Agent / Calendar / Analytics / Files, a Chats list,
"Ask imagine" footer) rounding into the main surface, with an optional right column. The
signed-in user (avatar, name, settings) sits at the top right of the page. When the file
system panel is open the sidebar collapses to icons.

### Landing (`landing/landing(agent).png`)

After onboarding the user lands here. It shows everything the agent has done: drafts that
have not been scheduled, updates from while they were away, and some analytics to spark
ideas. A prompt box sits at the top. Clicking a button on a notification sends that
action to the agent.

### Chat (`agent/agent.png`, `agent/agent-interaction.png`)

Sending from the prompt box moves the UI down into a chat interface with an animated
transition, not a flash to a new page. The agent answers with charts, graphs, and
graphics for scheduled or drafted posts. A drafted post looks like a real LinkedIn post
and can be edited in chat. A file icon in the top right opens the file system panel. The
agent has a distinct thinking state, not a spinner.

### Calendar and analytics in chat (`agent/calendar - in agent chat.png`, `agent/analytics - in agent.png`)

The chat bar has two options, Calendar and Analytics, that preview above the input.
Expanding brings the user to the full page and the chat transitions into the right
sidebar.

### Calendar page (`calendar/calendar page.png`)

Navigation and view controls, search, a grid of scheduled and drafted posts, and the chat
in the right sidebar.

### Analytics page (`analytics/analytics-page.png`)

Range and profile controls, headline stats, impressions over time, breakdowns by post
type and by profile, and top posts.

### File system (`file-system/file system - right sidebar.png`, `file-system/editing file - opens tab.png`)

A Drive-like interface with markdown files and a section for assets. There are files for
the organization and for individuals, plus a Skills tab. Hovering a file reveals edit;
editing opens a tab next to the agent. After saving, closing the tab returns to the chat.

### Settings (`settings/settings - profiles.png`, `settings/settings - integrations (like crm).png`)

Tabs for General, Profiles, Integrations, and API. Profiles lists the LinkedIn identities
the organization manages with a detail pane. Integrations shows connected services and
others available to add.

### Onboarding (`onboarding/Sign-in.png`, `onboarding/step-1.png` to `step-3.png`)

Sign-in with a pink brand panel, then three steps (organization, invite team, connect
LinkedIn) with a stepper.

All interactions have clean motion and animated page transitions, like Apple.

---

## 2. Decisions where the wireframes are open

- **Analytics is a top-level route.** `PROJECT.md`'s tree omits it, the nav includes it.
- **Onboarding is the entry point.** `/` sends a new user to `/sign-in`, then through
`/onboarding/organization`, `/onboarding/team`, `/onboarding/linkedin`, finishing on the
landing at `/agent`. An onboarded user (mock flag) goes from `/` straight to `/agent`.
These live in an `(auth)` route group with their own layout.
- **Route groups are folder names only.** `(auth)` and `(workspace)` keep parentheses out
of the URL. Nothing is called "dashboard".
- **`/agent` is the landing.** Landing and thread are two modes of one persistent
workspace, not two pages, so the composer can morph. Threads get a URL
(`/agent/[threadId]`) via history replacement after the animation, without remounting.
- **Chat is owned by the workspace layout, not by pages.** Its placement (main column,
right sidebar, hidden) derives from the route. That is what lets the thread move from
center to sidebar across `/agent` → `/calendar` and `/analytics`.
- **Settings tabs are routes:** `/settings` (General), `/settings/profiles`,
`/settings/integrations`, `/settings/api`. No billing route, no usage meter, no storage
meter: those were cut from the design.
- **`/files` is a full-page version of the files panel** (same tree, wider preview
column). The Files nav item goes there; the chat's file icon opens the panel.
- **Never a card inside a card.** Inside a raised or filled container the children are
plain rows and icons, never wells, tiles, or inner boxes.
- **Stat tiles and chart blocks are not cards.** They sit on the main surface separated by
spacing; where grouping is needed, one soft `imagine-surface-raised` wraps the group.
- **Pink is the accent, not the primary button color.** Every primary button is near-black
(`imagine-primary`). Pink appears where `pink-application.png` shows it: logo tile, active
nav item, timeline dots, avatar tile, chart fills, sign-in brand panel.
- **"Chats" in the sidebar lists recent agent threads** (`mastra_threads`).
- **Markdown files live in the Mastra workspace**, not in `assets`. Files come from
`workspace_search` rows grouped by `metadata.sourceFile`, scoped by `metadata.orgId` (org
section) or `metadata.clientId` (person sections). Assets are `app.assets`. The Skills tab
lists `mastra_skills`, each row a toggle plus the markdown file behind it. A client's
persona is a file in that client's section.
- **"New chat" sidebar action** returns to the `/agent` landing with an empty composer.

---

## 3. Architecture

### Routes

- `/` redirects to `/sign-in` or `/agent` based on the mock onboarding state
- `(auth)`: `sign-in`, `onboarding/organization`, `onboarding/team`, `onboarding/linkedin`
- `(workspace)`: `agent`, `agent/[threadId]`, `calendar`, `analytics`, `files`,
`settings`, `settings/profiles`, `settings/integrations`, `settings/api`

No `app/api` routes. In the real app that folder is reserved for webhooks, cron, and the
agent API; screens there read through the entity layer on the server or TanStack Query on
the client. Building a fetch layer over local JSON would be thrown away on arrival.

### Data flow

`db.json` → typed import in `src/mocks/db.ts` → row transforms in `src/entities/*` →
selectors in `src/services/*` → server components → props. Four rules hold it together:

1. `db.json` is annotated where it is imported (`const db: Database = rawDb`). TypeScript
compares the JSON against the row types, so a typo is a compile error. Nothing parses at
runtime.
2. `src/entities/rows.ts` describes the tables in database shape: snake_case, the same
nullability, status fields as plain strings (Postgres has no enums here).
3. `src/entities/{asset,client,post,analytics}.ts` hold camelCase domain types and the
row transforms. Snake_case stops at this line.
4. `src/services/*` are plain synchronous functions returning exactly the props a
component takes. No async, no `Result`, no caching: the source is a static object.

### Workspace shell state

`WorkspaceShell` (client, in the workspace layout) holds only what more than one place
reads, and derives the rest from the pathname: the selected nav item and the open thread
come from the URL, so they need no state at all. Today that leaves the collapsed rail.
Later phases add the composer preview, the files panel, and the editor tabs, each when the
phase that needs it lands, not before.

One `LayoutGroup` wraps the rail and the page so shared `layoutId`s resolve across route
changes. Pages stay thin: select data, compose.

---

## 4. Design system

Built in Phase 1. `src/styles/tokens.ts` is the source of truth and emits CSS variables
into `globals.css`; this section records intent, not values.

Tailwind's own scales are folded onto the tokens, so a plain utility resolves to a token
rather than to Tailwind's defaults: `--spacing` comes from `spacingBase`, which makes
every numeric utility (`p-4`, `gap-1.5`, `h-9`, `size-8`) a multiple of one number;
`--text-xs|sm|base|lg` come from the type scale, so the vendored shadcn primitives move
with it; `--radius-*`, `--color-*`, and the state colors come from here too. Changing a
number in `tokens.ts` changes every component that uses it. Picking a size, color, or font
size anywhere else is a bug, and the grep gates in section 10 look for it.

- **Color.** Semantic names only, never hues: `imagine-background`, `imagine-surface`,
`imagine-surface-raised`, `imagine-border`, `imagine-foreground` and its `-muted` /
`-faint` steps, `imagine-primary` (+ `-foreground`), `imagine-secondary` (+ `-soft`,
`-strong`, `-foreground`). Light and dark resolve from one `data-theme` switch. Sampled
from `pallete-light.png` and `pallete-dark.png`. `destructive`, `warning`, and `success`
are tokens on the same switch, so no component reaches into Tailwind's palette.
- **Accent budget** (from `pink-application.png`): logo tile, active nav, unread timeline
dots, avatar tile, chart fills, the "or" rule on sign-in, the sign-in brand panel.
Nowhere else.
- **Spacing.** One base unit behind every numeric utility, plus named steps `xxs` 2
through `section` 64, aliased as Tailwind utilities (`gap-l`).
- **Control sizing.** `control` heights `xs` 28, `sm` 32, `base` 36, `lg` 40, used as
`h-control-*` and `size-control-*`. Buttons, inputs, selects, tab strips, and toggle
groups all read them, so controls stay one family and retune together.
- **Radius.** `control` 6, `panel` 12, `surface` 20. A `data-radius="sharp"` variant
halves them; `/dev/kit-sharp` renders the whole kit through it.
- **Elevation instead of borders.** `shadow-control`, `shadow-raised`, `shadow-floating`,
`inset-shadow-highlight`. Hairlines are rare and deliberate.
- **Type.** DM Sans via `next/font`, one family: `display`, `title`, `heading`, `body`,
`small`, `micro`. No eyebrow text and no decorative counts: a label earns its place by
telling the user something they would act on.
- **Icons.** One `Icon` component with a typed name union. Sharp Regular by default,
Sharp Solid when `active`, Brands for LinkedIn and provider marks.
- **Components.** shadcn primitives under `components/ui`, each rewritten for tokens,
token radii, no default ring, and Motion press states. Feature components under
`components/features/<domain>` and `components/layout`. `/dev/kit` renders every one of
them in its states, both themes.
- **Menu selection.** One indicator that slides between items with a shared `layoutId`,
never a highlight applied per item. Accent on nav, foreground on tabs.

---

## 5. Motion

Presets live in `src/styles/motion.ts`; nothing sets a duration inline. `spring.snappy`
for indicators and press, `spring.soft` for panels and morphs, `duration.fast|base|slow`
with `ease.out`, `stagger.list` and `stagger.grid`, `press` / `pressRow` / `hoverLift` /
`pop` / `swapUp` for interaction states.

The choreography that matters:

- **Landing → thread.** The composer carries `layoutId="composer"`. On send, the header,
timeline, and calendar strip exit with opacity, a small rise, and blur; the composer
morphs to the bottom dock; the user bubble enters from the composer position; the
thinking indicator appears; the URL is replaced. Nothing blocks input.
- **Notification action.** The button presses, its entry collapses, and the same
choreography plays with the intent as the first message.
- **Preview open and close.** `PreviewSurface` shares a `layoutId` with the composer
frame and grows upward; content staggers in. Previews stay mounted with `Activity`.
- **Expand to page.** The page's grid or chart carries the preview's `layoutId`, so the
frame morphs into the page while `ChatColumn` slides right and narrows.
- **Files panel.** Enters in flow by width; the main surface compresses; the sidebar
collapses to icons in the same beat.
- **Editor tab.** The tab strip grows in, thread content exits left, the document enters
right, Save confirms inline.
- **Route changes.** A fade and 4px slide. Elements carrying a `layoutId` are excluded so
morphs stay clean.
- **Thinking state.** A pink hairline that breathes, rotating status text, and the reply
streaming in per block. Never a spinner.
- **Reduced motion.** `useReducedMotion` swaps morphs for fades and disables stagger.

Performance rules from the motion skill: prefer transform and opacity, set `willChange`
only for the duration of a morph, never read a MotionValue in render, never allocate in a
frame callback.

---

## 6. Mock data

`src/mocks/db.json`. Top-level keys are Postgres schemas, second level is table names,
values are arrays of rows using exact `SCHEMA.md` column names. A `now` field fixes the
clock so the calendar always lands on the same week.

Only tables something renders are included. Engagement rollups, CRM entity mirrors,
subscriptions, and usage counters are deliberately absent: nothing in the design reads
them.

| Table | Rows | Feeds |
| --- | --- | --- |
| `public.users` | 4 | page header account, members |
| `app.organizations`, `organization_members` | 1, 4 | workspace name, General, join screen |
| `app.clients` | 5 (1 company page) | profiles, authors, personas |
| `app.client_linkedin_auth` | 5, one expired | connection status |
| `app.client_posts` | 33 | calendar, analytics, drafts in chat |
| `app.assets` | 12 | asset grid, post media |
| `app.api_keys` | 1 | Settings, API |
| `app.crm_connections` | 1 (hubspot) | Settings, Integrations |
| `agent.activities` | 6 | landing timeline |
| `mastra.mastra_threads`, `mastra_messages` | 6, 4 | sidebar Posts, one worked thread |
| `mastra.mastra_skills` | 5 | Skills tab, editable markdown |
| `mastra.workspace_search` | 11 | file tree, personas, nested folder |

Shapes that must match the real app, because they are what the port swaps onto:

- `client_posts.status` is one of `idea | planned | in_review | scheduled | published |
failed`. There is no "draft" in the database; the calendar chip maps the first three to
its draft look.
- `client_posts.media` is `{ bucket, path }[]`, the same as `MediaFile`, not asset ids.
- `client_posts.analytics` is the LinkedIn payload: `impressions`, `engagements`,
`engagement_rate`, `clicks`, `clickthrough_rate`, `profile_viewers_from_this_post`,
`followers_gained_from_this_post`, `members_reached`, `reactions`, `comments`, `reposts`.
- `assets` carries the columns `entities/assets` expects, including `original_path`,
`crop`, `processing_status`, and `deleted_at`.

Posts span June to October 2026: twenty published with analytics, one failed, nine
scheduled ahead, three ideas with no date. That is enough for a 90 day range, a populated
month, and an empty week the agent can offer to fill.

### Message parts

`mastra_messages.content.parts` is a list of loose objects narrowed when a thread is
read. Rendered kinds: `text`, `emphasis`, `post_draft` (references a post id, resolved
into the draft), and `chart` (a client id and a count, resolved into impressions for that
profile's last posts). The renderer switches exhaustively.

### Selectors

Pure functions in `src/services/*`, each returning the props a component takes:

- `calendar`: month grid in whole Monday weeks, chips with previews, "Up next"
- `analytics`: summary and previous period, stat tiles, impressions series, by profile,
top posts
- `agent`: sidebar threads, the landing timeline, one thread with parts resolved
- `files`: org and person sections with nested folders and an assets node, skills, and
any file or skill opened as a document
- `settings` and `workspace`: profiles and detail, integrations, API key, org, members,
current user

---

## 7. Code conventions

TypeScript, from `mastering-typescript`:

- `strict`, `noUncheckedIndexedAccess`, ESM, `moduleResolution: bundler`; ESLint 9 flat
config with `strictTypeChecked`; Prettier.
- `satisfies` for token and variant maps; discriminated unions with exhaustive switches
for message parts and chat placement; literal unions, never enums.
- No `as` casts, no `any`, no default exports outside Next.js route files.

React and Next.js, from `vercel-react-best-practices`:

- Pages are server components that read selectors and pass only the fields the client
needs. Client components are leaf-level.
- `useTransition` for send and save; `Activity` for hidden previews; functional
`setState`; no components defined inside components; no derived state in effects.
- The theme switch uses the inline-script pattern to avoid flicker.

Performance work stops at what a mock of this size can actually feel. Recharts loads with
`next/dynamic` because it is genuinely heavy; there is no hover preloading, no
`content-visibility` on a four message thread, and no deferred values for filtering
thirty three posts.

shadcn, from the shadcn skill:

- `className` for layout only; `cn()` for conditionals; `gap-*` not `space-*`; `size-*`
for squares; `Field` for forms; `ToggleGroup` for option sets; icons via `data-icon`;
`Skeleton`, `Empty`, `Alert`, `Badge` instead of custom markup; dialogs always titled.
- After adding a component, replace `lucide-react` with `Icon`, strip default colors and
radii for tokens, and leave a short comment header so upstream diffs stay reviewable.

---

## 8. Build order

Each phase ends with `typecheck`, `lint`, a visual pass in light and dark, a running dev
server, then commit, push, summarize, and **wait for review**.

### Phase 0 — Scaffold and toolchain ✅

Next.js App Router in `src/`, TypeScript, Tailwind v4, pnpm, strict tsconfig, ESLint flat
config with the `no-restricted-imports` gate, Prettier. `motion`, `recharts`, and shadcn.
`zod` and `swr` were installed here and later removed: with a static JSON source there is
nothing to validate at runtime and nothing to fetch.

### Phase 1 — Design system ✅

Tokens, DM Sans, the Kit CSS embed and `Icon`, motion presets, the shadcn primitives,
every feature component, and `/dev/kit` plus `/dev/kit-sharp` rendering them in their
states in both themes.

### Phase 2 — Mock data ✅

`db.json`, `entities/rows.ts`, the domain types and transforms, and the selectors in
`services/*`. No Zod, no route handlers, no SWR hooks, no tests: see the hard rules.

### Phase 3 — Sign-in and onboarding ✅

Wireframes: `onboarding/Sign-in.png`, `step-1.png`, `step-2.png`, `step-3.png`.

- Sign-in is a split layout: form left, pink panel right rounding into the page. The
panel is a flat pink block waiting on artwork.
- `(auth)/onboarding/layout.tsx` holds the rail: signing in counts as the first step and
is always done, so the three routes are steps two through four. One accent disc carries a
shared `layoutId`, so it slides between steps while `template.tsx` slides each form in.
- Steps are server components that read `services/onboarding` and hand data to a client
component beside them, which owns the form state and the navigation.
- `/` redirects on `db.json`'s `onboarded` flag; both actions on the last step open
`/agent`, a placeholder until Phase 4.
- The `(auth)` group has no layout of its own. Sign-in and the steps share nothing but a
background, and the group already keeps them out of the workspace shell.

### Phase 4 — Workspace shell ✅

Wireframes: `landing/landing(agent).png`, `agent/agent.png`,
`file-system/file system - right sidebar.png`, `pink-application.png`.

- `(workspace)/layout.tsx` is a server component: it reads the workspace, the threads, and
the current user from the selectors and hands them to `WorkspaceShell`.
- `WorkspaceShell` is the only client piece. It holds the collapsed flag, derives the
selected nav item and thread from `usePathname`, and routes every sidebar action. No
provider: nothing outside the shell reads this yet, so a context would be furniture.
- One `LayoutGroup` wraps the rail and the page, so shared `layoutId`s survive a route
change. The rail sits on the background and the page rounds into it with `rounded-l-surface`;
the header row is where the collapsed rail's chevron lives.
- `template.tsx` fades and slides each page. Placeholder pages cover `/agent`,
`/agent/[threadId]`, `/calendar`, `/analytics`, `/files`, and `/settings`; each phase
below deletes the one it replaces, and `page-placeholder.tsx` goes with the last of them.
- Columns for the chat, the files panel, and the right rail are added as siblings of the
page by the phases that build them.

### Phase 5 — Agent: landing and thread ✅

Wireframes: `landing/landing(agent).png`, `agent/agent.png`,
`agent/agent-interaction.png`.

- `AgentWorkspace` is one client component for both modes, because the composer has to be
one element: on send it stays mounted and its `layout` prop springs it from the hero
position into the dock while everything around it exits.
- Landing, in three presentational pieces so the composer can sit between them: the
greeting, the `Timeline` of `agent.activities` with actions and the two week calendar
strip below, and the right rail with stats, a mini chart, and Up next. Each is wrapped in
a `motion` element inside `AnimatePresence mode="popLayout"`, so the leaving landing drops
out of flow at once and the composer has a settled position to spring to.
- Thread: `AgentThread` renders the message list and follows the last part as it arrives.
Every part type in `db.json` renders, including the post draft, the scheduled graphic, the
asset picker, and charts.
- Replies are scripted. `agent.canned_replies` holds a default and a scheduling reply;
`AgentWorkspace` reveals the parts on a timer behind the thinking state. A timeline action
or a button in a reply sends a sentence on the user's behalf and picks the matching reply.
- The URL is replaced to `/agent/new` on the first send, so the rail reads as a thread
without a navigation that would unmount the composer. That path is not a stored thread, so
loading it directly redirects to `/agent`; `/agent/[threadId]` deep links normally.
- Done when: send morphs without a flash, a timeline action starts a thread, every part
renders, reduced motion works. Verified against a production build.

### Phase 6 — Previews and expand

Wireframes: `agent/calendar - in agent chat.png`, `agent/analytics - in agent.png`, then
`calendar/calendar page.png` for where the chat lands.

- `PreviewSurface` in the composer dock with calendar and analytics previews kept alive
by `Activity`, a dismiss chip, and an expand icon.
- Expanding routes to the page, whose block shares the preview's `layoutId`, while the
chat moves to the sidebar.
- Done when: the preview grows out of the composer, expand morphs into the page, and
returning to `/agent` puts the chat back in the center.

### Phase 7 — Calendar page

Wireframes: `calendar/calendar page.png`, plus `landing(agent).png` for the compact
strip.

- Toolbar (previous, Today, next, Day | Week | Month, search), the grid in three views,
chips by status, today marked, and the right rail.
- Selecting a post attaches it to the chat as context so the user can ask about it.
- Done when: all three views render from the selectors with staggered cells and the chat
sidebar coexists.

### Phase 8 — Analytics page

Wireframes: `analytics/analytics-page.png`, plus the landing right rail.

- Controls (range toggle, profile select, Export), four stat tiles, impressions over
time, a breakdown by post label, by profile bars, and top posts.
- Filters recompute through the selectors on change.
- Done when: charts are token-colored at the reference pink density, filters respond, and
the page morphs from the preview.

### Phase 9 — Files

Wireframes: `file-system/file system - right sidebar.png`,
`file-system/editing file - opens tab.png`.

- `FilesPanel` in flow on the right: search, Files and Skills tabs, the tree with org and
person sections, nested folders, an asset grid, and a hover edit affordance.
- The editor tab strip above the main column with the markdown editor beneath it, saving
inline and closing back to the thread.
- `/files` is the same tree, wider, with a preview column instead of the chat.
- Done when: open, browse, edit, save, and close all animate and the composer never
moves.

### Phase 10 — Settings

Wireframes: `settings/settings - profiles.png`,
`settings/settings - integrations (like crm).png`. General and API follow the same
patterns.

- Tabs as routes with the sliding indicator. General: org name, logo, members with roles,
theme. Profiles: search, add, list, and a detail pane with connection, company, persona,
and remove behind an `AlertDialog`. Integrations: connected rows with reconnect and an
available grid. API: the single key with reveal, copy, rotate, and revoke.
- Done when: every row and tile has hover and press, forms use `Field`, and destructive
actions use the Tailwind mapping.

### Phase 11 — Polish and audit

- Every wireframe side by side with the running app, screen by screen, in both themes.
- Keyboard and screen reader pass: focus order through the composer, previews, panel, and
editor; `aria` on the thinking state; titled dialogs.
- Confirm the grep gates in §10 pass and every morph animates on a compositor property.
- Short README for running the app.

---

## 9. Porting to imagine-app

The target is `~/Desktop/imagine-app/apps/web`, whose layering is documented in its
`CODEBASE.md`. Three of its folder names mean something specific, so the mock avoids
contradicting them:

| There | Means | Here |
| --- | --- | --- |
| `services/` | thin external SDK clients, no product logic | `src/services/` holds selectors. Rename on the way in, or fold each selector into its entity. |
| `entities/<x>/` | folder per domain object with `repository.ts`, `types/`, `utils/transform-*-row.ts`, an `index.ts` barrel | `src/entities/*.ts`, flat files, same type names |
| `lib/` | multi-service workflows | `src/lib/` holds formatting helpers, which belong in their `shared/utils/` |
| `app/api/**` | webhooks, cron, agent API | not used here |

What makes the port cheap:

- Domain types are copies of theirs where they exist: `Asset`, `Client`, `Post`,
`ClientPostStatus`, `MediaFile`, `AnalyticsTotals`, `TimeRange`. Components typed against
these keep compiling when the data source changes.
- Snake_case never escapes `src/entities`. On arrival, their generated
`services/supabase/schemas` replaces `rows.ts` and the transforms stay.
- Selectors take plain arguments and return plain objects, so they can sit behind
`repository.ts` on the server or a `queryOptions` factory on the client without changing
shape.

What the port still has to do, and should not be pre-solved here: `repository.ts` per
entity, TanStack Query keys and mutations, server actions, auth, and tenancy. Also expect
a cleanup pass on their side, since replacing `shared/components/primitives` breaks any
route still importing TailAdmin.

Route folder names here follow the redesign (`agent`, `calendar`, `analytics`, `files`,
`settings`) rather than the current app (`overview`, `tasks`, `profiles`, `assets`), so
the port maps them deliberately.

---

## 10. Verification

- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.
- Grep gates: no `lucide-react`, `material-symbols`, `framer-motion`, or raw hex outside
`src/styles/tokens.ts` and `globals.css`. No Tailwind palette colors (`text-red-600`), no
arbitrary type sizes (`text-[13px]`), and no control heights outside `h-control-*`: those
belong in `tokens.ts`. No raw `fa-` strings outside `Icon`. No em dash
anywhere under `src/`. No `style={{` anywhere; Recharts takes token variables as SVG
`fill` and `stroke` attributes in `chart-block.tsx`, the only place they appear as strings.
- Every page renders in light and dark from the single theme switch.
- Landing → thread, preview → page, chat → sidebar, and panel → editor tab are each one
continuous morph with no blank frame.
- Lists stagger on mount; every clickable element responds to hover and press.
- Pink appears only where `pink-application.png` shows it.

---

## 11. Open questions (do not block)

- The file tree shows two sections named "Acme", the workspace and the company page.
Rename one when Phase 9 lands.
