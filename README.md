# Hermes Dashboard

A standalone Next.js dashboard for managing [Hermes Agent](https://github.com/NousResearch/hermes-agent) across multiple machines. Provides a modern web UI for monitoring status, syncing git repositories, and running setup wizards on remote hosts.

## Screenshots

| Overview | Sync | Setup Wizard |
|----------|------|-------------|
| ![Overview](docs/screenshots/overview.png) | ![Sync](docs/screenshots/sync.png) | ![Setup](docs/screenshots/setup.png) |

> *Screenshots coming soon — placeholders above.*

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/notabita-hermes-dashboard.git
cd notabita-hermes-dashboard

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local   # or create .env.local manually (see below)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Overview Page (`/`)
Six status cards providing a real-time snapshot of your Hermes Agent instance:
- **Gateway** — Agent version, uptime, model, and provider status
- **Repositories** — Tracked repos and their sync state
- **Skills** — Loaded skills count and categories
- **Plugins** — Active plugins and their health
- **Memory** — Memory system status and usage
- **Containers** — Running container/daemon information

### Sync Page (`/sync`)
Full git management interface for multiple repositories:
- **Branch status** — Current branch, ahead/behind counts
- **File list** — Changed files with status badges (modified, added, deleted, untracked)
- **Diff viewer** — Inline syntax-highlighted diffs for any file
- **Stage & commit** — Stage individual files, write commit messages, commit directly
- **Push** — Push committed changes to the remote

### Setup Wizard (`/setup`)
Step-by-step wizard for configuring new machines:
- **Stepper UI** — Visual progress through setup phases
- **Checklist items** — Each step shows pass/fail checks with details
- **Log panel** — Real-time log output with color-coded severity
- **Controls** — Start, retry, skip steps, or navigate between phases

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Date formatting | [date-fns](https://date-fns.org/) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Toast notifications | [Sonner](https://sonner.emilkowal.ski/) |

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# URL of the Hermes Agent backend (default: http://localhost:9119)
HERMES_BACKEND_URL=http://localhost:9119

# Session token for authenticating with the Hermes backend
# (see docs/SETUP.md for how to obtain this)
HERMES_SESSION_TOKEN=your-session-token-here
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HERMES_BACKEND_URL` | No | `http://localhost:9119` | Base URL of the Hermes Agent dashboard backend |
| `HERMES_SESSION_TOKEN` | Yes | — | Bearer token for API authentication |

## Architecture

```
Browser ──► Next.js App (port 3000) ──► Hermes Backend (port 9119)
                │
                └─ API Proxy (/api/hermes/*)
                   Injects session token server-side
                   Forwards all requests to backend
```

The dashboard uses a **proxy pattern** — the Next.js API route at `/api/hermes/[...path]` forwards requests to the Hermes backend while injecting the `Authorization: Bearer <token>` header server-side. The session token is never exposed to the browser.

## Project Structure

```
src/
├── app/
│   ├── api/hermes/[...path]/route.ts   # Backend proxy (all HTTP methods)
│   ├── page.tsx                         # Overview page (/)
│   ├── sync/page.tsx                    # Sync page (/sync)
│   ├── setup/page.tsx                   # Setup wizard (/setup)
│   ├── layout.tsx                       # Root layout + theme provider
│   └── globals.css                      # Tailwind + global styles
├── components/
│   ├── cards/                           # Overview page status cards
│   ├── ui/                              # shadcn/ui primitives
│   └── DiffViewer.tsx                   # Inline diff renderer
├── hooks/
│   ├── use-polling.ts                   # Generic polling hook
│   ├── use-git-actions.ts               # Git stage/commit/push actions
│   └── use-setup-wizard.ts              # Setup wizard state machine
└── lib/
    ├── api.ts                           # Server-side API client
    ├── client-api.ts                    # Browser-side API client
    └── utils.ts                         # Utility functions (cn, etc.)
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (port 3000) |
| `npm run build` | Create production build |
| `npm start` | Start production server (after build) |
| `npm run lint` | Run ESLint |

## Documentation

- [Setup Guide](docs/SETUP.md) — Detailed installation and configuration instructions
- [API Reference](docs/API.md) — Hermes backend API endpoints used by this dashboard

## License

MIT
