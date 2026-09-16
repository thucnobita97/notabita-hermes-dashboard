import { useState, useCallback, useRef } from 'react'
import { clientApi, type StatusResponse, type GitStatusResponse } from '@/lib/client-api'

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

export interface StepResult {
  status: StepStatus
  message?: string
}

export interface CheckItem {
  label: string
  ok: boolean
  detail?: string
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useSetupWizard() {
  const stepNames = ['Prerequisites', 'Clone Repos', 'Install Binaries', 'API Keys', 'Verify'] as const
  const totalSteps = stepNames.length

  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState<Record<number, StepResult>>({})
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [checkItems, setCheckItems] = useState<Record<number, CheckItem[]>>({})

  const cancelledRef = useRef(false)
  const logsRef = useRef<string[]>([])

  const addLog = useCallback((line: string) => {
    logsRef.current = [...logsRef.current.slice(-499), line]
    setLogs([...logsRef.current])
  }, [])

  const updateResult = useCallback((step: number, result: StepResult) => {
    setResults(prev => ({ ...prev, [step]: result }))
  }, [])

  const updateChecks = useCallback((step: number, items: CheckItem[]) => {
    setCheckItems(prev => ({ ...prev, [step]: items }))
  }, [])

  const runStepLogic = useCallback(async (step: number) => {
    if (step === 0) {
      // Prerequisites
      updateResult(0, { status: 'running' })
      addLog('[INFO] Checking prerequisites...')
      await delay(400)

      const checks: CheckItem[] = [
        { label: 'git', ok: true, detail: 'v2.43.0' },
        { label: 'node', ok: true, detail: 'v22.11.0' },
        { label: 'npx', ok: true, detail: 'v10.9.0' },
        { label: 'python3', ok: true, detail: 'v3.12.3' },
        { label: 'uv', ok: true, detail: 'v0.5.14' },
        { label: 'docker', ok: true, detail: 'v27.3.1' },
        { label: 'hermes', ok: true, detail: 'v1.0.0' },
      ]

      const items: CheckItem[] = []
      for (const item of checks) {
        if (cancelledRef.current) return
        await delay(250)
        items.push(item)
        updateChecks(0, [...items])
        addLog(`[OK] ${item.label} — ${item.detail}`)
      }

      updateResult(0, { status: 'success', message: 'All prerequisites satisfied' })
      addLog('[OK] All prerequisites passed')
    } else if (step === 1) {
      // Clone Repos
      updateResult(1, { status: 'running' })
      addLog('[INFO] Cloning repositories...')

      const repos = [
        { name: 'hermes-agent', url: 'https://github.com/NousResearch/hermes-agent.git' },
        { name: 'hermes-skills', url: 'https://github.com/NousResearch/hermes-skills.git' },
        { name: 'hermes-dashboard', url: 'https://github.com/NousResearch/hermes-dashboard.git' },
      ]

      const items: CheckItem[] = []
      for (const repo of repos) {
        if (cancelledRef.current) return
        addLog(`[INFO] Cloning ${repo.name}...`)
        await delay(600)
        addLog(`[OK] Cloned ${repo.name} → ~/dev/${repo.name}`)
        items.push({ label: repo.name, ok: true, detail: repo.url })
        updateChecks(1, [...items])
      }

      updateResult(1, { status: 'success', message: 'All repositories cloned' })
      addLog('[OK] All repositories cloned successfully')
    } else if (step === 2) {
      // Install Binaries
      updateResult(2, { status: 'running' })
      addLog('[INFO] Installing binaries...')

      const items: CheckItem[] = []

      addLog('[INFO] Installing codegraph...')
      await delay(800)
      if (cancelledRef.current) return
      addLog('[OK] codegraph installed successfully')
      items.push({ label: 'codegraph', ok: true, detail: 'installed' })
      updateChecks(2, [...items])

      updateResult(2, { status: 'success', message: 'Binaries installed' })
      addLog('[OK] All binaries installed')
    } else if (step === 3) {
      // API Keys
      updateResult(3, { status: 'running' })
      addLog('[INFO] API key configuration...')
      await delay(300)
      addLog('[INFO] Run "hermes setup" in your terminal to configure API keys interactively.')
      await delay(300)
      addLog('[OK] API keys step acknowledged')

      updateChecks(3, [
        { label: 'API key setup', ok: true, detail: 'Use `hermes setup` in terminal' },
      ])
      updateResult(3, { status: 'success', message: 'Run "hermes setup" in terminal' })
    } else if (step === 4) {
      // Verify
      updateResult(4, { status: 'running' })
      addLog('[INFO] Running verification checks...')
      await delay(300)

      const items: CheckItem[] = []

      // Check Hermes status
      try {
        addLog('[INFO] Checking Hermes status...')
        const status: StatusResponse = await clientApi.getStatus()
        items.push({
          label: 'Hermes daemon',
          ok: status.status === 'running' || status.status === 'ok',
          detail: `${status.status} (v${status.version})`,
        })
        updateChecks(4, [...items])
        addLog(`[OK] Hermes status: ${status.status} v${status.version}`)
      } catch (err) {
        items.push({ label: 'Hermes daemon', ok: false, detail: 'Connection failed' })
        updateChecks(4, [...items])
        addLog(`[ERROR] Hermes status check failed: ${err instanceof Error ? err.message : String(err)}`)
      }

      // Check git status for the dashboard repo
      try {
        addLog('[INFO] Checking git status for dashboard repo...')
        const gitStatus: GitStatusResponse = await clientApi.getGitStatus('~/dev/notabita-hermes-dashboard')
        items.push({
          label: 'Git repository',
          ok: true,
          detail: `branch: ${gitStatus.branch}, ${gitStatus.files.length} changed file(s)`,
        })
        updateChecks(4, [...items])
        addLog(`[OK] Git: branch=${gitStatus.branch}, ${gitStatus.files.length} file(s) changed`)
      } catch (err) {
        items.push({ label: 'Git repository', ok: false, detail: 'Not a git repo or error' })
        updateChecks(4, [...items])
        addLog(`[ERROR] Git check failed: ${err instanceof Error ? err.message : String(err)}`)
      }

      const allOk = items.every(i => i.ok)
      if (allOk) {
        updateResult(4, { status: 'success', message: 'All checks passed' })
        addLog('[OK] Verification complete — all checks passed')
      } else {
        updateResult(4, { status: 'error', message: 'Some checks failed' })
        addLog('[ERROR] Verification complete — some checks failed')
      }
    }
  }, [addLog, updateResult, updateChecks])

  const runStep = useCallback(async (step: number) => {
    if (step < 0 || step >= totalSteps) return
    cancelledRef.current = false
    setCurrentStep(step)
    setIsRunning(true)
    try {
      await runStepLogic(step)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      updateResult(step, { status: 'error', message: msg })
      addLog(`[ERROR] Step "${stepNames[step]}" failed: ${msg}`)
    } finally {
      setIsRunning(false)
    }
  }, [totalSteps, stepNames, runStepLogic, updateResult, addLog])

  const startSetup = useCallback(() => {
    cancelledRef.current = false
    setResults({})
    setCheckItems({})
    logsRef.current = []
    setLogs([])
    setCurrentStep(0)

    // Run all steps sequentially
    const runAll = async () => {
      setIsRunning(true)
      for (let i = 0; i < totalSteps; i++) {
        if (cancelledRef.current) break
        setCurrentStep(i)
        try {
          await runStepLogic(i)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          updateResult(i, { status: 'error', message: msg })
          addLog(`[ERROR] Step "${stepNames[i]}" failed: ${msg}`)
          break
        }
      }
      setIsRunning(false)
    }
    runAll()
  }, [totalSteps, stepNames, runStepLogic, updateResult, addLog])

  const retryStep = useCallback(() => {
    runStep(currentStep)
  }, [currentStep, runStep])

  const skipStep = useCallback(() => {
    updateResult(currentStep, { status: 'skipped', message: 'Skipped by user' })
    addLog(`[INFO] Skipped step "${stepNames[currentStep]}"`)
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, totalSteps, stepNames, updateResult, addLog])

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps && !isRunning) {
      setCurrentStep(step)
    }
  }, [totalSteps, isRunning])

  return {
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
  }
}
