# Plan: Fix Cards API Field Mismatch

## Executive Summary

Dashboard UI renders but shows no data because card components read field names that don't exist in the actual Hermes backend API response (`/api/status`). This plan fixes all 6 cards to match the real API response format.

## Problem Statement

- **Symptom:** Cards display skeletons, "No data", or empty states despite API returning data
- **Root Cause:** Card components use incorrect field names (e.g., `skills_count`, `plugins`, `containers`) that don't exist in the API response
- **Scope:** 6 card components + 1 API client + 1 page component

## API Response Analysis

### Actual `/api/status` response fields:
```json
{
  "version": "0.21.3",
  "gateway_running": true,
  "gateway_state": "running",
  "gateway_pid": 6211,
  "gateway_platforms": { ... },
  "active_sessions": 1,
  "components": {
    "gateway": { "status": "ok", "state": "running" },
    "dashboard": { "status": "ok" },
    "storage": { "status": "ok" },
    "platforms": { "status": "ok", "configured": 1, "connected": 1 }
  },
  "overall": "ok",
  "memory": {
    "pressure": "ok",
    "gateway_rss_mb": 257,
    "system_total_mb": 11812,
    "system_available_mb": 5449
  },
  "disk": { "total_mb": 1031018, "free_mb": 845109, "used_percent": 12.9 },
  "profiles": ["default", "user-agent"],
  "gateway_mode": "multiplex"
}
```

### Actual `/api/skills` response (separate endpoint):
```json
[
  { "name": "atomic-commit", "category": null, "enabled": true, "usage": 10, "provenance": "agent" },
  { "name": "hermes-agent", "category": "autonomous-ai-agents", "enabled": true, ... }
]
```

### Missing endpoints (not available):
- `/api/plugins` — no endpoint
- `/api/containers` or Docker — no endpoint

### Field mapping (current → actual):
| Card | Field card looks for | Actual field | Action |
|------|---------------------|-------------|--------|
| GatewayCard | `status`, `uptime` | `gateway_state`, `version`, `components.gateway` | Remap |
| SkillsCard | `skills_count`, `skills` in /api/status | `/api/skills` (separate endpoint) | Add endpoint call |
| PluginsCard | `plugins` in /api/status | Not available | Placeholder |
| MemoryCard | `memory_used`, `memory_limit` | `memory.gateway_rss_mb`, `memory.system_total_mb` | Remap |
| ContainersCard | `containers`, `docker` | Not available | Placeholder |
| ReposCard | git status | `/api/git/status` returns `null` when clean | Handle null |

---

## Phase Breakdown

### PHASE 1: Update API Client (15 min)

**Goal:** Add `getSkills()` method to client-api.ts

#### Task 1.1: Add getSkills endpoint
- **File:** `src/lib/client-api.ts`
- **Changes:**
  - Add `Skill` interface: `{ name: string; category: string | null; enabled: boolean; usage: number; provenance: string }`
  - Add method: `getSkills(): Promise<Skill[]>` → calls `GET /api/skills`
  - Export `Skill` type
- **Verification:** `npx tsc --noEmit` passes

---

### PHASE 2: Update Overview Page (15 min)

**Goal:** Fetch skills separately, pass to SkillsCard

#### Task 2.1: Fetch skills from /api/skills
- **File:** `src/app/page.tsx`
- **Changes:**
  - Add second `usePolling` for `clientApi.getSkills()`, interval 60s
  - Pass `skills` array to `<SkillsCard skills={skills} loading={skillsLoading} />`
  - Update SkillsCard import props
- **Verification:** Page compiles, no type errors

---

### PHASE 3: Fix Each Card Component (45 min, parallelizable)

**Goal:** Update all 6 cards to read correct fields from API response

#### Task 3.1: Fix GatewayCard
- **File:** `src/components/cards/GatewayCard.tsx`
- **Field mapping:**
  - Status: `data.gateway_state` (string: "running"/"stopped")
  - Version: `data.version`
  - PID: `data.gateway_pid`
  - Overall health: `data.overall` ("ok"/"error")
  - Active sessions: `data.active_sessions`
  - Profiles: `data.profiles`
- **Display:**
  - Green/red status indicator based on `gateway_running`
  - Badge: `gateway_state` value
  - Version: `v{data.version}`
  - PID, active sessions, profiles count
- **Verification:** Card shows running status + version

#### Task 3.2: Fix SkillsCard
- **File:** `src/components/cards/SkillsCard.tsx`
- **Props change:** Accept `skills: Skill[]` + `loading: boolean` (no longer `data: StatusResponse`)
- **Display:**
  - Big number: `skills.length`
  - Categories breakdown: group by `category`, show top 5 with counts
  - "N enabled / M total" summary
- **Verification:** Card shows "64 skills" + category breakdown

#### Task 3.3: Fix MemoryCard
- **File:** `src/components/cards/MemoryCard.tsx`
- **Field mapping:**
  - Used: `data.memory.gateway_rss_mb` (convert MB for display)
  - Total: `data.memory.system_total_mb`
  - Available: `data.memory.system_available_mb`
  - Pressure: `data.memory.pressure` ("ok"/"warning"/"critical")
- **Display:**
  - Progress bar: `(gateway_rss_mb / system_total_mb) * 100`
  - Format: "257 MB / 11.8 GB"
  - Color code by pressure level
- **Verification:** Card shows progress bar with real memory data

#### Task 3.4: Fix PluginsCard (placeholder)
- **File:** `src/components/cards/PluginsCard.tsx`
- **Change:** Show placeholder "Coming soon — API endpoint not yet available"
- **Icon:** Plug icon from lucide-react
- **Verification:** Card shows placeholder message

#### Task 3.5: Fix ContainersCard (placeholder)
- **File:** `src/components/cards/ContainersCard.tsx`
- **Change:** Show placeholder "Coming soon — Docker integration not yet available"
- **Icon:** Container icon from lucide-react
- **Verification:** Card shows placeholder message

#### Task 3.6: Fix ReposCard null handling
- **File:** `src/components/cards/ReposCard.tsx`
- **Issue:** `/api/git/status` returns `null` when repo is clean (no changes)
- **Fix:**
  - Check `status === null` → display "Clean ✓" with green badge
  - Handle undefined `ahead`/`behind` gracefully
- **Verification:** Card shows 3 repos with "Clean" status when no changes

---

### PHASE 4: Test + Verify (15 min)

**Goal:** Full E2E verification with real data

#### Task 4.1: E2E test
- Restart dev server: `npm run dev`
- Open browser: http://localhost:3456
- Verify each card:
  - GatewayCard: "running" status, version "0.21.3"
  - SkillsCard: "64 skills" + category breakdown
  - MemoryCard: progress bar with MB/GB
  - PluginsCard: "Coming soon" placeholder
  - ContainersCard: "Coming soon" placeholder
  - ReposCard: 3 repos with "Clean" status
- Check browser console: no React warnings
- Check Network tab: `/api/hermes/status` + `/api/hermes/skills` return data

#### Task 4.2: Build check
- Run: `npm run build`
- Verification: Build passes, no errors

---

## Delegation Strategy

| Phase | Tasks | Parallel? | Model |
|-------|-------|-----------|-------|
| 1 | Task 1.1 | ✗ | Direct (simple) |
| 2 | Task 2.1 | ✗ | Direct (simple) |
| 3 | Tasks 3.1-3.6 | ✓ (6 parallel) | `deepinfra:deepseek-ai/DeepSeek-V4-Flash` |
| 4 | Tasks 4.1-4.2 | ✗ | Manual |

- Phase 3 tasks are independent — delegate to 3 subagents (2 tasks each) running in parallel
- Phase 1-2 done directly (fast, simple changes)

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. API Client | 15 min | None |
| 2. Overview Page | 15 min | Phase 1 |
| 3. Fix Cards | 45 min | Phase 2 (parallel) |
| 4. Test + Verify | 15 min | Phase 3 |
| **Total** | **~1.5 hours** | |

## Risk Mitigation

1. **API response format changes** — Verified actual response before planning; types match real data
2. **Skills endpoint format** — Already tested: returns array with `name`, `category`, `enabled` fields
3. **Build errors after fix** — Run `tsc --noEmit` after each phase

## Success Criteria

1. All 6 cards display real data or appropriate placeholders
2. No "No data" or empty states on cards with available API data
3. Browser console clean (no React warnings)
4. Production build passes (`npm run build` exit 0)
5. Git commit: `fix: update cards to match actual Hermes API response`
