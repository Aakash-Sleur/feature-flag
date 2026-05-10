import apiClient from "@/lib/api-client"

interface FeatureFlag {
  _id: string
  organization_id?: string
  title: string
  feature_key: string
  description?: string
  enabled: boolean
  created_by?: string
  createdAt?: string
  updatedAt?: string
}

interface FeatureFlagResponse {
  success: boolean
  message: string
  data: FeatureFlag | FeatureFlag[]
}

interface ApiError {
  response?: {
    data?: {
      message?: string
      error?: string
    }
  }
}

const handleError = (error: unknown): string => {
  const apiError = error as ApiError
  return apiError.response?.data?.message || "An error occurred"
}

export const featureFlagAPI = {
  async getAll(): Promise<FeatureFlag[]> {
    const response = await apiClient.get<FeatureFlagResponse>("/features")
    const data = response.data.data
    return Array.isArray(data) ? data : data ? [data] : []
  },

  async getById(id: string): Promise<FeatureFlag> {
    const response = await apiClient.get<FeatureFlagResponse>(
      `/features/${id}`
    )
    return response.data.data as FeatureFlag
  },

  async create(data: { title: string; feature_key: string; description?: string; enabled: boolean }): Promise<FeatureFlag> {
    const response = await apiClient.post<FeatureFlagResponse>(
      "/features",
      data
    )
    return response.data.data as FeatureFlag
  },

  async update(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await apiClient.put<FeatureFlagResponse>(
      `/features/${id}`,
      data
    )
    return response.data.data as FeatureFlag
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/features/${id}`)
  },

  async toggle(id: string, enabled: boolean): Promise<FeatureFlag> {
    const response = await apiClient.put<FeatureFlagResponse>(
      `/features/${id}`,
      { enabled }
    )
    return response.data.data as FeatureFlag
  },
}

export { handleError }
