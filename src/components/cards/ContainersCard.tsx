'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface ContainerEntry {
  name: string
  status?: string
  state?: string
  image?: string
  [key: string]: unknown
}

interface Props {
  data: StatusResponse | null
  loading: boolean
}

function extractContainers(data: StatusResponse | null): ContainerEntry[] {
  if (!data) return []
  const rec = data as Record<string, unknown>
  const raw = rec.containers ?? rec.docker
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return { name: item, status: 'running' }
      if (typeof item === 'object' && item !== null) return item as ContainerEntry
      return { name: String(item) }
    })
  }
  return []
}

function stateVariant(state: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!state) return 'outline'
  const s = state.toLowerCase()
  if (s === 'running' || s === 'up' || s === 'healthy') return 'default'
  if (s === 'paused' || s === 'restarting') return 'secondary'
  if (s === 'exited' || s === 'dead' || s === 'error') return 'destructive'
  return 'outline'
}

export function ContainersCard({ data, loading }: Props) {
  const containers = extractContainers(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Containers</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ) : containers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No containers</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {containers.map((c) => {
              const state = c.state ?? c.status ?? 'unknown'
              return (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{c.name}</p>
                    {c.image && (
                      <p className="truncate text-xs text-muted-foreground">{c.image}</p>
                    )}
                  </div>
                  <Badge variant={stateVariant(state)}>{state}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
