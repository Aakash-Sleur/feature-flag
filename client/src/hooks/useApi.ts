import { useCallback, useState } from "react"
import apiClient from "@/lib/api-client"

interface UseApiOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const useApi = <T,>(options?: UseApiOptions) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const request = useCallback(
    async (config: Parameters<typeof apiClient.request>[0]) => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.request<T>(config)
        setData(response.data)
        options?.onSuccess?.()
        return response.data
      } catch (err) {
        const error = err instanceof Error ? err : new Error("An error occurred")
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  const get = useCallback(
    (url: string) => request({ method: "GET", url }),
    [request]
  )

  const post = useCallback(
    (url: string, data?: any) => request({ method: "POST", url, data }),
    [request]
  )

  const put = useCallback(
    (url: string, data?: any) => request({ method: "PUT", url, data }),
    [request]
  )

  const patch = useCallback(
    (url: string, data?: any) => request({ method: "PATCH", url, data }),
    [request]
  )

  const del = useCallback(
    (url: string) => request({ method: "DELETE", url }),
    [request]
  )

  return {
    loading,
    error,
    data,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
  }
}
