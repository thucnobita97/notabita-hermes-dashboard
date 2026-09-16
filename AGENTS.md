# AGENTS.md — Hermes Dashboard Redesign

> AUTO-LOADED context file: Hermes (and other agents) read this file automatically
> when working in the project directory. Keep it SHORT (a summary) — put details
> in hermes/CONTEXT.md or docs/ and LINK to them from here (read on demand,
> never preloaded). The project may add/remove sections as needed. Canonical
> template: hermes-config-admin skill (references/agents-md-template.md) —
> rule 5 in SOUL.md.

## Project purpose

Standalone Next.js dashboard for managing Hermes Agent across machines. Modern UI redesign with shadcn/ui, proxying API calls to existing Hermes dashboard backend (port 9119). No patches to hermes-agent source code.

## Architecture overview

```
Browser (localhost:3000)
  ↓
Next.js App (proxy layer)
  ↓
Hermes Dashboard Backend (localhost:9119)
```

- Frontend: Next.js 14 (App Router) + TypeScript + shadcn/ui + Tailwind CSS 4
- Backend: Existing Hermes dashboard API (no modifications)
- Auth: Session token (from `__HERMES_SESSION_TOKEN__`)
- Real-time: Polling (30s intervals)

## Directory layout

```
~/dev/notabita-hermes-dashboard/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── page.tsx            # Overview (status cards)
│   │   ├── sync/page.tsx       # Git sync management
│   │   └── setup/page.tsx      # Setup wizard
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── cards/              # Status cards
│   ├── lib/                    # Utilities
│   │   └── api.ts              # Hermes API client
│   └── hooks/                  # React hooks
│       ├── use-polling.ts
│       └── use-git-actions.ts
├── docs/                       # Documentation
│   └── plan-dashboard-redesign.md
├── skills/                     # Project-specific skills
└── .env.local                  # API config (gitignored)
```

## Conventions

- Language: TypeScript strict mode
- Components: shadcn/ui + Tailwind CSS
- API calls: via `src/lib/api.ts` client, never direct fetch
- State: React hooks (no Redux/Zustand)
- Styling: Tailwind utility classes, dark mode default
- Commits: conventional commits (feat:, fix:, docs:, chore:)

## Commands

```bash
# Install dependencies
npm install

# Run dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Key decisions

- **Separate app (not patching hermes-agent)** — Avoids conflicts with `hermes update`, independent deployment, full UI redesign freedom (Decision: 2026-09-17)
- **Proxy to port 9119** — Reuse existing Hermes dashboard backend, no duplicate API work (Decision: 2026-09-17)
- **Polling instead of WebSocket** — Simpler implementation, sufficient for status updates (Decision: 2026-09-17)

## Current status

**Phase:** Planning approved, pending implementation (2026-09-17)

**Next steps:**
1. Setup Next.js project (Phase 1)
2. Implement API client + hooks (Phase 2)
3. Build Overview, Sync, Setup pages (Phases 3-5)
4. UI polish + testing (Phase 6)

**Timeline:** 7-10 days

## Project skills

No project-specific skills yet. The `skills/` directory follows agentskills.io layout for future workflows (build, deploy, testing).

## Details

- Plan: [docs/plan-dashboard-redesign.md](./docs/plan-dashboard-redesign.md)
- Hermes backend API: runs on port 9119 (`hermes dashboard` command)
- Old dashboard backup: `backup-20260917/` (to be created during Phase 1)
