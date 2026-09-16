# Hermes Dashboard - Local Web Control Plane

## Executive Summary

Build a local web dashboard to manage Hermes Agent across machines, replacing the static GitHub Pages dashboard with an interactive control plane that integrates with the agent via tools.

**Goals:**
1. Real-time monitoring: repos, skills, plugins, gateway, containers
2. Direct operations: git-sync push/pull, setup new machine
3. Agent integration: tools for chat-based management
4. Local vs remote comparison: diff view, ahead/behind
5. Live logs: streaming from Gateway, git-sync, Docker

**Tech Stack:**
- Frontend: Next.js 14 + shadcn/ui + Tailwind CSS
- Backend: 2 APIs (Gateway port 8642 + OWUI backend port 8000)
- Auth: API key (Bearer token)
- Real-time: Server-Sent Events (SSE) for logs

**Timeline:** 10-14 days (6 phases, 32 tasks)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User (browser)                                         │
│  http://localhost:3001                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Hermes Dashboard (Next.js)                             │
│  ~/dev/notabita-hermes-dashboard/                       │
│  Port: 3001                                             │
│                                                         │
│  Pages:                                                 │
│  /              - Overview                              │
│  /sync          - Sync management                       │
│  /setup         - Setup wizard                          │
│  /rag           - RAG/Code search                       │
│  /logs          - Live logs                             │
│  /settings      - Config                                │
│                                                         │
│  API Routes (proxy layer):                              │
│  /api/gateway/* → Gateway (8642)                        │
│  /api/owui/*    → OWUI Backend (8000)                   │
└────────┬──────────────────────────┬─────────────────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│  Gateway API       │    │  OWUI Backend      │
│  Port: 8642        │    │  Port: 8000        │
│                    │    │                    │
│  Endpoints:        │    │  Endpoints:        │
│  /api/status       │    │  /api/projects     │
│  /api/sync/*       │    │  /api/query        │
│  /api/setup/*      │    │  /api/index        │
│  /api/logs         │    │  /api/collections  │
│                    │    │                    │
│  Management:       │    │  RAG:              │
│  - git-sync        │    │  - Code search     │
│  - Skills/plugins  │    │  - Index projects  │
│  - Setup wizard    │    │  - Collections     │
│  - Logs streaming  │    │                    │
└────────────────────┘    └────────────────────┘
```

---

## Phase Breakdown

### PHASE 1: Gateway API Endpoints (2-3 days)

**Goal:** Add endpoints to hermes-agent fork for dashboard integration

#### Task 1.1: Analyze existing Gateway code
**Type:** 🔴 BLOCKING (read real code)
**Time:** 1-2 hours

**Steps:**
1. Read `~/.hermes/hermes-agent/gateway/` - list files
2. Read `gateway/main.py` or `gateway/app.py` - understand routing
3. Check existing endpoints
4. Identify best place to add new router

**Input:** Gateway source code
**Output:** Understanding of:
- Gateway entry point
- Routing mechanism
- Existing middleware
- Best location for new router

**Verification:** Summarize Gateway structure in 1 paragraph

---

#### Task 1.2: Design API schema
**Type:** 🟢 DELEGATE (can assign to subagent)
**Time:** 1 hour

**Delegate to subagent:**
```
Goal: Design OpenAPI schema for Hermes Dashboard Gateway API

Context:
- Gateway runs on port 8642
- Need endpoints: /api/status, /api/sync/*, /api/setup/*, /api/logs
- Auth: Bearer token
- Response format: JSON

Requirements:
1. List all required endpoints
2. For each endpoint, define:
   - Method (GET/POST)
   - Path
   - Query params (if any)
   - Request body schema (if POST)
   - Response schema (JSON)
   - Error cases
3. Design consistent naming conventions
4. Consider pagination for logs endpoint

Output format: Markdown with tables for each endpoint
```

**Input:** Requirements from plan
**Output:** API schema document (markdown)

**Verification:** Schema is complete, consistent, covers all use cases

---

#### Task 1.3: Implement `gateway/api_dashboard.py`
**Type:** 🟢 DELEGATE (code generation)
**Time:** 2-3 hours

**Delegate to subagent:**
```
Goal: Implement FastAPI router for Hermes Dashboard API

Context:
- File: ~/.hermes/hermes-agent/gateway/api_dashboard.py
- Framework: FastAPI
- Auth: Bearer token from env var DASHBOARD_API_KEY

Requirements:
1. Create FastAPI APIRouter with prefix="/api"
2. Implement auth dependency (verify Bearer token)
3. Implement endpoints (per schema from Task 1.2):
   - GET /api/status
   - GET /api/sync/status
   - POST /api/sync/push
   - POST /api/sync/pull
   - GET /api/compare
   - GET /api/diff/{path}
   - GET /api/setup/check
   - GET /api/logs
   - GET /api/logs/stream (SSE)
4. Error handling (try-except, proper HTTP status codes)
5. Logging (logger.info for each request)
6. Helper functions:
   - get_repos_info() - read git info from 3 repos
   - get_skills_info() - count skills from ~/.hermes/skills/
   - get_plugins_info() - read from config.yaml
   - etc.

Output: Complete Python file ready to import

Notes:
- Use subprocess to call hermes CLI commands
- Use pathlib for file operations
- Use asyncio for SSE streaming
- CORS will be configured in main.py, not here
```

**Input:** API schema (Task 1.2)
**Output:** `api_dashboard.py` file

**Verification:** 
- File syntax correct (python -m py_compile)
- Can import from main.py
- No circular imports

---

#### Task 1.4: Register router in `gateway/main.py`
**Type:** 🔴 BLOCKING (edit real file)
**Time:** 30 minutes

**Steps:**
1. Read current `gateway/main.py`
2. Add import:
   ```python
   from gateway.api_dashboard import router as dashboard_router
   ```
3. Register router:
   ```python
   app.include_router(dashboard_router)
   ```
4. Add CORS middleware (if not present):
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3001"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

**Input:** Current `main.py` + `api_dashboard.py`
**Output:** Updated `main.py`

**Verification:**
```bash
cd ~/.hermes/hermes-agent
python -c "from gateway.main import app; print('OK')"
```

---

#### Task 1.5: Test endpoints
**Type:** 🔴 BLOCKING (test on real system)
**Time:** 1-2 hours

**Steps:**
1. Start Gateway (if not running):
   ```bash
   ~/.hermes/scripts/start-hermes-gateway.sh
   ```
2. Set API key:
   ```bash
   export DASHBOARD_API_KEY=***
   ```
3. Test each endpoint:
   ```bash
   # Status
   curl -H "Authorization: Bearer $DASHB..._KEY" http://localhost:8642/api/status | jq
   
   # Sync status
   curl -H "Authorization: Bearer $DASHB..._KEY" http://localhost:8642/api/sync/status | jq
   
   # Compare
   curl -H "Authorization: Bearer $DASHB..._KEY" http://localhost:8642/api/compare | jq
   
   # Setup check
   curl -H "Authorization: Bearer $DASHB..._KEY" http://localhost:8642/api/setup/check | jq
   
   # Logs
   curl -H "Authorization: Bearer $DASHB..._KEY" "http://localhost:8642/api/logs?lines=10" | jq
   ```
4. Test error cases:
   - Missing/wrong API key → 401
   - Invalid endpoint → 404
   - Server error → 500 with message

**Input:** Gateway running + API endpoints
**Output:** Test results (pass/fail for each endpoint)

**Verification:** All endpoints return expected JSON

---

#### Task 1.6: Fix bugs (if any)
**Type:** 🔴 BLOCKING (debug real issues)
**Time:** 1-2 hours (depends on bugs)

**Steps:**
1. Review test results from Task 1.5
2. Identify bugs
3. Fix in `api_dashboard.py`
4. Restart Gateway
5. Re-test

**Input:** Test results + bugs
**Output:** Fixed endpoints

**Verification:** Re-run tests, all pass

---

### PHASE 2: Dashboard Frontend Setup (1 day)

**Goal:** Initialize Next.js project with shadcn/ui

#### Task 2.1: Backup old dashboard
**Type:** 🔴 BLOCKING (filesystem operation)
**Time:** 15 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard
mkdir -p backup-$(date +%Y%m%d)
mv index.html backup-$(date +%Y%m%d)/
mv src backup-$(date +%Y%m%d)/
mv data backup-$(date +%Y%m%d)/
```

**Input:** Old dashboard files
**Output:** Backup directory

**Verification:** Files moved successfully

---

#### Task 2.2: Create Next.js project
**Type:** 🔴 BLOCKING (interactive CLI)
**Time:** 30 minutes

**Steps:**
```bash
cd ~/dev
# Remove old dir (after backup)
rm -rf notabita-hermes-dashboard

# Create Next.js app
npx create-next-app@latest notabita-hermes-dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --eslint \
  --no-turbopack

cd notabita-hermes-dashboard
```

**Prompts** (answer when asked):
- Would you like to use `src/` directory? → Yes
- Would you like to use App Router? → Yes
- Would you like to customize the default import alias? → No

**Input:** Empty directory
**Output:** Next.js project structure

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000
# Expected: Next.js welcome page
```

---

#### Task 2.3: Setup shadcn/ui
**Type:** 🔴 BLOCKING (interactive CLI)
**Time:** 30 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard

# Init shadcn
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card badge dialog dropdown-menu input label tabs toast separator scroll-area
```

**Prompts:**
- Which style would you like to use? → Default
- Which color would you like to use as base color? → Slate
- Do you want to use CSS variables for colors? → Yes

**Input:** Next.js project
**Output:** shadcn/ui components in `src/components/ui/`

**Verification:**
```bash
ls src/components/ui/
# Expected: button.tsx, card.tsx, badge.tsx, etc.
```

---

#### Task 2.4: Install additional dependencies
**Type:** 🔴 BLOCKING (npm install)
**Time:** 15 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard

# HTTP client
npm install httpx

# Date formatting
npm install date-fns

# Charts
npm install recharts

# Icons (already in shadcn, but ensure)
npm install lucide-react

# Monaco editor (for diff viewer)
npm install @monaco-editor/react

# Dev deps
npm install -D @types/node
```

**Input:** package.json
**Output:** Updated dependencies

**Verification:**
```bash
npm list httpx date-fns recharts
# Expected: packages installed
```

---

#### Task 2.5: Create project structure
**Type:** 🟢 DELEGATE (file creation)
**Time:** 1 hour

**Delegate to subagent:**
```
Goal: Create project structure for Hermes Dashboard Next.js app

Context:
- Project path: ~/dev/notabita-hermes-dashboard
- Framework: Next.js 14 + shadcn/ui
- Already have: src/app/, src/components/ui/

Requirements:
1. Create directories:
   - src/app/sync/
   - src/app/setup/
   - src/app/rag/
   - src/app/logs/
   - src/app/settings/
   - src/components/dashboard/
   - src/lib/
   - src/hooks/

2. Create placeholder files:
   - src/app/sync/page.tsx (empty Next.js page)
   - src/app/setup/page.tsx
   - src/app/rag/page.tsx
   - src/app/logs/page.tsx
   - src/app/settings/page.tsx
   - src/lib/api.ts (empty export)
   - src/lib/utils.ts (cn helper if not present)
   - src/hooks/use-polling.ts (empty hook)
   - src/hooks/use-sse.ts (empty hook)

3. Update src/app/layout.tsx:
   - Add dark mode class
   - Add Inter font
   - Add metadata (title: "Hermes Dashboard")

4. Update src/app/page.tsx:
   - Simple "Welcome to Hermes Dashboard" message
   - Import + use Button component from shadcn

Output: All files created with basic content

Notes:
- Use "use client" directive for interactive components
- Follow Next.js App Router conventions
- Import shadcn components correctly
```

**Input:** Next.js project structure
**Output:** Complete directory structure + placeholder files

**Verification:**
```bash
find src -type f -name "*.tsx" -o -name "*.ts" | wc -l
# Expected: ~15-20 files
```

---

#### Task 2.6: Create .env.local
**Type:** 🔴 BLOCKING (sensitive data)
**Time:** 15 minutes

**Steps:**
1. Generate API key:
   ```bash
   openssl rand -hex 32
   ```
2. Create `.env.local`:
   ```bash
   cat > ~/dev/notabita-hermes-dashboard/.env.local << 'EOF'
   GATEWAY_URL=http://localhost:8642
   OWUI_URL=http://localhost:8000
   DASHBOARD_API_KEY=***
   EOF
   ```
3. Add to .gitignore (if not present):
   ```bash
   echo ".env.local" >> ~/dev/notabita-hermes-dashboard/.gitignore
   ```

**Input:** API key + URLs
**Output:** `.env.local` file

**Verification:**
```bash
cat ~/dev/notabita-hermes-dashboard/.env.local
# Expected: 3 env vars
```

---

#### Task 2.7: Update next.config.js
**Type:** 🔴 BLOCKING (edit config)
**Time:** 30 minutes

**Steps:**
1. Read current `next.config.js`
2. Add rewrites:
   ```javascript
   const nextConfig = {
     async rewrites() {
       return [
         {
           source: '/api/gateway/:path*',
           destination: `${process.env.GATEWAY_URL}/api/:path*`,
         },
         {
           source: '/api/owui/:path*',
           destination: `${process.env.OWUI_URL}/api/:path*`,
         },
       ]
     },
   }
   ```

**Input:** Current `next.config.js`
**Output:** Updated config with rewrites

**Verification:**
```bash
npm run build
# Expected: Build successful, no errors
```

---

### PHASE 3: Dashboard Pages Implementation (3-4 days)

**Goal:** Implement all pages with complete UI

#### Task 3.1: Implement API client (`src/lib/api.ts`)
**Type:** 🟢 DELEGATE
**Time:** 1 hour

**Delegate to subagent:**
```
Goal: Implement TypeScript API client for Hermes Dashboard

Context:
- File: src/lib/api.ts
- Framework: Next.js (client-side)
- Endpoints: Gateway (8642) + OWUI (8000)

Requirements:
1. Create ApiClient class:
   - Constructor(baseUrl: string, apiKey: ***
   - Methods: get(endpoint), post(endpoint, data), delete(endpoint)
   - Headers: Authorization: *** Content-Type: application/json
   - Error handling: throw on non-2xx, parse error message

2. Export instances:
   - gateway: new ApiClient('/api/gateway', '')  // proxy handles auth
   - owui: new ApiClient('/api/owui', '')

3. Type definitions:
   - interface StatusResponse { repos, skills, plugins, ... }
   - interface SyncStatusResponse { output, success }
   - interface CompareResponse { ahead, behind, files }
   - etc.

4. Helper functions:
   - fetchWithAuth(endpoint, options)
   - handleResponse(response)

Output: Complete api.ts with types + client

Notes:
- Use proxy routes (/api/gateway, /api/owui) to avoid CORS
- API key will be injected by proxy layer (server-side)
- Client-side only needs to call relative URLs
```

**Input:** API endpoints list
**Output:** `src/lib/api.ts` file

**Verification:**
```typescript
// Test import
import { gateway, owui } from '@/lib/api'
console.log(gateway) // Expected: ApiClient instance
```

---

#### Task 3.2: Implement hooks (`use-polling.ts`, `use-sse.ts`)
**Type:** 🟢 DELEGATE
**Time:** 1 hour

**Delegate to subagent:**
```
Goal: Implement custom React hooks for real-time data

Context:
- Files: src/hooks/use-polling.ts, src/hooks/use-sse.ts
- Framework: React 18 + Next.js

Requirements:

1. use-polling.ts:
   - Signature: usePolling<T>(fetcher: () => Promise<T>, interval: number)
   - Returns: { data, loading, error, refetch }
   - Behavior:
     * Call fetcher immediately on mount
     * Re-call every interval ms
     * Cleanup interval on unmount
     * Handle errors gracefully
     * Support manual refetch

2. use-sse.ts:
   - Signature: useSSE(url: string, onMessage: (data: any) => void)
   - Returns: { connected, error, close }
   - Behavior:
     * Connect to EventSource on mount
     * Parse JSON messages
     * Auto-reconnect on error (max 3 retries)
     * Cleanup on unmount
     * Support manual close

Output: 2 hook files with TypeScript types

Notes:
- Use useEffect + useRef for cleanup
- Handle SSR (check window !== undefined)
- Add loading states
```

**Input:** Hook requirements
**Output:** 2 hook files

**Verification:**
```typescript
// Test in component
const { data } = usePolling(() => gateway.get('/status'), 30000)
console.log(data) // Expected: status data every 30s
```

---

#### Task 3.3: Implement Overview page (`src/app/page.tsx`)
**Type:** 🟢 DELEGATE
**Time:** 2-3 hours

**Delegate to subagent:**
```
Goal: Implement Overview page for Hermes Dashboard

Context:
- File: src/app/page.tsx
- Framework: Next.js + shadcn/ui
- Data source: gateway.get('/api/status')

Requirements:
1. Layout: Grid layout (2 columns on desktop, 1 on mobile)
2. Cards (each card is shadcn Card component):

   a. Repos Card:
      - List 3 repos (hermes-sync, stack, fork)
      - Each repo: name, branch, ahead/behind badges
      - Color code: green (synced), yellow (ahead), red (behind)
   
   b. Skills Card:
      - Total count (big number)
      - Categories breakdown (list or chart)
   
   c. Plugins Card:
      - List plugins with enabled/disabled badges
      - Count: X enabled / Y total
   
   d. Cron Jobs Card:
      - List cron jobs (name, schedule)
      - Count
   
   e. Memory Card:
      - Progress bar (used/limit)
      - Percentage
   
   f. Gateway Card:
      - Status indicator (green dot = up, red = down)
      - HTTP code
      - Uptime (if available)
   
   g. Containers Card:
      - List containers (name, status, port)
      - Status badges (running, stopped)

3. Data fetching:
   - Use usePolling hook (30s interval)
   - Loading skeleton when fetching
   - Error state (toast notification)

4. Interactions:
   - Click card → navigate to detail page (Link component)
   - Refresh button (manual refetch)

Output: Complete page.tsx with UI + data fetching

Notes:
- Use "use client" directive
- Import shadcn components: Card, CardHeader, CardTitle, CardContent, Badge, Button
- Use lucide-react icons
- Responsive design (Tailwind grid)
```

**Input:** API client + hooks
**Output:** Overview page

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000
# Expected: Grid of cards with data from API
```

---

#### Task 3.4: Implement Sync page (`src/app/sync/page.tsx`)
**Type:** 🟢 DELEGATE
**Time:** 3-4 hours

**Delegate to subagent:**
```
Goal: Implement Sync page for Hermes Dashboard

Context:
- File: src/app/sync/page.tsx
- Framework: Next.js + shadcn/ui
- Data sources:
  - GET /api/sync/status (git-sync status)
  - GET /api/compare (local vs remote)
  - POST /api/sync/push (push action)
  - POST /api/sync/pull (pull action)

Requirements:
1. Layout: 2 sections (Status + Diff)

2. Status Section:
   - Big numbers: Ahead X, Behind Y
   - Last sync timestamp
   - Branch name
   - Remote URL
   - Action buttons:
     * Push (primary button, disabled if ahead=0)
     * Pull (secondary button, disabled if behind=0)
     * Refresh (icon button)
   - Confirmation dialogs for push/pull (if changes > 10 files)

3. Diff Section:
   - List changed files (from /api/compare)
   - Each file: status icon (M/A/D), file path
   - Click file → expand inline diff viewer
   - Diff viewer: syntax highlight, +/- colors
   - "No changes" message if empty

4. Data fetching:
   - usePolling for status (30s)
   - Fetch compare data on demand (refresh button)
   - Loading states

5. Actions:
   - Push: POST /api/sync/push, show toast success/error, refetch
   - Pull: POST /api/sync/pull, show toast, refetch
   - Disable buttons when action in progress

Output: Complete sync page with UI + actions

Notes:
- Use Dialog component for confirmations
- Use Toast component for notifications
- Use ScrollArea for file list
- Diff viewer: simple pre tag with colors (or Monaco editor for fancy)
```

**Input:** API client + hooks
**Output:** Sync page

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000/sync
# Expected: Status cards + file list + action buttons
```

---

#### Task 3.5: Implement Setup page (`src/app/setup/page.tsx`)
**Type:** 🟢 DELEGATE
**Time:** 3-4 hours

**Delegate to subagent:**
```
Goal: Implement Setup wizard page for Hermes Dashboard

Context:
- File: src/app/setup/page.tsx
- Framework: Next.js + shadcn/ui
- Data source: GET /api/setup/check

Requirements:
1. Layout: Stepper (5 steps) + Log panel

2. Steps:
   a. Prerequisites Check:
      - List requirements (git, node, npx, python3, uv, docker, hermes, codegraph)
      - Each item: ✓ (green) or ✗ (red)
      - "All checks passed" message or "Missing: X, Y"
   
   b. Clone Repos:
      - List 3 repos
      - Progress indicator (cloning...)
      - Success/fail status
   
   c. Install Binaries:
      - List binaries (codegraph, ghidra-mcp optional)
      - Progress indicator
      - Skip option for optional items
   
   d. API Keys:
      - Message: "Run 'hermes setup' in terminal"
      - Link to terminal (or instructions)
   
   e. Verify:
      - Health checks (gateway, containers, sync status)
      - Pass/fail list
      - "Setup complete!" message

3. Stepper UI:
   - Horizontal stepper (shadcn Tabs or custom)
   - Current step highlighted
   - Previous steps clickable (navigate back)
   - Next button (disabled if current step fails)

4. Log Panel (right side or bottom):
   - Live logs (SSE from /api/logs/stream)
   - Auto-scroll
   - Filter by source (tabs: All, Gateway, git-sync, Docker)

5. Actions:
   - "Start Setup" button (trigger wizard)
   - "Retry" button (retry failed step)
   - "Skip" button (for optional steps)

Output: Complete setup page with wizard UI

Notes:
- Wizard state: useState for current step, results
- Logs: useSSE hook
- Disable navigation when step running
- Save progress to localStorage (resume if refresh)
```

**Input:** API client + hooks
**Output:** Setup page

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000/setup
# Expected: Stepper UI + log panel
```

---

#### Task 3.6: Implement RAG page (`src/app/rag/page.tsx`)
**Type:** 🟢 DELEGATE
**Time:** 2-3 hours

**Delegate to subagent:**
```
Goal: Implement RAG/Code Search page for Hermes Dashboard

Context:
- File: src/app/rag/page.tsx
- Framework: Next.js + shadcn/ui
- Data source: OWUI backend (port 8000)
  - GET /api/projects (list indexed projects)
  - POST /api/query (search code)
  - GET /api/collections (list collections)

Requirements:
1. Layout: Sidebar (projects) + Main (search + results)

2. Sidebar:
   - List indexed projects (from /api/projects)
   - Checkbox to select projects (filter search)
   - "Index new project" button (future feature)

3. Search Section:
   - Search input (big, prominent)
   - Top-k slider (1-20, default 10)
   - Search button
   - Loading indicator

4. Results Section:
   - List results (cards)
   - Each result:
     * Answer text (markdown render)
     * Citations (project, file, line)
     * Score/relevance
   - "No results" message if empty
   - Cache hit indicator (if response.cache_hit)

5. Collections Tab:
   - List collections
   - Create/Delete buttons (future)

Output: Complete RAG page

Notes:
- Use react-markdown to render answer
- Syntax highlight for code snippets
- Debounce search input (300ms)
```

**Input:** API client
**Output:** RAG page

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000/rag
# Expected: Search UI + projects list
```

---

#### Task 3.7: Implement Logs page (`src/app/logs/page.tsx`)
**Type:** 🟢 DELEGATE
**Time:** 2-3 hours

**Delegate to subagent:**
```
Goal: Implement Live Logs page for Hermes Dashboard

Context:
- File: src/app/logs/page.tsx
- Framework: Next.js + shadcn/ui
- Data source: GET /api/logs/stream (SSE)

Requirements:
1. Layout: Filter bar + Log viewer

2. Filter Bar:
   - Source filter (tabs: All, Gateway, git-sync, Docker)
   - Search box (filter logs client-side)
   - Auto-scroll toggle (checkbox)
   - Clear button
   - Export button (download logs as .txt)

3. Log Viewer:
   - Monospace font
   - Each log line:
     * Timestamp (HH:MM:SS)
     * Source badge (color-coded)
     * Level (INFO/WARN/ERROR with colors)
     * Message
   - Auto-scroll to bottom (if enabled)
   - Virtual scrolling (if > 1000 lines)
   - Max 1000 lines (drop old lines)

4. Data fetching:
   - useSSE hook connect to /api/logs/stream
   - Parse JSON messages
   - Append to logs array
   - Filter client-side

5. Interactions:
   - Click log line → highlight
   - Copy button (copy log line)
   - Pause/Resume streaming

Output: Complete logs page

Notes:
- Use ScrollArea component
- Virtual list library (react-window) if many logs
- Color codes: INFO=blue, WARN=yellow, ERROR=red
- Timestamp format: HH:MM:SS
```

**Input:** useSSE hook
**Output:** Logs page

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000/logs
# Expected: Log viewer with live updates
```

---

#### Task 3.8: Implement Settings page (`src/app/settings/page.tsx`)
**Type:** 🟢 DELEGATE
**Time:** 1-2 hours

**Delegate to subagent:**
```
Goal: Implement Settings page for Hermes Dashboard

Context:
- File: src/app/settings/page.tsx
- Framework: Next.js + shadcn/ui
- Storage: localStorage

Requirements:
1. Form fields:
   - Gateway URL (text input, default: http://localhost:8642)
   - OWUI URL (text input, default: http://localhost:8000)
   - API Key (password input)
   - Refresh interval (select: 10s, 30s, 60s, default 30s)
   - Theme (select: Dark, Light, System, default Dark)

2. Actions:
   - Save button (save to localStorage)
   - Reset button (reset to defaults)
   - Test connection button (ping Gateway + OWUI)

3. Validation:
   - URL format validation
   - Required fields
   - Toast success/error on save

4. Display:
   - Current values (load from localStorage)
   - Last saved timestamp

Output: Complete settings page

Notes:
- Use Form component (or plain inputs)
- Validate on change
- Auto-save on blur (optional)
```

**Input:** None
**Output:** Settings page

**Verification:**
```bash
npm run dev
# Browser → http://localhost:3000/settings
# Expected: Form with fields
```

---

### PHASE 4: API Integration Layer (2 days)

**Goal:** Dashboard calls Gateway + OWUI APIs

#### Task 4.1: Implement API routes (proxy layer)
**Type:** 🟢 DELEGATE
**Time:** 2 hours

**Delegate to subagent:**
```
Goal: Implement Next.js API routes (proxy layer) for Hermes Dashboard

Context:
- Files: src/app/api/gateway/[...path]/route.ts, src/app/api/owui/[...path]/route.ts
- Framework: Next.js App Router
- Purpose: Proxy requests + inject API key server-side

Requirements:
1. Create src/app/api/gateway/[...path]/route.ts:
   - Handle GET, POST, DELETE methods
   - Extract path from params
   - Forward request to GATEWAY_URL + /api/{path}
   - Inject Authorization header (Bearer DASHBOARD_API_KEY)
   - Forward response back to client
   - Error handling (500 if Gateway down)

2. Create src/app/api/owui/[...path]/route.ts:
   - Same as above but for OWUI_URL

3. Helper function:
   - proxyRequest(baseUrl, path, request) → Response

Output: 2 route files

Notes:
- Use NextRequest/NextResponse
- Read env vars from process.env
- Handle streaming responses (for SSE)
```

**Input:** Env vars (GATEWAY_URL, OWUI_URL, DASHBOARD_API_KEY)
**Output:** 2 API route files

**Verification:**
```bash
# Test proxy
curl http://localhost:3000/api/gateway/status
# Expected: JSON from Gateway (proxy injects auth)
```

---

#### Task 4.2: Test API integration
**Type:** 🔴 BLOCKING (test on real system)
**Time:** 2 hours

**Steps:**
1. Start Gateway (port 8642)
2. Start Dashboard (port 3000)
3. Test each page:
   - Overview: data loads from /api/gateway/status
   - Sync: push/pull actions work
   - Logs: SSE streaming works
4. Check browser DevTools Network tab
5. Verify no CORS errors

**Input:** Gateway + Dashboard running
**Output:** Test results

**Verification:** All pages fetch data successfully

---

#### Task 4.3: Error handling + loading states
**Type:** 🟢 DELEGATE
**Time:** 2 hours

**Delegate to subagent:**
```
Goal: Add error handling + loading states for Hermes Dashboard

Context:
- Framework: Next.js + shadcn/ui
- Files: all pages

Requirements:
1. Loading states:
   - Skeleton loaders for cards (shadcn Skeleton)
   - Spinner for actions
   - "Loading..." text

2. Error states:
   - Error boundary (catch React errors)
   - Toast notifications (shadcn Toast)
   - Retry buttons
   - Friendly error messages

3. Empty states:
   - "No data" messages
   - Placeholder illustrations (optional)

4. Connection errors:
   - Detect Gateway/OWUI down
   - Show banner: "Cannot connect to Gateway"
   - Auto-retry (exponential backoff)

Output: Updated pages with error handling

Notes:
- Use try-catch in data fetching
- Use Toast component for notifications
- Use Suspense for loading states
```

**Input:** Current pages
**Output:** Updated pages

**Verification:**
- Stop Gateway → see error message
- Slow network → see loading skeleton
- API error → see toast notification

---

### PHASE 5: Tools + Skill for Agent (1-2 days)

**Goal:** Agent can call tools to interact with dashboard

#### Task 5.1: Create dashboard-tools plugin
**Type:** 🟢 DELEGATE
**Time:** 2-3 hours

**Delegate to subagent:**
```
Goal: Create Hermes plugin "dashboard-tools" with tools to interact with dashboard API

Context:
- Files:
  * ~/.hermes/plugins/dashboard-tools/__init__.py
  * ~/.hermes/plugins/dashboard-tools/plugin.yaml
- Framework: Hermes plugin system
- API: Gateway (port 8642)

Requirements:
1. plugin.yaml:
   ```yaml
   name: dashboard-tools
   version: 1.0.0
   description: "Tools for interacting with Hermes Dashboard API"
   provides_tools:
     - dashboard_status
     - dashboard_sync_status
     - dashboard_sync_push
     - dashboard_sync_pull
     - dashboard_compare
     - dashboard_setup_check
     - dashboard_logs
   ```

2. __init__.py:
   - Helper: _gateway_get(endpoint), _gateway_post(endpoint, data)
   - Tool handlers (7 tools):
     * dashboard_status → GET /api/status
     * dashboard_sync_status → GET /api/sync/status
     * dashboard_sync_push → POST /api/sync/push
     * dashboard_sync_pull → POST /api/sync/pull
     * dashboard_compare → GET /api/compare
     * dashboard_setup_check → GET /api/setup/check
     * dashboard_logs → GET /api/logs
   - Each tool returns JSON string
   - Add dashboard_url in response
   - Error handling (connection errors, auth errors)

3. register(ctx):
   - Register 7 tools with schemas
   - Each tool has name, description, parameters

Output: 2 files (plugin.yaml + __init__.py)

Notes:
- Use httpx to call Gateway API
- Read DASHBOARD_API_KEY from env
- Read GATEWAY_URL from env (default http://localhost:8642)
- Timeout: 10s for GET, 60s for POST
```

**Input:** Plugin requirements
**Output:** 2 plugin files

**Verification:**
```bash
python -c "import sys; sys.path.insert(0, '~/.hermes/plugins/dashboard-tools'); import __init__"
# Expected: No import errors
```

---

#### Task 5.2: Create hermes-dashboard skill
**Type:** 🟢 DELEGATE
**Time:** 1 hour

**Delegate to subagent:**
```
Goal: Create Hermes skill "hermes-dashboard" with tool usage guide

Context:
- File: ~/.hermes/skills/hermes/hermes-dashboard/SKILL.md
- Format: Markdown with YAML frontmatter

Requirements:
1. Frontmatter:
   ```yaml
   ---
   name: hermes-dashboard
   description: "Interact with Hermes Dashboard (local web UI) — status, sync, setup, logs."
   tags: [hermes, dashboard, web-ui, control-plane]
   ---
   ```

2. Sections:
   - When to use (list scenarios)
   - Dashboard info (URL, source, start command)
   - Available tools (7 tools with examples)
   - Best practices (summarize, provide URLs, offer actions)
   - Troubleshooting (common errors + solutions)

3. Each tool section:
   - Description
   - When to use
   - Example conversation (User + Agent)

Output: SKILL.md file

Notes:
- Write in English (artifact rule)
- Keep concise but comprehensive
- Include dashboard URL in examples
```

**Input:** Tool descriptions
**Output:** SKILL.md file

**Verification:**
```bash
cat ~/.hermes/skills/hermes/hermes-dashboard/SKILL.md
# Expected: Complete skill document
```

---

#### Task 5.3: Register plugin + enable
**Type:** 🔴 BLOCKING (edit config)
**Time:** 30 minutes

**Steps:**
1. Read `~/.hermes/config.yaml`
2. Add `dashboard-tools` to `plugins.enabled`:
   ```yaml
   plugins:
     enabled:
       - advisor-model
       - agency-agents-router
       # ... existing plugins ...
       - dashboard-tools  # <-- add this
   ```
3. Restart Hermes:
   ```bash
   # If running in tmux
   tmux send-keys -t hermes-gw C-c
   sleep 2
   ~/.hermes/scripts/start-hermes-gateway.sh
   ```

**Input:** config.yaml
**Output:** Updated config + restarted Hermes

**Verification:**
```bash
hermes tools list | grep dashboard
# Expected: 7 dashboard tools listed
```

---

#### Task 5.4: Test tools in chat
**Type:** 🔴 BLOCKING (test on real system)
**Time:** 1 hour

**Steps:**
1. Start Hermes chat:
   ```bash
   hermes chat
   ```
2. Test scenarios:
   ```
   User: "Check system status"
   Expected: Agent calls dashboard_status, returns summary
   
   User: "What's the sync status?"
   Expected: Agent calls dashboard_sync_status
   
   User: "What's different between local and remote?"
   Expected: Agent calls dashboard_compare
   
   User: "Push changes"
   Expected: Agent calls dashboard_sync_push
   ```
3. Verify agent provides dashboard URLs

**Input:** Hermes running + plugin enabled
**Output:** Test results

**Verification:** All scenarios work correctly

---

### PHASE 6: Testing + Documentation (1-2 days)

**Goal:** Test end-to-end, write docs

#### Task 6.1: End-to-end testing
**Type:** 🔴 BLOCKING (test on real system)
**Time:** 3-4 hours

**Test scenarios:**
1. **Setup flow**:
   - Start from fresh machine (or reset dashboard)
   - Run setup wizard
   - Verify all steps complete

2. **Sync flow**:
   - Make local changes (edit config.yaml)
   - Check sync page → see ahead
   - Click Push → verify success
   - Check GitHub → see commit

3. **RAG flow**:
   - Index a project (if OWUI backend running)
   - Query code
   - Verify results

4. **Logs flow**:
   - Trigger actions (push, pull)
   - Check logs page
   - Verify live updates

5. **Agent integration**:
   - Chat with agent
   - Ask about status
   - Request sync actions
   - Verify agent calls tools

**Input:** All systems running
**Output:** Test report (pass/fail for each scenario)

**Verification:** All scenarios pass

---

#### Task 6.2: Write documentation
**Type:** 🟢 DELEGATE
**Time:** 2-3 hours

**Delegate to subagent:**
```
Goal: Write documentation for Hermes Dashboard

Context:
- Files:
  * ~/dev/notabita-hermes-dashboard/README.md
  * ~/dev/notabita-hermes-dashboard/docs/SETUP.md
  * ~/dev/notabita-hermes-dashboard/docs/API.md
  * ~/dev/notabita-hermes-dashboard/docs/TROUBLESHOOTING.md

Requirements:
1. README.md:
   - Overview (what is this)
   - Screenshots (placeholder for each page)
   - Quick start (3 steps: clone, install, run)
   - Features list
   - Tech stack
   - Contributing (optional)

2. docs/SETUP.md:
   - Prerequisites (Node, npm, Gateway running)
   - Step-by-step setup instructions
   - Environment variables
   - First run guide

3. docs/API.md:
   - Gateway API endpoints (from Phase 1)
   - Request/response examples
   - Authentication
   - Error codes

4. docs/TROUBLESHOOTING.md:
   - Common issues (CORS, connection refused, etc.)
   - Solutions
   - How to get help

Output: 4 documentation files

Notes:
- Write in English
- Use clear, concise language
- Include code examples
- Add screenshot placeholders
```

**Input:** Project structure + features
**Output:** 4 doc files

**Verification:**
```bash
ls ~/dev/notabita-hermes-dashboard/docs/
# Expected: 4 .md files
```

---

#### Task 6.3: Git commit + push
**Type:** 🔴 BLOCKING (git operation)
**Time:** 30 minutes

**Steps:**
```bash
cd ~/dev/notabita-hermes-dashboard

# Stage all files
git add .

# Commit
git commit -m "feat: implement local web dashboard control plane

- Next.js 14 + shadcn/ui + Tailwind CSS
- 6 pages: Overview, Sync, Setup, RAG, Logs, Settings
- Gateway API integration (port 8642)
- OWUI backend integration (port 8000)
- Real-time updates (polling + SSE)
- Agent tools (dashboard-tools plugin)
- Comprehensive documentation"

# Push
git push origin main
```

**Input:** Dashboard code
**Output:** Git commit + push

**Verification:**
```bash
git log --oneline -1
# Expected: commit message visible
```

---

#### Task 6.4: Update setup-manifest.json
**Type:** 🔴 BLOCKING (edit config)
**Time:** 30 minutes

**Steps:**
1. Read `~/.hermes/setup-manifest.json` (if exists)
2. Add dashboard repo:
   ```json
   {
     "repos": [
       // ... existing repos ...
       {
         "name": "hermes-dashboard",
         "url": "git@github.com:thucnobita97/notabita-hermes-dashboard.git",
         "path": "~/dev/notabita-hermes-dashboard",
         "branch": "main",
         "priority": "medium",
         "post_clone": "cd ~/dev/notabita-hermes-dashboard && npm install && npm run build"
       }
     ]
   }
   ```
3. Commit + push hermes-sync-git:
   ```bash
   cd ~/.hermes
   hermes git-sync push "add dashboard to setup manifest"
   ```

**Input:** setup-manifest.json
**Output:** Updated manifest

**Verification:**
```bash
cat ~/.hermes/setup-manifest.json | jq '.repos[] | select(.name == "hermes-dashboard")'
# Expected: dashboard repo entry
```

---

## Subagent Assignment Summary

### Tasks to delegate (🟢): 18 tasks
- **Phase 1**: 1.2, 1.3 (API design + implementation)
- **Phase 2**: 2.5 (project structure)
- **Phase 3**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8 (all pages + components)
- **Phase 4**: 4.1, 4.3 (API routes + error handling)
- **Phase 5**: 5.1, 5.2 (plugin + skill)
- **Phase 6**: 6.2 (documentation)

### Tasks to do manually (🔴): 14 tasks
- **Phase 1**: 1.1, 1.4, 1.5, 1.6 (read code, register router, testing, fix bugs)
- **Phase 2**: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7 (backup, setup Next.js, install deps, config)
- **Phase 4**: 4.2 (test API integration)
- **Phase 5**: 5.3, 5.4 (enable plugin, test tools)
- **Phase 6**: 6.1, 6.3, 6.4 (e2e testing, git commit, update manifest)

### Parallel execution (🟡):
- Phase 1 + Phase 2 (API + Frontend setup)
- Phase 3 + Phase 4 (Pages + API integration)

---

## Risk Mitigation

### Risk 1: Gateway API conflicts
**Issue:** hermes-agent fork may have old Gateway code
**Mitigation:** 
- Check existing Gateway code before implementing
- Test on separate branch before merging

### Risk 2: CORS issues
**Issue:** Browser blocks cross-origin requests
**Mitigation:**
- Configure CORS in Gateway
- Use Next.js API routes as proxy

### Risk 3: API key security
**Issue:** API key exposed in browser
**Mitigation:**
- Store API key server-side (Next.js API routes)
- Only expose via proxy layer

### Risk 4: SSE connection drops
**Issue:** Live logs disconnect
**Mitigation:**
- Auto-reconnect logic
- Fallback to polling if SSE fails

---

## Success Criteria

1. ✅ Dashboard accessible at http://localhost:3001
2. ✅ All 6 pages render with real data
3. ✅ Sync push/pull operations work
4. ✅ Live logs stream correctly
5. ✅ Agent can call all 7 dashboard tools
6. ✅ Setup wizard completes successfully
7. ✅ Documentation complete
8. ✅ Git commit pushed to GitHub
9. ✅ setup-manifest.json updated

---

## Timeline

| Phase | Duration | Dependencies | Can parallel? |
|-------|----------|--------------|---------------|
| 1. Gateway API | 2-3 days | None | ✓ (with Phase 2) |
| 2. Frontend Setup | 1 day | None | ✓ (with Phase 1) |
| 3. Pages UI | 3-4 days | Phase 2 | ✓ (with Phase 4, use mock) |
| 4. API Integration | 2 days | Phase 1, 2 | ✓ (with Phase 3) |
| 5. Tools + Skill | 1-2 days | Phase 4 | ✗ (needs API working) |
| 6. Testing + Docs | 1-2 days | All | ✗ |
| **Total** | **10-14 days** | | |

---

## Next Steps

After plan approval:
1. Start with Phase 1.1 (read Gateway code)
2. Execute tasks in dependency order
3. Delegate 🟢 tasks to subagents
4. Verify each phase before proceeding
5. Commit + push after each major milestone
