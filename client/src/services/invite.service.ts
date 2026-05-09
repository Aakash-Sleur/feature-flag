import apiClient from "@/lib/api-client"

interface CreateInviteData {
  email: string
  username: string
  expired_at?: string
}

interface InviteDetails {
  email: string
  username: string
  is_admin: boolean
  organization: {
    _id: string
    name: string
  }
  expired_at: string
}

export interface InviteResult {
  token: string
  email: string
  username: string
  organization: string
  expired_at: string
  emailSent: boolean
}

interface CreateInviteResponse {
  success: boolean
  message: string
  data: InviteResult
}

interface GetInviteResponse {
  success: boolean
  message: string
  data: InviteDetails
}

interface ConsumeInviteData {
  token: string
  password: string
}

interface ConsumeResult {
  user: {
    _id: string
    name: string
    email: string
    role: string
  }
  organization: {
    _id: string
    name: string
    isNew: boolean
  }
  accessToken: string
}

interface ConsumeInviteResponse {
  success: boolean
  message: string
  data: ConsumeResult
}

export const inviteAPI = {
  /**
   * Creates an invitation for an end user to join the admin's organization
   * POST /api/invites/user
   */
  async createUserInvite(data: CreateInviteData): Promise<InviteResult> {
    const response = await apiClient.post<CreateInviteResponse>("/invites/user", data)
    return response.data.data
  },

  /**
   * Gets invite details by token
   * GET /api/invites/:token
   */
  async getInvite(token: string): Promise<InviteDetails> {
    const response = await apiClient.get<GetInviteResponse>(`/invites/${token}`)
    return response.data.data
  },

  /**
   * Consumes an invitation and creates a user account
   * POST /api/invites/consume
   */
  async consumeInvite(data: ConsumeInviteData): Promise<ConsumeResult> {
    const response = await apiClient.post<ConsumeInviteResponse>("/invites/consume", data)
    return response.data.data
  },
}