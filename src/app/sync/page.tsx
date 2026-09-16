"use client"

import { Suspense, useCallback, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  RefreshCw,
  ArrowUpFromLine,
  GitBranch,
  ChevronDown,
  ChevronRight,
  FileCode,
  FilePlus,
  FileMinus,
  FileQuestion,
  LayoutDashboard,
  GitMerge,
  Settings,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"
import { DiffViewer } from "@/components/DiffViewer"
import { useGitActions } from "@/hooks/use-git-actions"
import { clientApi, type GitFileEntry } from "@/lib/client-api"

const REPOS = [
  { key: "hermes-sync-git", label: "hermes-sync-git", path: "/home/thucnobita/dev/hermes-sync-git" },
  { key: "hermes-openwebui-stack", label: "hermes-openwebui-stack", path: "/home/thucnobita/dev/hermes-openwebui-stack" },
  { key: "hermes-agent", label: "hermes-agent", path: "/home/thucnobita/.hermes/hermes-agent" },
] as const

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Sync", href: "/sync", icon: GitMerge, active: true },
  { label: "Setup", href: "/setup", icon: Settings },
]

function statusIcon(status: string) {
  switch (status.toUpperCase()) {
    case "M":
      return <FileCode className="size-3.5 text-yellow-400" />
    case "A":
      return <FilePlus className="size-3.5 text-green-400" />
    case "D":
      return <FileMinus className="size-3.5 text-red-400" />
    case "?":
    case "U":
      return <FileQuestion className="size-3.5 text-zinc-400" />
    default:
      return <FileCode className="size-3.5 text-zinc-400" />
  }
}

function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "M":
      return "text-yellow-400"
    case "A":
      return "text-green-400"
    case "D":
      return "text-red-400"
    default:
      return "text-zinc-400"
  }
}

function RepoPanel({ repoPath }: { repoPath: string }) {
  const { status, loading, error, stage, commit, push, refetch } = useGitActions(repoPath)

  const [commitMessage, setCommitMessage] = useState("")
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [diffContent, setDiffContent] = useState<string>("")
  const [diffLoading, setDiffLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [staging, setStaging] = useState<string | null>(null)

  const handleStage = useCallback(
    async (file: string) => {
      setStaging(file)
      try {
        await stage(file)
        toast.success(`Staged ${file}`)
      } catch (err) {
        toast.error(`Failed to stage: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setStaging(null)
      }
    },
    [stage]
  )

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message")
      return
    }
    setCommitting(true)
    try {
      await commit(commitMessage.trim())
      toast.success("Committed successfully")
      setCommitMessage("")
    } catch (err) {
      toast.error(`Commit failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCommitting(false)
    }
  }, [commit, commitMessage])

  const handlePush = useCallback(async () => {
    setPushing(true)
    try {
      await push()
      toast.success("Pushed to remote")
    } catch (err) {
      toast.error(`Push failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setPushing(false)
    }
  }, [push])

  const handleFileClick = useCallback(
    async (file: string) => {
      if (expandedFile === file) {
        setExpandedFile(null)
        setDiffContent("")
        return
      }
      setExpandedFile(file)
      setDiffLoading(true)
      try {
        const res = await clientApi.getDiff(repoPath, file)
        setDiffContent(res.diff)
      } catch (err) {
        setDiffContent(`Error loading diff: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setDiffLoading(false)
      }
    },
    [expandedFile, repoPath]
  )

  const hasChanges = status && status.files.length > 0
  const hasStaged = status?.files.some((f) => f.staged) ?? false
  const ahead = status?.ahead ?? 0
  const behind = status?.behind ?? 0

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="size-4 text-blue-400" />
            {loading && !status ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <span>{status?.branch ?? "—"}</span>
            )}
          </CardTitle>
          <CardDescription>
            {repoPath}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ArrowUp className="size-4 text-green-400" />
              <span className="text-2xl font-bold text-green-400">{ahead}</span>
              <span className="text-xs text-muted-foreground">ahead</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDown className="size-4 text-orange-400" />
              <span className="text-2xl font-bold text-orange-400">{behind}</span>
              <span className="text-xs text-muted-foreground">behind</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                size="sm"
                onClick={handlePush}
                disabled={pushing || (ahead === 0 && !hasChanges)}
              >
                <ArrowUpFromLine className="size-4" />
                {pushing ? "Pushing…" : "Push"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-3">
            <p className="text-sm text-red-400">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Commit Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Commit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Commit message…"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommit()
              }}
              disabled={committing}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleCommit}
              disabled={committing || !hasStaged}
            >
              {committing ? "Committing…" : "Commit"}
            </Button>
          </div>
          {!hasStaged && hasChanges && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Stage files before committing
            </p>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Changed Files
            {status && (
              <Badge variant="secondary" className="text-xs">
                {status.files.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !status ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : !status || status.files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No changes — working tree clean
            </p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-0.5">
                {status.files.map((file: GitFileEntry) => (
                  <div key={file.file}>
                    <div
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => handleFileClick(file.file)}
                    >
                      {expandedFile === file.file ? (
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      {statusIcon(file.status)}
                      <span className="text-sm font-mono truncate flex-1">
                        {file.file}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 ${statusColor(file.status)}`}
                      >
                        {file.status}
                      </Badge>
                      {file.staged && (
                        <Badge variant="secondary" className="text-[10px] px-1">
                          staged
                        </Badge>
                      )}
                      {!file.staged && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStage(file.file)
                          }}
                          disabled={staging === file.file}
                        >
                          {staging === file.file ? (
                            <RefreshCw className="size-3 animate-spin" />
                          ) : (
                            <span className="text-[10px]">stage</span>
                          )}
                        </Button>
                      )}
                    </div>
                    {expandedFile === file.file && (
                      <div className="ml-6 mt-1 mb-2">
                        <Separator className="mb-2" />
                        <DiffViewer diff={diffContent} loading={diffLoading} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SyncPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const repoParam = searchParams.get("repo") ?? REPOS[0].key

  const activeRepo = REPOS.find((r) => r.key === repoParam) ?? REPOS[0]

  const handleTabChange = useCallback(
    (value: unknown) => {
      const key = String(value)
      router.push(`/sync?repo=${key}`)
    },
    [router]
  )

  return (
    <div className="flex flex-1 min-h-screen bg-background text-foreground">
      <Toaster position="bottom-right" />

      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card/50 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Hermes</h2>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Sync</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Git management across your repositories
            </p>
          </div>

          <Tabs value={activeRepo.key} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              {REPOS.map((repo) => (
                <TabsTrigger key={repo.key} value={repo.key}>
                  {repo.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {REPOS.map((repo) => (
              <TabsContent key={repo.key} value={repo.key}>
                <RepoPanel repoPath={repo.path} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function SyncPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 min-h-screen bg-background items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <SyncPageInner />
    </Suspense>
  )
}
