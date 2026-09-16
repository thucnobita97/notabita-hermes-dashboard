'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

export function GatewayCard({ data, loading }: Props) {
  const isUp = data?.gateway_running ?? false

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
                {data?.gateway_state ?? 'unknown'}
              </Badge>
            </div>
            <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
              {data?.version && (
                <p>Version: <span className="font-mono text-foreground">v{data.version}</span></p>
              )}
              {data?.gateway_pid != null && (
                <p>PID: <span className="font-mono text-foreground">{data.gateway_pid}</span></p>
              )}
              {data?.active_sessions != null && (
                <p>Active sessions: <span className="font-mono text-foreground">{data.active_sessions}</span></p>
              )}
              {data?.profiles && (
                <p>Profiles: <span className="font-mono text-foreground">{data.profiles.length}</span></p>
              )}
              {data?.overall && (
                <p>Health: <span className="font-mono text-foreground">{data.overall}</span></p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
