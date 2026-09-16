'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface PluginEntry {
  name: string
  enabled?: boolean
  [key: string]: unknown
}

interface Props {
  data: StatusResponse | null
  loading: boolean
}

function extractPlugins(data: StatusResponse | null): PluginEntry[] {
  if (!data) return []
  const raw = (data as Record<string, unknown>).plugins
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return { name: item, enabled: true }
      if (typeof item === 'object' && item !== null) return item as PluginEntry
      return { name: String(item), enabled: true }
    })
  }
  return []
}

export function PluginsCard({ data, loading }: Props) {
  const plugins = extractPlugins(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plugins</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ) : plugins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plugins</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {plugins.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{p.name}</span>
                <Badge variant={p.enabled ? 'default' : 'outline'}>
                  {p.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
