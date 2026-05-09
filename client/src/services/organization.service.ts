import apiClient from "@/lib/api-client"

export interface Organization {
  _id: string
  name: string
  slug?: string
  admin_id: {
    _id: string
    name: string
    email: string
    role: string
  }
  is_accepted: boolean
  createdAt: string
  updatedAt: string
  userCount?: number
}

export interface CreateOrganizationData {
  name: string
  admin_id: string
}

interface OrganizationsResponse {
  success: boolean
  message: string
  data: {
    organizations: Organization[]
    total: number
  }
}

interface OrganizationResponse {
  success: boolean
  message: string
  data: {
    organization: Organization
  }
}

export const organizationAPI = {
  async getAll(): Promise<{ organizations: Organization[]; total: number }> {
    const response = await apiClient.get<OrganizationsResponse>("/organizations")
    return response.data.data
  },

  async getById(id: string): Promise<Organization> {
    const response = await apiClient.get<OrganizationResponse>(`/organizations/${id}`)
    return response.data.data.organization
  },

  async create(data: CreateOrganizationData): Promise<Organization> {
    const response = await apiClient.post<OrganizationResponse>("/organizations", data)
    return response.data.data.organization
  },

  async update(id: string, name: string): Promise<Organization> {
    const response = await apiClient.put<OrganizationResponse>(`/organizations/${id}`, { name })
    return response.data.data.organization
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/organizations/${id}`)
  },
}