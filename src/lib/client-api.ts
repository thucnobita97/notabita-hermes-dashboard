// Client-side API helper — calls /api/hermes/* (Next.js proxy routes)
// No auth headers needed; token is injected server-side by the proxy

export interface GitFileEntry {
  file: string;
  status: string;
  staged?: boolean;
}

export interface GitStatusResponse {
  branch: string;
  files: GitFileEntry[];
  ahead?: number;
  behind?: number;
  [key: string]: unknown;
}

export interface DiffResponse {
  diff: string;
  file: string;
  [key: string]: unknown;
}

export interface StageResponse {
  success: boolean;
  message?: string;
}

export interface CommitResponse {
  success: boolean;
  hash?: string;
  message?: string;
}

export interface PushResponse {
  success: boolean;
  message?: string;
}

export interface StatusResponse {
  version: string;
  gateway_running: boolean;
  gateway_state: string;
  gateway_pid: number;
  active_sessions: number;
  overall: string;
  memory: {
    pressure: string;
    gateway_rss_mb: number;
    system_total_mb: number;
    system_available_mb: number;
  };
  disk: {
    total_mb: number;
    free_mb: number;
    used_percent: number;
  };
  profiles: string[];
  components: Record<string, { status: string; [k: string]: unknown }>;
  [key: string]: unknown;
}

export interface Skill {
  name: string;
  description?: string;
  category: string | null;
  enabled: boolean;
  usage: number;
  provenance: string;
}

export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>
): Promise<T> {
  let url = `/api/hermes${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    let parsedBody: unknown;
    try {
      parsedBody = await res.json();
      if (parsedBody && typeof parsedBody === "object") {
        const obj = parsedBody as Record<string, unknown>;
        if (typeof obj.error === "string") message = obj.error;
        else if (typeof obj.message === "string") message = obj.message;
      }
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    throw new ClientApiError(message, res.status, parsedBody);
  }

  return (await res.json()) as T;
}

// ---- Typed endpoint wrappers ----

export const clientApi = {
  getStatus: () => request<StatusResponse>("GET", "/status"),

  getGitStatus: (path: string) =>
    request<GitStatusResponse>("GET", "/git/status", undefined, { path }),

  getDiff: (path: string, file: string) =>
    request<DiffResponse>("GET", "/git/review/diff", undefined, { path, file }),

  stageFile: (path: string, file: string) =>
    request<StageResponse>("POST", "/git/review/stage", { path, file }),

  commit: (path: string, message: string, push?: boolean) =>
    request<CommitResponse>("POST", "/git/review/commit", { path, message, push }),

  push: (path: string) =>
    request<PushResponse>("POST", "/git/review/push", { path }),

  getSkills: () => request<Skill[]>("GET", "/skills"),

  getConfig: () => request<Record<string, unknown>>("GET", "/config"),
  getEnv: () => request<Record<string, unknown>>("GET", "/env"),
};
