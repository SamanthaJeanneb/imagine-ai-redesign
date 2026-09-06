# Imagine AI — UI & Component Redesign

## What this project is

A redesign of the UI and component structure for an existing application. Every page,
component, and layout gets built against **mock data shaped like the current production
database**, so real business logic and live data can be dropped in later without
restructuring anything.

Mock data is a placeholder for the data source only — never for code quality. All code
follows strict, idiomatic TypeScript and stays production-ready.

## Design inputs

Wireframes define the pages and interactions. They live in `wireframes/`. Color
palettes are in `pallete-light.png` and `pallete-dark.png` at the repo root.
`pink-application.png` shows how much pink to use: the same wireframe with pink
applied, not extra chrome. The typeface is **DM Sans** for both headings and body copy.

The wireframes are structural only: they fix layout and behavior, not visual polish.

Where the wireframes are explicit, follow them exactly. Where they leave a decision open,
make a deliberate choice consistent with the rules below.

## Stack

- React and Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui as the component base
- Motion for animation
- Font Awesome **Sharp** icon set

## Design system rules

### Color and tokens

Every color lives in one central token file. Nothing hardcodes a color value.

- Palette tokens are named `imagine-*`: `imagine-primary`, `imagine-secondary`, and so on.
  Source values come from `pallete-light.png` and `pallete-dark.png`. Pink usage
  follows `pink-application.png` — that density, not more.
- Spacing tokens follow the same convention: `imagine-spacing-xs`, `imagine-spacing-s`, etc.
- Colors that are not palette-specific — warnings, errors, and similar states — come from
  the Tailwind palette rather than the `imagine-*` namespace.
- Light and dark mode both resolve from these tokens through a single switch.

### Type

**DM Sans** for headings and body copy. No second family.

### Components

- shadcn is the starting point, not the finished product. Components must be customized far
  enough that they don't read as out-of-the-box shadcn.
- Every component pulls from the token system.
- Components are centralized. Pages compose them and stay minimal — layout and data wiring,
  not markup detail.
- No inline styles. All styling resolves through the centralized system.

### Shape and structure

- Buttons use a 6px radius.
- Nothing has a sharp-cornered outline.
- Outlines on components stay as minimal as possible; outlined buttons appear only where
  genuinely necessary.
- Cards are used only when absolutely needed. Default to no card.
- Sections are not walled off by divider lines. The sidebar rounds into the main page
  component rather than sitting behind a hard edge.

### Copy and labeling

No eyebrow labels, no filler text, no quantifiers that aren't carrying information. If a
label isn't doing a job, it doesn't ship.

### Menus

Menu selection should feel tasteful and specific to this product — not a default highlight
bar.

### Icons

Font Awesome Sharp only. **No Lucide icons anywhere.**

> Setup note: the Sharp icon packs (`@fortawesome/sharp-*-svg-icons`) are Font Awesome Pro
> packages and are not on the public npm registry. Installing them requires a Font Awesome
> Pro token configured against the `@fortawesome` registry scope in `.npmrc`.

### Visual references

Ramp, Notion (drag-and-drop feel and clean chat experience), and iOS (animation character)
are directional inspiration, not constraints. The wireframes take precedence.

## Motion

Motion is a requirement, not a finishing touch. Everything moves, and things move together.
Elements slide, blur, or fade smoothly without blocking user actions or adding cognitive
load.

- **Hover micro-interactions on everything clickable** — buttons, nav items, calendar cells,
  cards. No dead elements.
- **Shared-element transitions** — `layoutId`-based morphing, not fade-out then fade-in.
  Specifically: chat moving from the main page into the sidebar, and the calendar going from
  a popup out of the chat bar to the full page when expanded.
- **Staggered list and grid entrances** — posts, calendar days, and sidebar sections animate
  in with a slight per-item delay.
- **Tactile press states** — scale down on click, spring back on release.
- **Skeleton loading with shimmer** — an animated gradient sweep, not static gray.
- **Page transition layer** — fade or slide on route change, fast (150–200ms).
- **Cursor-aware hover effects** — scoped specifically to nav, primary buttons, and cards.
- **Toast and notification entrances** — slide in with spring, fade on dismiss.

### AI interaction

The agent needs a distinct **thinking** state, visually separate from a generic spinner.

## Folder structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── agent/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── files/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── integrations/page.tsx
│   │   └── layout.tsx
│   └── api/
│       ├── agent/route.ts
│       ├── calendar/route.ts
│       └── files/route.ts
│
├── components/
│   ├── ui/                          # Button, Modal, Input, shared across all four
│   └── features/
│       ├── agent/
│       │   ├── ChatThread.tsx
│       │   └── AgentStatus.tsx
│       ├── calendar/
│       │   ├── CalendarGrid.tsx
│       │   └── PostSlot.tsx
│       ├── files/
│       │   ├── FileTree.tsx
│       │   └── FilePreview.tsx
│       └── settings/
│           ├── IntegrationCard.tsx
│           └── AccountForm.tsx
│
├── hooks/
│   ├── useAgent.ts
│   ├── useCalendar.ts
│   ├── useFileSystem.ts
│   └── useSettings.ts
│
├── services/
│   ├── agent/
│   │   ├── orchestration.ts         # calls into the Mastra agent
│   │   └── memory.ts                # agent's persistent + session filesystem logic
│   ├── calendar/
│   │   └── scheduling.ts            # post scheduling, LinkedIn timing rules
│   ├── files/
│   │   ├── storage.ts               # Supabase storage, TUS uploads
│   │   └── tree.ts                  # file-tree structure logic
│   └── settings/
│       └── integrations.ts          # LinkedIn/CRM connection management
│
├── entities/
│   ├── agent.ts                     # AgentSession, AgentMessage types
│   ├── calendar.ts                  # ScheduledPost, TimeSlot types
│   ├── file.ts                      # FileNode, FileMetadata types
│   └── settings.ts                  # UserSettings, Integration types
│
├── lib/
│   ├── date.ts
│   └── format.ts
│
├── shared/
│   └── constants.ts
│
└── styles/
    ├── globals.css
    └── tokens.ts
```

## Installed agent skills

These are installed in this repo and should be referenced while building.

| Skill | Source | Location |
| --- | --- | --- |
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/blob/react-best-practices/skills/react-best-practices/SKILL.md) | `.agents/skills/vercel-react-best-practices` |
| `mastering-typescript` | [SpillwaveSolutions/mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill) | `.agents/skills/mastering-typescript` |
| `shadcn` | [shadcn/ui](https://github.com/shadcn-ui/ui) | `.agents/skills/shadcn` |
| `motion` | [Motion AI Kit](https://motion.dev/docs/ai-kit-install) | `.cursor/skills/motion` |

Motion's hosted MCP servers (`motion`, `motion-plus`) are registered in `.cursor/mcp.json`.
Motion+ features unlock by signing in to the `motion-plus` server from the MCP menu.

Reinstall or update with:

```bash
npx skills update
```

## Open items

- Wireframes for all pages and interactions
- Schema reference: see `SCHEMA.md` (snapshot of `imagine-app` Postgres)
- Font Awesome Pro credentials for the Sharp icon packs
