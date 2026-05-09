import apiClient from "@/lib/api-client"

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterData {
    name: string
    email: string
    password: string
    organizationName: string
}

interface AuthResponse {
    success: boolean
    message: string
    data: {
        user: {
            _id: string
            name: string
            email: string
            role: string
        }
        accessToken: string
        organization?: {
            _id: string
            name: string
        }
    }
}

export const authAPI = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>("/auth/login", credentials)
        return response.data
    },

    async register(formData: RegisterData): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>("/auth/register", formData)
        return response.data
    },

    async refreshToken(): Promise<{ accessToken: string }> {
        const response = await apiClient.post<AuthResponse>("/auth/refresh-token")
        return response.data.data
    },


    async logout(): Promise<void> {
        await apiClient.post("/auth/logout")
    },

    async getProfile(): Promise<{ user: any }> {
        const response = await apiClient.get<AuthResponse>("/auth/profile")
        return response.data.data
    },
}
