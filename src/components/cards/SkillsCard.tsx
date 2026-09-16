'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

export function SkillsCard({ data, loading }: Props) {
  const count: number =
    data && typeof data === 'object'
      ? typeof (data as Record<string, unknown>).skills_count === 'number'
        ? ((data as Record<string, unknown>).skills_count as number)
        : Array.isArray((data as Record<string, unknown>).skills)
          ? ((data as Record<string, unknown>).skills as unknown[]).length
          : 0
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <Skeleton className="h-12 w-20" />
        ) : (
          <p className="text-4xl font-bold tracking-tight">{count}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">loaded</p>
      </CardContent>
    </Card>
  )
}
