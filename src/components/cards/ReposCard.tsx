'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGitActions } from '@/hooks/use-git-actions'
import { useRouter } from 'next/navigation'

const REPOS = [
  { name: 'hermes-sync-git', path: '/home/thucnobita/dev/hermes-sync-git' },
  { name: 'hermes-openwebui-stack', path: '/home/thucnobita/dev/hermes-openwebui-stack' },
  { name: 'hermes-agent', path: '/home/thucnobita/.hermes/hermes-agent' },
] as const

function RepoRow({ repo }: { repo: (typeof REPOS)[number] }) {
  const { status, loading } = useGitActions(repo.path)
  const router = useRouter()

  if (loading && !status) {
    return (
      <div className="flex items-center justify-between gap-2 py-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
    )
  }

  const branch = status?.branch ?? '—'
  const ahead = status?.ahead ?? 0
  const behind = status?.behind ?? 0

  let syncVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default'
  let syncLabel = 'Synced'
  if (behind > 0) {
    syncVariant = 'destructive'
    syncLabel = `↓${behind} behind`
  } else if (ahead > 0) {
    syncVariant = 'secondary'
    syncLabel = `↑${ahead} ahead`
  }

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
      onClick={() =>
        router.push(`/sync?repo=${encodeURIComponent(repo.path)}`)
      }
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{repo.name}</p>
        <p className="truncate text-xs text-muted-foreground">{branch}</p>
      </div>
      <Badge variant={syncVariant}>{syncLabel}</Badge>
    </button>
  )
}

export function ReposCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repositories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {REPOS.map((repo) => (
          <RepoRow key={repo.path} repo={repo} />
        ))}
      </CardContent>
    </Card>
  )
}
