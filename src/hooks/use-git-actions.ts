import { useCallback, useState } from 'react'
import { usePolling } from './use-polling'
import { clientApi, type GitStatusResponse } from '@/lib/client-api'

export function useGitActions(repoPath: string): {
  status: GitStatusResponse | null
  loading: boolean
  error: Error | null
  stage: (file: string) => Promise<void>
  commit: (message: string, push?: boolean) => Promise<void>
  push: () => Promise<void>
  refetch: () => void
} {
  const [actionLoading, setActionLoading] = useState(false)

  const fetcher = useCallback(
    () => clientApi.getGitStatus(repoPath),
    [repoPath]
  )

  const { data: status, loading, error, refetch } = usePolling<GitStatusResponse>(fetcher, 60_000)

  const stage = useCallback(
    async (file: string) => {
      setActionLoading(true)
      try {
        await clientApi.stageFile(repoPath, file)
        refetch()
      } finally {
        setActionLoading(false)
      }
    },
    [repoPath, refetch]
  )

  const commit = useCallback(
    async (message: string, push?: boolean) => {
      setActionLoading(true)
      try {
        await clientApi.commit(repoPath, message, push)
        refetch()
      } finally {
        setActionLoading(false)
      }
    },
    [repoPath, refetch]
  )

  const push = useCallback(async () => {
    setActionLoading(true)
    try {
      await clientApi.push(repoPath)
      refetch()
    } finally {
      setActionLoading(false)
    }
  }, [repoPath, refetch])

  return {
    status,
    loading: loading || actionLoading,
    error,
    stage,
    commit,
    push,
    refetch,
  }
}
