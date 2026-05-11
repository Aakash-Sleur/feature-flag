import axios, { type AxiosInstance, AxiosError } from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"

// Log the API URL being used (helpful for debugging)
console.log('🌐 API Base URL:', API_BASE_URL)
console.log('🔧 Environment:', import.meta.env.MODE)

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Don't add Authorization header for login/register/public endpoints
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/register/invite', '/invites/consume']
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint))
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem("accessToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
          }
        )

        const { accessToken } = refreshResponse.data.data
        localStorage.setItem("accessToken", accessToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Clear auth data and redirect to login
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        localStorage.removeItem("organization")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
