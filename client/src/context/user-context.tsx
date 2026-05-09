import React, { createContext, useContext, useEffect, useState } from "react"

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface Organization {
  _id: string
  name: string
}

interface UserContextType {
  user: User | null
  organization: Organization | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setAccessToken: (token: string | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedOrg = localStorage.getItem("organization")
    const storedToken = localStorage.getItem("accessToken")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedOrg) {
      setOrganization(JSON.parse(storedOrg))
    }
    if (storedToken) {
      setAccessToken(storedToken)
    }

    setIsLoading(false)
  }, [])

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    } else {
      localStorage.removeItem("user")
    }
  }, [user])

  // Persist organization to localStorage whenever it changes
  useEffect(() => {
    if (organization) {
      localStorage.setItem("organization", JSON.stringify(organization))
    } else {
      localStorage.removeItem("organization")
    }
  }, [organization])

  // Persist token to localStorage whenever it changes
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken)
    } else {
      localStorage.removeItem("accessToken")
    }
  }, [accessToken])

  const logout = () => {
    setUser(null)
    setOrganization(null)
    setAccessToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("organization")
    localStorage.removeItem("accessToken")
  }

  const value: UserContextType = {
    user,
    organization,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    setUser,
    setOrganization,
    setAccessToken,
    logout,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
