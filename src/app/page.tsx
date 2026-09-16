'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePolling } from '@/hooks/use-polling'
import { clientApi, type StatusResponse, type Skill } from '@/lib/client-api'
import { toast } from 'sonner'

import { ReposCard } from '@/components/cards/ReposCard'
import { SkillsCard } from '@/components/cards/SkillsCard'
import { PluginsCard } from '@/components/cards/PluginsCard'
import { MemoryCard } from '@/components/cards/MemoryCard'
import { GatewayCard } from '@/components/cards/GatewayCard'
import { ContainersCard } from '@/components/cards/ContainersCard'

const NAV_ITEMS = [
  { label: 'Overview', href: '/' },
  { label: 'Sync', href: '/sync' },
  { label: 'Setup', href: '/setup' },
] as const

export default function OverviewPage() {
  const {
    data: status,
    loading,
    error,
  } = usePolling<StatusResponse>(() => clientApi.getStatus(), 30_000)

  const {
    data: skills,
    loading: skillsLoading,
    error: skillsError,
  } = usePolling<Skill[]>(() => clientApi.getSkills(), 60_000)

  // Show toast on API error
  useEffect(() => {
    if (error) {
      toast.error('Failed to fetch status', {
        description: error.message,
      })
    }
  }, [error])

  useEffect(() => {
    if (skillsError) {
      toast.error('Failed to fetch skills', {
        description: skillsError.message,
      })
    }
  }, [skillsError])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Hermes Dashboard</h1>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  item.href === '/'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <GatewayCard data={status} loading={loading} />
          <ReposCard />
          <SkillsCard skills={skills ?? []} loading={skillsLoading} />
          <PluginsCard data={status} loading={loading} />
          <MemoryCard data={status} loading={loading} />
          <ContainersCard data={status} loading={loading} />
        </div>
      </main>
    </div>
  )
}
