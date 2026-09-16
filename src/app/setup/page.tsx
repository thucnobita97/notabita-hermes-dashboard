'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  XCircle,
  Play,
  RotateCcw,
  SkipForward,
  Loader2,
  LayoutDashboard,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSetupWizard, type StepStatus } from '@/hooks/use-setup-wizard'
import { useEffect, useRef } from 'react'

// Navigation items
const navItems = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Sync', href: '/sync', icon: RefreshCw },
  { label: 'Setup', href: '/setup', icon: Settings },
] as const

function StepIcon({ status, index }: { status: StepStatus | undefined; index: number }) {
  if (status === 'success') return <CheckCircle2 className="size-5 text-green-500" />
  if (status === 'error') return <XCircle className="size-5 text-red-500" />
  if (status === 'running') return <Loader2 className="size-5 text-blue-400 animate-spin" />
  if (status === 'skipped') return <CircleDashed className="size-5 text-muted-foreground" />
  return <Circle className="size-5 text-muted-foreground" />
}

function CheckItemIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
  ) : (
    <XCircle className="size-4 text-red-500 shrink-0" />
  )
}

function logLineClass(line: string): string {
  if (line.startsWith('[OK]')) return 'text-green-400'
  if (line.startsWith('[ERROR]')) return 'text-red-400'
  if (line.startsWith('[INFO]')) return 'text-blue-400'
  return 'text-muted-foreground'
}

export default function SetupPage() {
  const pathname = usePathname()
  const {
    currentStep,
    totalSteps,
    stepNames,
    results,
    logs,
    isRunning,
    checkItems,
    startSetup,
    retryStep,
    skipStep,
    goToStep,
  } = useSetupWizard()

  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log panel
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const currentResult = results[currentStep]
  const currentChecks = checkItems[currentStep] ?? []
  const hasStarted = Object.keys(results).length > 0
  const allDone = !isRunning && hasStarted && totalSteps === Object.keys(results).length

  return (
    <div className="flex min-h-screen bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card p-4 flex flex-col gap-1">
        <div className="mb-4 px-2">
          <h2 className="text-lg font-semibold tracking-tight">Hermes</h2>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Setup Wizard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Hermes environment step by step.
          </p>
        </div>

        {/* Stepper */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }, (_, i) => {
                const stepStatus = results[i]?.status as StepStatus | undefined
                const isActive = i === currentStep
                const isCompleted = stepStatus === 'success'
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => goToStep(i)}
                      disabled={isRunning}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 font-medium ring-1 ring-blue-500/30'
                          : isCompleted
                          ? 'text-green-400 hover:bg-muted/50'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <StepIcon status={stepStatus} index={i} />
                      <span className="hidden sm:inline">{stepNames[i]}</span>
                      <span className="sm:hidden">{i + 1}</span>
                    </button>
                    {i < totalSteps - 1 && (
                      <div className="flex-1 mx-2 h-px bg-border" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <StepIcon status={currentResult?.status} index={currentStep} />
                {stepNames[currentStep]}
                {currentResult?.status && (
                  <Badge
                    variant={
                      currentResult.status === 'success'
                        ? 'default'
                        : currentResult.status === 'error'
                        ? 'destructive'
                        : currentResult.status === 'running'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="ml-2"
                  >
                    {currentResult.status}
                  </Badge>
                )}
              </CardTitle>
            </div>
            {currentResult?.message && (
              <p className="text-sm text-muted-foreground">{currentResult.message}</p>
            )}
          </CardHeader>
          <CardContent>
            {currentChecks.length > 0 ? (
              <ul className="space-y-2">
                {currentChecks.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckItemIcon ok={item.ok} />
                    <span className={item.ok ? 'text-foreground' : 'text-red-400'}>
                      {item.label}
                    </span>
                    {item.detail && (
                      <span className="text-muted-foreground ml-1">— {item.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : currentResult?.status === 'running' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {hasStarted
                  ? 'No checklist items for this step.'
                  : 'Click "Start Setup" to begin the wizard.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!hasStarted && (
            <Button onClick={startSetup} disabled={isRunning} size="default">
              <Play className="size-4" />
              Start Setup
            </Button>
          )}
          {hasStarted && !isRunning && !allDone && (
            <>
              <Button variant="outline" onClick={retryStep} disabled={isRunning} size="default">
                <RotateCcw className="size-4" />
                Retry
              </Button>
              <Button variant="ghost" onClick={skipStep} disabled={isRunning} size="default">
                <SkipForward className="size-4" />
                Skip
              </Button>
            </>
          )}
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Running...
            </div>
          )}
          {allDone && (
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="size-3" />
              Setup complete
            </Badge>
          )}
        </div>

        <Separator />

        {/* Log Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Log Output</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-0.5">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">No log output yet.</p>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className={logLineClass(line)}>
                      {line}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
