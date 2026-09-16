# API Reference

Hermes backend API endpoints used by this dashboard. All requests are proxied through the Next.js server at `/api/hermes/*` — the browser never contacts the backend directly.

## Authentication

All endpoints require Bearer token authentication. The session token is injected server-side by the Next.js proxy route (`src/app/api/hermes/[...path]/route.ts`).

```
Authorization: Bearer <session-token>
```

The token is obtained from the Hermes dashboard backend (see [SETUP.md](SETUP.md#getting-the-session-token)).

## Base URL

| Context | URL |
|---------|-----|
| Hermes backend (direct) | `http://localhost:9119` |
| Dashboard proxy (browser) | `http://localhost:3000/api/hermes` |

---

## Endpoints

### `GET /api/status`

Returns the current status of the Hermes Agent instance.

**Parameters:** None

**Response:**

```json
{
  "status": "running",
  "version": "1.2.3",
  "uptime": 86400,
  "model": "claude-sonnet-4-20250514",
  "provider": "anthropic"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Agent status (e.g., `"running"`, `"idle"`, `"error"`) |
| `version` | `string` | Hermes Agent version |
| `uptime` | `number` | Uptime in seconds |
| `model` | `string?` | Current LLM model |
| `provider` | `string?` | Current LLM provider |

**Used by:** Overview page — `GatewayCard`, `SkillsCard`, `PluginsCard`, `MemoryCard`, `ContainersCard`

---

### `GET /api/git/status`

Returns the git working tree status for a repository.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string` | Yes | Absolute path to the git repository |

**Example request:**
```
GET /api/git/status?path=/home/user/dev/my-project
```

**Response:**

```json
{
  "branch": "main",
  "files": [
    { "file": "src/app/page.tsx", "status": "M", "staged": false },
    { "file": "src/lib/utils.ts", "status": "A", "staged": true },
    { "file": "old-file.ts", "status": "D", "staged": false }
  ],
  "ahead": 2,
  "behind": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `branch` | `string` | Current branch name |
| `files` | `array` | List of changed files |
| `files[].file` | `string` | File path relative to repo root |
| `files[].status` | `string` | Git status code: `M` (modified), `A` (added), `D` (deleted), `?` (untracked), `U` (unmerged) |
| `files[].staged` | `boolean?` | Whether the file is staged for commit |
| `ahead` | `number?` | Commits ahead of remote tracking branch |
| `behind` | `number?` | Commits behind remote tracking branch |

**Used by:** Sync page — `RepoPanel`

---

### `GET /api/git/review/diff`

Returns the diff content for a specific file.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string` | Yes | Absolute path to the git repository |
| `file` | `string` | Yes | File path relative to the repo root |

**Example request:**
```
GET /api/git/review/diff?path=/home/user/dev/my-project&file=src/app/page.tsx
```

**Response:**

```json
{
  "diff": "diff --git a/src/app/page.tsx b/src/app/page.tsx\nindex abc1234..def5678 100644\n--- a/src/app/page.tsx\n+++ b/src/app/page.tsx\n@@ -10,6 +10,8 @@\n import { Button } from '@/components/ui/button'\n+import { NewComponent } from '@/components/NewComponent'\n...",
  "file": "src/app/page.tsx"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `diff` | `string` | Unified diff output |
| `file` | `string` | The requested file path |

**Used by:** Sync page — `DiffViewer` component

---

### `POST /api/git/review/stage`

Stage a file for commit.

**Request body:**

```json
{
  "path": "/home/user/dev/my-project",
  "file": "src/app/page.tsx"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | Absolute path to the git repository |
| `file` | `string` | Yes | File path relative to the repo root |

**Response:**

```json
{
  "success": true,
  "message": "Staged src/app/page.tsx"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the operation succeeded |
| `message` | `string?` | Human-readable result message |

**Used by:** Sync page — stage button per file

---

### `POST /api/git/review/commit`

Create a git commit with staged changes.

**Request body:**

```json
{
  "path": "/home/user/dev/my-project",
  "message": "feat: add new component",
  "push": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | Absolute path to the git repository |
| `message` | `string` | Yes | Commit message |
| `push` | `boolean?` | No | Whether to push immediately after commit (default: `false`) |

**Response:**

```json
{
  "success": true,
  "hash": "a1b2c3d4e5f6",
  "message": "Committed: feat: add new component"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the commit succeeded |
| `hash` | `string?` | Short commit hash |
| `message` | `string?` | Human-readable result message |

**Used by:** Sync page — commit button

---

### `POST /api/git/review/push`

Push committed changes to the remote.

**Request body:**

```json
{
  "path": "/home/user/dev/my-project"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | Absolute path to the git repository |

**Response:**

```json
{
  "success": true,
  "message": "Pushed 2 commits to origin/main"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the push succeeded |
| `message` | `string?` | Human-readable result message |

**Used by:** Sync page — push button

---

### `GET /api/config`

Returns the Hermes Agent configuration.

**Parameters:** None

**Response:**

```json
{
  "model": "claude-sonnet-4-20250514",
  "provider": "anthropic",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

The response is a flexible key-value object containing the agent's runtime configuration. Fields vary based on the Hermes setup.

**Used by:** Overview page — configuration display

---

### `GET /api/env`

Returns environment information from the Hermes Agent host.

**Parameters:** None

**Response:**

```json
{
  "hostname": "dev-machine",
  "platform": "linux",
  "arch": "x64",
  "nodeVersion": "v20.11.0"
}
```

The response is a flexible key-value object containing the host environment details. Fields vary based on the system.

**Used by:** Overview page — environment display

---

## Error Codes

| Status | Meaning | Common Cause |
|--------|---------|-------------|
| `401` | Unauthorized | Missing or expired session token |
| `404` | Not Found | Endpoint doesn't exist, or `path` parameter points to a non-existent repository |
| `502` | Bad Gateway | Hermes backend is unreachable (returned by the Next.js proxy when the backend connection fails) |

### Error Response Format

```json
{
  "error": "Descriptive error message"
}
```

Or in some cases:

```json
{
  "message": "Descriptive error message"
}
```

### Error Handling in the Dashboard

The dashboard handles errors at two levels:

1. **Proxy layer** (`route.ts`): Catches connection errors and returns `502` with a `"Backend unreachable"` message
2. **Client layer** (`client-api.ts`): Throws `ClientApiError` with the status code and parsed error body; UI components catch these and display toast notifications via Sonner
