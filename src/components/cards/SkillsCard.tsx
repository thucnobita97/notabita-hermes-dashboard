'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Skill } from '@/lib/client-api'

interface Props {
  skills: Skill[]
  loading: boolean
}

export function SkillsCard({ skills, loading }: Props) {
  const total = skills.length
  const enabledCount = skills.filter((s) => s.enabled).length

  // Group by category, count each
  const categoryCounts: Record<string, number> = {}
  for (const skill of skills) {
    const cat = skill.category ?? 'uncategorized'
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  }

  // Sort descending by count, take top 5
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && skills.length === 0 ? (
          <Skeleton className="h-12 w-20" />
        ) : (
          <>
            <p className="text-4xl font-bold tracking-tight">{total}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {enabledCount} enabled / {total} total
            </p>
            {topCategories.length > 0 && (
              <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
                {topCategories.map(([cat, count]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="capitalize">{cat}</span>
                    <span className="font-mono text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
