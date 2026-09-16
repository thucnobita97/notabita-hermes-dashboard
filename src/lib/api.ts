// Hermes API client — server-side only (reads process.env)

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface StatusResponse {
  status: string;
  version: string;
  uptime: number;
  model?: string;
  provider?: string;
  [key: string]: unknown;
}

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
  [key: string]: unknown;
}

export interface CommitResponse {
  success: boolean;
  hash?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PushResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface ConfigResponse {
  [key: string]: unknown;
}

export interface EnvResponse {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class HermesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HermesApiError";
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class HermesApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    const url = process.env.HERMES_BACKEND_URL;
    const tok = process.env.HERMES_SESSION_TOKEN;
    if (!url) {
      throw new Error(
        "HERMES_BACKEND_URL is not set in process.env",
      );
    }
    if (!tok) {
      throw new Error(
        "HERMES_SESSION_TOKEN is not set in process.env",
      );
    }
    this.baseUrl = url.replace(/\/+$/, "");
    this.token = tok;
  }

  // ---- core HTTP helpers --------------------------------------------------

  async get<T = unknown>(path: string, query?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: "GET" });
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  // ---- typed endpoint wrappers --------------------------------------------

  getStatus(): Promise<StatusResponse> {
    return this.get<StatusResponse>("/api/status");
  }

  getGitStatus(path: string): Promise<GitStatusResponse> {
    return this.get<GitStatusResponse>("/api/git/status", { path });
  }

  getDiff(path: string, file: string): Promise<DiffResponse> {
    return this.get<DiffResponse>("/api/git/review/diff", { path, file });
  }

  stageFile(path: string, file: string): Promise<StageResponse> {
    return this.post<StageResponse>("/api/git/review/stage", { path, file });
  }

  commit(path: string, message: string, push?: boolean): Promise<CommitResponse> {
    return this.post<CommitResponse>("/api/git/review/commit", {
      path,
      message,
      push,
    });
  }

  push(path: string): Promise<PushResponse> {
    return this.post<PushResponse>("/api/git/review/push", { path });
  }

  getConfig(): Promise<ConfigResponse> {
    return this.get<ConfigResponse>("/api/config");
  }

  getEnv(): Promise<EnvResponse> {
    return this.get<EnvResponse>("/api/env");
  }

  // Aliases for convenience (used by hooks)
  gitStatus(path: string): Promise<GitStatusResponse> {
    return this.getGitStatus(path);
  }
  gitStage(path: string, file: string): Promise<StageResponse> {
    return this.stageFile(path, file);
  }
  gitCommit(path: string, message: string, push?: boolean): Promise<CommitResponse> {
    return this.commit(path, message, push);
  }
  gitPush(path: string): Promise<PushResponse> {
    return this.push(path);
  }

  // ---- internals ----------------------------------------------------------

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: "Bearer " + this.token,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };

    const res = await fetch(url, { ...init, headers });

    if (!res.ok) {
      let body: unknown;
      let message = `${res.status} ${res.statusText}`;
      try {
        body = await res.json();
        if (body && typeof body === "object") {
          const errObj = body as Record<string, unknown>;
          if (typeof errObj.error === "string") message = errObj.error;
          else if (typeof errObj.message === "string") message = errObj.message;
        }
      } catch {
        const text = await res.text().catch(() => "");
        if (text) message = text;
      }
      throw new HermesApiError(message, res.status, res.statusText, body);
    }

    return (await res.json()) as T;
  }
}

// Singleton — safe to import from any server-side Next.js module
export const api = new HermesApiClient();
