'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function MemoryCard({ data, loading }: Props) {
  const rec = data as Record<string, unknown> | null
  const used = rec && typeof rec.memory_used === 'number' ? (rec.memory_used as number) : null
  const limit = rec && typeof rec.memory_limit === 'number' ? (rec.memory_limit as number) : null

  const pct = used != null && limit != null && limit > 0
    ? Math.min(100, Math.round((used / limit) * 100))
    : null

  const warning = pct != null && pct > 80

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : pct != null ? (
          <>
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${
                  warning ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{used != null ? formatBytes(used) : '—'}</span>
              <span>{limit != null ? formatBytes(limit) : '—'}</span>
            </div>
            <p className={`mt-1 text-xs font-medium ${warning ? 'text-destructive' : 'text-muted-foreground'}`}>
              {pct}% used{warning ? ' — high usage' : ''}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No memory data</p>
        )}
      </CardContent>
    </Card>
  )
}
