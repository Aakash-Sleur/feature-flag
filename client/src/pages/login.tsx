import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconMail, IconLock, IconAlertCircle } from "@tabler/icons-react"
import { authAPI } from "@/services/auth.service"
import { useUser } from "@/context/user-context"

// User role constants
export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  END_USER: "END_USER",
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

// Role to URL mapping
const roleToUrl: Record<UserRoleType, string> = {
  [UserRole.SUPER_ADMIN]: "/super-admin/organizations",
  [UserRole.ORG_ADMIN]: "/org/feature-flags",
  [UserRole.END_USER]: "/user/features",
}

/**
 * Get the redirect URL based on user role
 * @param role - The user's role
 * @returns The appropriate redirect URL
 */
export const getRedirectUrl = (role: string): string => {
  return roleToUrl[role as UserRoleType] ?? "/unauthorized"
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const { setUser, setAccessToken } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await authAPI.login(formData)

      // Update context with user and token
      setUser(data.data.user)
      setAccessToken(data.data.accessToken)

      // Redirect based on user role
      const redirectUrl = getRedirectUrl(data.data.user.role)
      navigate(redirectUrl)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during login"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <IconAlertCircle className="size-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <IconLock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Don't have an account?
                </span>
              </div>
            </div>

            <Link to="/register">
              <Button variant="outline" className="w-full" size="lg" asChild>
                <span>Create Account</span>
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
