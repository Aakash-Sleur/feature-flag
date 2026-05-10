// src/services/super-admin.service.ts

import apiClient from "@/lib/api-client"

export interface OrganizationDetails {
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
  stats?: {
    userCount: number
    adminCount: number
    endUserCount: number
    featureFlagCount: number
    enabledFlags: number
  }
}

export interface User {
  _id: string
  name: string
  email: string
  role: string
  organization_id?: {
    _id: string
    name: string
  }
  is_super_admin?: boolean
  createdAt: string
}

export interface FeatureFlag {
  _id: string
  title: string
  feature_key: string
  description?: string
  enabled: boolean
  organization_id?: {
    _id: string
    name: string
  }
  created_by?: string
  createdAt?: string
}

interface SuperAdminResponse<T> {
  success: boolean
  message: string
  data: T
}

export const superAdminAPI = {
  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<OrganizationDetails[]> {
    const response = await apiClient.get<
      SuperAdminResponse<{ organizations: OrganizationDetails[] }>
    >("/super-admin/organizations")
    return response.data.data.organizations
  },

  /**
   * Get organization details by ID
   */
  async getOrganizationDetails(id: string): Promise<{
    organization: OrganizationDetails
    users: User[]
    featureFlags: FeatureFlag[]
  }> {
    const response = await apiClient.get<
      SuperAdminResponse<{
        organization: OrganizationDetails
        users: User[]
        featureFlags: FeatureFlag[]
      }>
    >(`/super-admin/organizations/${id}`)
    return response.data.data
  },

  /**
   * Get all feature flags across organizations
   */
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await apiClient.get<
      SuperAdminResponse<{ flags: FeatureFlag[] }>
    >("/super-admin/feature-flags")
    return response.data.data.flags
  },

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<SuperAdminResponse<{ users: User[] }>>(
      "/super-admin/users"
    )
    return response.data.data.users
  },

  /**
   * Update user assignment
   */
  async updateUserAssignment(
    userId: string,
    data: { role?: string; organizationId?: string }
  ): Promise<User> {
    const response = await apiClient.put<SuperAdminResponse<{ user: User }>>(
      `/super-admin/users/${userId}/assignment`,
      data
    )
    return response.data.data.user
  },

  /**
   * Get dashboard statistics
   */
  async getStatistics(): Promise<{
    overview: {
      totalOrganizations: number
      totalUsers: number
      totalFeatureFlags: number
    }
    users: {
      superAdmins: number
      orgAdmins: number
      endUsers: number
      unassigned: number
    }
    featureFlags: {
      enabled: number
      disabled: number
    }
    recentOrganizations: OrganizationDetails[]
    recentUsers: User[]
  }> {
    const response = await apiClient.get<SuperAdminResponse<any>>(
      "/super-admin/statistics"
    )
    return response.data.data
  },
}
