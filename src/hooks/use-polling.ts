import { useCallback, useEffect, useRef, useState } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetcherRef = useRef(fetcher)
  const mountedRef = useRef(true)

  // Keep fetcher ref current without re-triggering effects
  fetcherRef.current = fetcher

  const doFetch = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetcherRef.current()
      if (mountedRef.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    mountedRef.current = true
    doFetch()
    return () => {
      mountedRef.current = false
    }
  }, [doFetch])

  // Set up interval
  useEffect(() => {
    if (interval <= 0) return
    const id = setInterval(doFetch, interval)
    return () => clearInterval(id)
  }, [doFetch, interval])

  const refetch = useCallback(() => {
    doFetch()
  }, [doFetch])

  return { data, loading, error, refetch }
}
