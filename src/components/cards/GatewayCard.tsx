'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function GatewayCard({ data, loading }: Props) {
  const rec = data as Record<string, unknown> | null

  // Try gateway sub-object first, fall back to top-level status
  const gateway = rec && typeof rec.gateway === 'object' && rec.gateway !== null
    ? (rec.gateway as Record<string, unknown>)
    : null

  const statusStr = gateway
    ? typeof gateway.status === 'string' ? gateway.status : 'unknown'
    : data?.status ?? 'unknown'

  const httpCode = gateway && typeof gateway.http_code === 'number'
    ? (gateway.http_code as number)
    : null

  const uptime = data?.uptime ?? (gateway && typeof gateway.uptime === 'number' ? gateway.uptime as number : null)

  const isUp = statusStr === 'ok' || statusStr === 'up' || statusStr === 'running' || statusStr === 'connected'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isUp ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <Badge variant={isUp ? 'default' : 'destructive'}>
                {statusStr}
              </Badge>
            </div>
            <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
              {httpCode != null && (
                <p>HTTP: <span className="font-mono text-foreground">{httpCode}</span></p>
              )}
              {uptime != null && (
                <p>Uptime: <span className="font-mono text-foreground">{formatUptime(uptime)}</span></p>
              )}
              {data?.version && (
                <p>Version: <span className="font-mono text-foreground">{data.version}</span></p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
