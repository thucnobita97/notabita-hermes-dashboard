# Hermes Dashboard Redesign - Separate App (Direction C)

## Executive Summary

Build a standalone Next.js dashboard at `~/dev/notabita-hermes-dashboard/` with a modern redesigned UI, proxying API calls to the existing Hermes dashboard backend (port 9119). No patches to hermes-agent source code.

**Goals:**
1. Modern UI with shadcn/ui (redesign from scratch)
2. 3 main pages: Overview, Sync, Setup Wizard
3. Proxy to Hermes backend (port 9119) - reuse all existing API endpoints
4. Real-time updates via polling
5. Fully independent from hermes-agent codebase

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + TypeScript
- UI: shadcn/ui + Tailwind CSS 4
- Backend: Hermes dashboard API (port 9119) - no modifications needed
- Auth: Session token (from `__HERMES_SESSION_TOKEN__`)
- Real-time: Polling (30s intervals)

**Timeline:** 7-10 days (6 phases, 17 tasks)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User (browser)                                         │
│  http://localhost:3000                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Hermes Dashboard (Next.js - NEW)                       │
│  ~/dev/notabita-hermes-dashboard/                       │
│  Port: 3000                                             │
│                                                         │
│  Pages:                                                 │
│  /              - Overview (status cards)                │
│  /sync          - Git sync management                   │
│  /setup         - Setup wizard                          │
│                                                         │
│  API Routes (proxy layer):                              │
│  /api/hermes/* → Hermes Backend (9119)                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Hermes Dashboard Backend (EXISTING)                    │
│  hermes_cli/web_server.py                               │
│  Port: 9119                                             │
│                                                         │
│  Existing Endpoints (no changes needed):                │
│  /api/status          - Gateway + system status         │
│  /api/git/status      - Git repo status                 │
│  /api/git/review/diff - File diff viewer                │
│  /api/git/review/stage, commit, push - Git actions      │
│  /api/config          - Config management               │
│  /api/env             - Environment variables           │
│  /api/sessions        - Session list                    │
│  /api/skills          - Skills management               │
│  /api/tools/toolsets  - Tools management                │
│  /api/cron/jobs       - Cron jobs                       │
└─────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown

### PHASE 1: Project Setup (1 day)

**Goal:** Initialize Next.js project with shadcn/ui

#### Task 1.1: Backup old dashboard
**Type:** MANUAL
**Time:** 15 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard
mkdir -p backup-20260917
mv index.html src data dist backup-20260917/
```

**Verification:** `ls backup-20260917/` shows 4 items

---

#### Task 1.2: Create Next.js project
**Type:** MANUAL (interactive CLI)
**Time:** 30 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --eslint \
  --no-turbopack
```

**Prompts:**
- src/ directory? → Yes
- App Router? → Yes
- Custom import alias? → No

**Verification:**
```bash
npm run dev  # → http://localhost:3000 shows Next.js welcome page
```

---

#### Task 1.3: Setup shadcn/ui
**Type:** MANUAL
**Time:** 30 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge dialog dropdown-menu input label tabs toast separator scroll-area
```

**Verification:** `ls src/components/ui/` shows ~10 component files

---

#### Task 1.4: Install additional dependencies
**Type:** MANUAL
**Time:** 15 minutes

**Steps:**
```bash
npm install httpx date-fns recharts lucide-react
npm install -D @types/node
```

**Verification:** `npm list httpx date-fns recharts` shows installed

---

#### Task 1.5: Create .env.local
**Type:** MANUAL (sensitive data)
**Time:** 15 minutes

**Steps:**
1. Get session token from browser DevTools when hermes dashboard runs:
   - Open http://localhost:9119
   - DevTools → Console → `window.__HERMES_SESSION_TOKEN__`
2. Create `.env.local`:
   ```
   HERMES_BACKEND_URL=http://localhost:9119
   HERMES_SESSION_TOKEN=<token_from_step_1>
   ```
3. Add to .gitignore:
   ```bash
   echo ".env.local" >> .gitignore
   ```

**Verification:** `cat .env.local` shows 2 env vars

---

#### Task 1.6: Create AGENTS.md
**Type:** DELEGATE
**Time:** 30 minutes
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**File:** `AGENTS.md` (root)

**Requirements:**
- Follow hermes-config-admin template (rule 5 in SOUL.md)
- Include: purpose, architecture, layout, conventions, commands, decisions, status
- Keep SHORT (summary only, details in docs/)
- 100% English (artifact rule 7)

**Verification:** File created, follows template structure

---

#### Task 1.7: Create skills/ directory
**Type:** DELEGATE
**Time:** 15 minutes
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**File:** `skills/README.md`

**Requirements:**
- Placeholder for project-specific skills
- Explain agentskills.io layout
- List planned skills (build, deploy, testing)
- 100% English (artifact rule 7)

**Verification:** `ls skills/` shows README.md

---

### PHASE 2: API Client + Hooks (1 day)

**Goal:** TypeScript client and React hooks for Hermes backend

#### Task 2.1: Implement API client
**Type:** DELEGATE
**Time:** 2 hours
**Provider/Model:** `deepinfra:deepseek-ai/DeepSeek-V4-Flash` (code generation)

**File:** `src/lib/api.ts`

**Requirements:**
1. Create `HermesApiClient` class:
   - Constructor reads `HERMES_BACKEND_URL` from env
   - Methods: `get(path)`, `post(path, data)`, `put(path, data)`, `delete(path)`
   - Headers: `X-Hermes-Session-Token` from env
   - Error handling: throw on non-2xx, parse error message

2. Type definitions:
   ```typescript
   interface StatusResponse {
     gateway: { running: boolean; uptime: number; ... }
     system: { memory_used: number; ... }
     ...
   }
   
   interface GitStatusResponse {
     branch: string
     ahead: number
     behind: number
     files: { path: string; status: string }[]
   }
   
   interface DiffResponse {
     diff: string  // unified diff format
   }
   ```

3. API endpoints to wrap:
   - GET `/api/status` → StatusResponse
   - GET `/api/git/status?path=<repo_path>` → GitStatusResponse
   - GET `/api/git/review/diff?path=<repo>&file=<file>` → DiffResponse
   - POST `/api/git/review/stage` {path, file}
   - POST `/api/git/review/commit` {path, message, push}
   - POST `/api/git/review/push` {path}
   - GET `/api/config` → ConfigResponse
   - GET `/api/env` → EnvResponse

4. Export singleton instance:
   ```typescript
   export const api = new HermesApiClient()
   ```

**Verification:** `npm run typecheck` passes

---

#### Task 2.2: Implement React hooks
**Type:** DELEGATE
**Time:** 2 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max` (hook logic)

**Files:**
- `src/hooks/use-polling.ts`
- `src/hooks/use-git-actions.ts`

**Requirements:**

**use-polling.ts:**
```typescript
function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number  // ms
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}
```
- Call fetcher immediately on mount
- Re-call every interval ms
- Cleanup interval on unmount
- Handle errors gracefully
- Support manual refetch

**use-git-actions.ts:**
```typescript
function useGitActions(repoPath: string): {
  status: GitStatusResponse | null
  loading: boolean
  error: Error | null
  stage: (file: string) => Promise<void>
  commit: (message: string, push?: boolean) => Promise<void>
  push: () => Promise<void>
  refetch: () => void
}
```
- Fetch git status on mount (via usePolling, 60s interval)
- Wrap API calls with loading states
- Toast notifications on success/error
- Auto-refetch after actions

**Verification:** Import hooks in test page, no errors

---

### PHASE 3: Overview Page (2 days)

**Goal:** Dashboard home page with 6 status cards

#### Task 3.1: Overview page structure
**Type:** DELEGATE
**Time:** 3 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**File:** `src/app/page.tsx`

**Layout:** 2x3 grid (responsive: 1 column on mobile, 2 on desktop)

```
┌─────────────────┬─────────────────┐
│   Repos Card    │  Skills Card    │
├─────────────────┼─────────────────┤
│  Plugins Card   │  Memory Card    │
├─────────────────┼─────────────────┤
│  Gateway Card   │ Containers Card │
└─────────────────┴─────────────────┘
```

**Cards:**
1. **Repos Card:**
   - List 3 repos (hermes-sync-git, hermes-openwebui-stack, hermes-agent fork)
   - Each repo: name, branch, ahead/behind badges
   - Color code: green (synced), yellow (ahead), red (behind)
   - Click → navigate to /sync with repo selected

2. **Skills Card:**
   - Total count (big number)
   - Categories breakdown (list)
   - Click → navigate to hermes dashboard /skills

3. **Plugins Card:**
   - List plugins with enabled/disabled badges
   - Count: X enabled / Y total
   - Click → navigate to hermes dashboard /plugins

4. **Memory Card:**
   - Progress bar (used/limit characters)
   - Percentage
   - Warning if >80%

5. **Gateway Card:**
   - Status indicator (green dot = up, red = down)
   - HTTP code
   - Uptime (if available)
   - Click → navigate to hermes dashboard /system

6. **Containers Card:**
   - List Docker containers (name, status, port)
   - Status badges (running/stopped)
   - Note: requires `docker ps` command - may need backend API or SSH

**Data fetching:**
- `usePolling(() => api.getStatus(), 30000)` for system status
- `usePolling(() => api.getGitStatus(repoPath), 60000)` for each repo
- Loading skeleton when fetching
- Error toast when API fails

**Interactions:**
- Click card → navigate to detail page (Link component)
- Refresh button (manual refetch) on each card

**Verification:** `npm run dev` → see grid of cards with mock data

---

#### Task 3.2: Card components
**Type:** DELEGATE
**Time:** 4 hours
**Provider/Model:** `deepinfra:deepseek-ai/DeepSeek-V4-Flash` (component generation)

**Files:**
- `src/components/cards/ReposCard.tsx`
- `src/components/cards/SkillsCard.tsx`
- `src/components/cards/PluginsCard.tsx`
- `src/components/cards/MemoryCard.tsx`
- `src/components/cards/GatewayCard.tsx`
- `src/components/cards/ContainersCard.tsx`

**Requirements:**
Each card component:
- Props: `data`, `loading`, `error`
- Uses shadcn Card component
- Skeleton when loading (shadcn Skeleton)
- Error state with retry button
- Hover effect (subtle shadow)
- Click handler for navigation

**Example (ReposCard):**
```typescript
interface ReposCardProps {
  repos: Array<{
    name: string
    path: string
    branch: string
    ahead: number
    behind: number
  }>
  loading: boolean
  error: Error | null
  onRefresh: () => void
}
```

**Verification:** Import cards into page.tsx, render successfully

---

### PHASE 4: Sync Page (2 days)

**Goal:** Git sync management with push/pull actions and diff viewer

#### Task 4.1: Sync page layout
**Type:** DELEGATE
**Time:** 4 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**File:** `src/app/sync/page.tsx`

**Layout:** 2 sections (Status + Diff)

```
┌─────────────────────────────────────────────┐
│  Status Section                             │
│  ┌─────────┬─────────┬────────────────────┐ │
│  │ Ahead X │Behind Y │ [Push] [Pull] [↻]  │ │
│  └─────────┴─────────┴────────────────────┘ │
│  Last sync: 5 mins ago                      │
│  Branch: main | Remote: git@github.com:...  │
├─────────────────────────────────────────────┤
│  Diff Section                               │
│  ┌─────────────────────────────────────────┐│
│  │ M config.yaml                           ││
│  │ A new-file.txt                          ││
│  │ D old-file.txt                          ││
│  └─────────────────────────────────────────┘│
│  Click file → expand inline diff viewer     │
└─────────────────────────────────────────────┘
```

**Status Section:**
- Tabs: 3 repos (hermes-sync-git, hermes-openwebui-stack, hermes-agent fork)
- Big numbers: Ahead X, Behind Y
- Last sync timestamp
- Branch name, remote URL
- Action buttons:
  - Push (primary, disabled if ahead=0)
  - Pull (secondary, disabled if behind=0) - NOTE: backend may not have pull endpoint
  - Refresh (icon button)
- Confirmation dialog for push/pull (if changes > 10 files)

**Diff Section:**
- List changed files (from `/api/git/status`)
- Each file: status icon (M/A/D), file path
- Click file → expand inline diff viewer
- "No changes" message if empty

**Data fetching:**
- `useGitActions(repoPath)` hook for status + actions
- Fetch diff on demand (when file clicked)
- Loading states

**Verification:** `npm run dev /sync` → see UI with mock data

---

#### Task 4.2: Git actions
**Type:** DELEGATE
**Time:** 3 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**Files:**
- `src/hooks/use-git-actions.ts` (update from Task 2.2)
- `src/app/sync/page.tsx` (update)

**Actions:**

1. **Push flow:**
   - Stage all changed files: POST `/api/git/review/stage` for each file
   - Commit with message: POST `/api/git/review/commit` {message, push: false}
   - Push: POST `/api/git/review/push`
   - Toast success/error
   - Refetch status

2. **Pull:**
   - Check if backend has pull endpoint
   - If not: show message "Pull not available via API, use CLI: `cd <repo> && git pull`"

**Verification:** Click Push → toast success, status updates

---

#### Task 4.3: Diff viewer component
**Type:** DELEGATE
**Time:** 3 hours
**Provider/Model:** `deepinfra:deepseek-ai/DeepSeek-V4-Flash` (component generation)

**File:** `src/components/DiffViewer.tsx`

**Requirements:**
- Props: `diff: string` (unified diff format), `loading: boolean`
- Parse diff lines (+/-/context)
- Color code: green (+), red (-), gray (context)
- Line numbers (optional)
- Collapsible sections (if multiple files)
- Loading skeleton when fetching diff

**Implementation:**
- Parse unified diff format
- Render each line with appropriate background color
- Use monospace font
- Optional: syntax highlight with `prismjs` or `shiki`

**Verification:** Click file → diff expands, syntax highlight OK

---

### PHASE 5: Setup Wizard (2 days)

**Goal:** Interactive setup wizard for new machines

#### Task 5.1: Setup page structure
**Type:** DELEGATE
**Time:** 4 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**File:** `src/app/setup/page.tsx`

**Layout:** Stepper + Log panel

```
┌─────────────────────────────────────────────┐
│  Stepper                                    │
│  [1. Prereq] → [2. Clone] → [3. Install] → │
│  [4. API Keys] → [5. Verify]               │
├─────────────────────────────────────────────┤
│  Current Step Content                       │
│  ┌─────────────────────────────────────────┐│
│  │ ✓ git                                  ││
│  │ ✓ node                                 ││
│  │ ✗ docker                               ││
│  └─────────────────────────────────────────┘│
│  [Start Setup] [Retry] [Skip]              │
├─────────────────────────────────────────────┤
│  Log Panel                                  │
│  [INFO] Cloning hermes-sync...             │
│  [OK] Clone complete                       │
│  [INFO] Installing dependencies...         │
└─────────────────────────────────────────────┘
```

**Steps:**

1. **Prerequisites Check:**
   - List requirements: git, node, npx, python3, uv, docker, hermes, codegraph
   - Each item: ✓ (green) or ✗ (red)
   - "All checks passed" or "Missing: X, Y"
   - Implementation: call backend API or simulate

2. **Clone Repos:**
   - List 3 repos (hermes-sync-git, hermes-openwebui-stack, hermes-agent fork)
   - Progress indicator (cloning...)
   - Success/fail status
   - Implementation: simulate (backend may not have clone endpoint)

3. **Install Binaries:**
   - List binaries: codegraph (required), ghidra-mcp (optional)
   - Progress indicator
   - Skip option for optional items
   - Implementation: simulate

4. **API Keys:**
   - Message: "Run 'hermes setup' in terminal to configure API keys"
   - Instructions with code block
   - Link to documentation

5. **Verify:**
   - Health checks: gateway status, container status, git sync status
   - Pass/fail list
   - "Setup complete!" message
   - Implementation: call `/api/status`, `/api/git/status`

**Stepper UI:**
- Horizontal stepper (shadcn Tabs or custom)
- Current step highlighted
- Previous steps clickable (navigate back)
- Next button (disabled if current step fails)

**Log Panel:**
- Auto-scroll
- Color-coded: [INFO] blue, [OK] green, [ERROR] red
- Max 500 lines (drop old)

**Verification:** `npm run dev /setup` → see stepper UI

---

#### Task 5.2: Setup wizard logic
**Type:** DELEGATE
**Time:** 3 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**File:** `src/hooks/use-setup-wizard.ts`

**Requirements:**

```typescript
function useSetupWizard(): {
  currentStep: number
  results: Record<number, StepResult>
  logs: string[]
  isRunning: boolean
  startSetup: () => void
  retryStep: () => void
  skipStep: () => void
}

interface StepResult {
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  message?: string
}
```

**Logic:**
- `startSetup()`: run steps sequentially
- Each step: update `results[step]`, append to `logs`
- Prerequisites: check via backend API or simulate
- Clone/Install: simulate with delays
- Verify: call real APIs

**State management:**
- `currentStep: number` (0-4)
- `results: Record<number, StepResult>`
- `logs: string[]`
- `isRunning: boolean`

**Verification:** Click "Start Setup" → stepper progresses, logs append

---

### PHASE 6: UI Polish + Testing (1 day)

**Goal:** Final styling, error handling, end-to-end testing

#### Task 6.1: Theme and styling
**Type:** DELEGATE
**Time:** 2 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**Files:**
- `src/app/globals.css` (theme variables)
- `src/app/layout.tsx` (dark mode class)

**Styling:**
- Dark mode by default
- Custom colors: slate base + blue accent
- Smooth transitions (200ms ease)
- Hover effects on cards
- Card shadows (subtle)
- Responsive breakpoints (mobile: 1 col, desktop: 2 cols)

**Verification:** Visual check - beautiful, consistent

---

#### Task 6.2: Error handling and loading states
**Type:** DELEGATE
**Time:** 3 hours
**Provider/Model:** `deepinfra:deepseek-ai/DeepSeek-V4-Flash`

**Files:** Update all pages

**Requirements:**
- Loading states:
  - Skeleton loaders for cards (shadcn Skeleton)
  - Spinner for actions
  - "Loading..." text

- Error states:
  - Error boundary (catch React errors)
  - Toast notifications (shadcn Toast)
  - Retry buttons
  - Friendly error messages

- Empty states:
  - "No data" messages
  - Placeholder illustrations (optional)

- Connection errors:
  - Detect backend down
  - Show banner: "Cannot connect to Hermes backend"
  - Auto-retry (exponential backoff)

**Verification:**
- Stop hermes backend → see error message
- Slow network → see loading skeleton
- API error → see toast notification

---

#### Task 6.3: End-to-end testing
**Type:** MANUAL
**Time:** 3 hours

**Steps:**
1. Start hermes dashboard: `hermes dashboard`
2. Start new dashboard: `npm run dev`
3. Test each page:
   - **Overview:** data loads from API, cards display correctly
   - **Sync:** push action works, diff viewer displays
   - **Setup:** wizard runs through all steps
4. Check browser DevTools:
   - Network tab: no CORS errors
   - Console: no React warnings
5. Test error cases:
   - Stop hermes backend → see error messages
   - Invalid API → see 401 error

**Verification:** All pages work, data displays correctly

---

#### Task 6.4: Documentation
**Type:** DELEGATE
**Time:** 2 hours
**Provider/Model:** `alibaba-token-plan:qwen3.7-max`

**Files:**
- `README.md`
- `docs/SETUP.md`
- `docs/API.md`

**Content:**

**README.md:**
- Overview (what is this dashboard)
- Screenshots (placeholder for each page)
- Quick start (3 steps: clone, install, run)
- Features list
- Tech stack
- Contributing (optional)

**docs/SETUP.md:**
- Prerequisites (Node 18+, npm, Hermes dashboard running)
- Step-by-step setup instructions
- Environment variables
- First run guide

**docs/API.md:**
- Hermes backend API endpoints used
- Request/response examples
- Authentication (session token)
- Error codes

**Verification:** `cat README.md` - all sections present

---

#### Task 6.5: Git commit and push
**Type:** MANUAL
**Time:** 30 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard
git add .
git commit -m "feat: implement separate dashboard with UI redesign

- Next.js 14 + shadcn/ui + Tailwind CSS
- 3 pages: Overview, Sync, Setup
- Proxy to hermes backend (port 9119)
- Real-time updates with polling
- Comprehensive documentation"
git push origin main
```

**Verification:** `git log --oneline -1` shows commit message

---

## Subagent Assignment Summary

### Tasks to delegate (DELEGATE): 11 tasks
- **Phase 2:** 2.1, 2.2 (API client + hooks)
- **Phase 3:** 3.1, 3.2 (Overview page + cards)
- **Phase 4:** 4.1, 4.2, 4.3 (Sync page + actions + diff viewer)
- **Phase 5:** 5.1, 5.2 (Setup page + wizard)
- **Phase 6:** 6.1, 6.2, 6.4 (Theme, error handling, docs)

### Tasks to do manually (MANUAL): 6 tasks
- **Phase 1:** 1.1, 1.2, 1.3, 1.4, 1.5 (backup, setup, deps, config)
- **Phase 6:** 6.3, 6.5 (testing, git commit)

### Model selection:
- **Code generation (boilerplate):** `deepinfra:deepseek-ai/DeepSeek-V4-Flash` (fast, cheap)
- **Logic-heavy tasks (hooks, state):** `alibaba-token-plan:qwen3.7-max` (strong reasoning)
- **Documentation:** `alibaba-token-plan:qwen3.7-max` (good writing)

---

## Risk Mitigation

### Risk 1: Session token expiration
**Issue:** Hermes session token expires, API calls fail with 401
**Mitigation:**
- Detect 401 errors
- Show banner: "Session expired, please refresh hermes dashboard and update .env.local"
- Instructions to get new token

### Risk 2: CORS issues
**Issue:** Browser blocks cross-origin requests (localhost:3000 → localhost:9119)
**Mitigation:**
- Use Next.js API routes as proxy layer
- Client calls `/api/hermes/*`, server proxies to `http://localhost:9119/api/*`
- Inject session token server-side (never expose to browser)

### Risk 3: Backend API changes
**Issue:** Hermes backend API changes, dashboard breaks
**Mitigation:**
- Pin to specific Hermes version in docs
- Test against known API endpoints
- Type definitions catch breaking changes

### Risk 4: Pull operation not available
**Issue:** Hermes backend may not have git pull endpoint
**Mitigation:**
- Check API documentation
- If not available: show message "Use CLI: `cd <repo> && git pull`"
- Focus on push (most common operation)

---

## Success Criteria

1. Dashboard accessible at http://localhost:3000
2. All 3 pages render with real data from backend
3. Sync push operations work
4. Setup wizard completes (simulated steps)
5. No CORS errors
6. Dark mode beautiful and consistent
7. Documentation complete
8. Git commit pushed to GitHub

---

## Timeline

| Phase | Duration | Dependencies | Can parallel? |
|-------|----------|--------------|---------------|
| 1. Project Setup | 1 day | None | ✗ |
| 2. API Client + Hooks | 1 day | Phase 1 | ✗ |
| 3. Overview Page | 2 days | Phase 2 | ✓ (with Phase 4) |
| 4. Sync Page | 2 days | Phase 2 | ✓ (with Phase 3) |
| 5. Setup Wizard | 2 days | Phase 2 | ✓ (with Phase 3, 4) |
| 6. UI Polish + Testing | 1 day | All | ✗ |
| **Total** | **7-10 days** | | |

---

## Next Steps

After plan approval:
1. Start with Phase 1.1 (backup old dashboard)
2. Execute tasks in dependency order
3. Delegate DELEGATE tasks to subagents
4. Verify each phase before proceeding
5. Commit + push after each major milestone
6. Update this plan file with progress notes