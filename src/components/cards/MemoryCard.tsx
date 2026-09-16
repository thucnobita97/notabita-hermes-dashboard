'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

export function MemoryCard({ data, loading }: Props) {
  const mem = data?.memory ?? null
  const disk = data?.disk ?? null

  const usedMB = mem?.gateway_rss_mb ?? null
  const totalMB = mem?.system_total_mb ?? null
  const availMB = mem?.system_available_mb ?? null
  const pressure = mem?.pressure ?? null

  const pct = usedMB != null && totalMB != null && totalMB > 0
    ? Math.min(100, (usedMB / totalMB) * 100)
    : null

  const totalGB = totalMB != null ? (totalMB / 1024).toFixed(1) : null
  const availGB = availMB != null ? (availMB / 1024).toFixed(1) : null

  const pressureColor =
    pressure === 'critical' ? 'bg-destructive' :
    pressure === 'warning' ? 'bg-yellow-500' :
    'bg-primary'

  const pressureTextColor =
    pressure === 'critical' ? 'text-destructive' :
    pressure === 'warning' ? 'text-yellow-500' :
    'text-primary'

  const diskUsedPct = disk?.used_percent ?? null
  const diskFreeGB = disk?.free_mb != null ? (disk.free_mb / 1024).toFixed(1) : null

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
            {/* Memory section */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Memory Usage</span>
              {pressure && (
                <span className={`text-xs font-medium capitalize ${pressureTextColor}`}>
                  {pressure}
                </span>
              )}
            </div>
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${pressureColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{usedMB != null ? `${usedMB} MB` : '—'} / {totalGB != null ? `${totalGB} GB` : '—'}</span>
            </div>
            {availGB != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Available: {availGB} GB
              </p>
            )}

            {/* Disk section */}
            {disk && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Disk Usage</span>
                  {diskUsedPct != null && (
                    <span className="text-xs text-muted-foreground">{diskUsedPct.toFixed(1)}%</span>
                  )}
                </div>
                <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${diskUsedPct ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {diskFreeGB != null ? `${diskFreeGB} GB free` : '—'}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No memory data</p>
        )}
      </CardContent>
    </Card>
  )
}
