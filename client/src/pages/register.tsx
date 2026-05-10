import { useEffect, useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
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
import { IconUser, IconMail, IconLock, IconBuildingCommunity, IconAlertCircle } from "@tabler/icons-react"
import apiClient from "@/lib/api-client"
import { useUser } from "@/context/user-context"
import { getRedirectUrl } from "@/lib/constants"

interface InviteData {
  email: string
  username: string
  is_admin: boolean
  organization: {
    _id: string
    name: string
  }
  expired_at: string
}

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { setUser, setAccessToken, setOrganization } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const invite = searchParams.get("invite")
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  })

  useEffect(() => {
    async function fetchInviteData() {
      try {
        const response = await apiClient.get(`/invites/${invite}`)
        if (response.data?.data) {
          const data = response.data.data as InviteData
          setInviteData(data)
          setFormData((prev) => ({
            ...prev,
            name: data.username,
            email: data.email,
            organizationName: data.organization?.name || "",
          }))
        }
      } catch (err) {
        console.error("Failed to fetch invite:", err)
        // Invalid invite - redirect to regular register
        navigate("/register")
      }
    }
    
    if (invite) {
      fetchInviteData()
    }
  }, [invite, navigate])

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
      let data
      
      if (invite) {
        // Register via invite
        const response = await apiClient.post("/auth/register/invite", {
          token: invite,
          password: formData.password,
        })
        data = response.data
      } else {
        // Regular registration
        const response = await apiClient.post("/auth/register", formData)
        data = response.data
      }

      // Update context with user, token, and organization
      setUser(data.data.user)
      setAccessToken(data.data.accessToken)
      if (data.data.organization) {
        setOrganization(data.data.organization)
      }

      const url = getRedirectUrl(data.data.user.role)

      // Redirect to dashboard
      navigate(url)
    } catch (err: any) {
      const message = err.response?.data?.message || "An error occurred during registration"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Create Account</CardTitle>
          <CardDescription>
            Set up your account and organization
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
              <Label htmlFor="name" className="text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <IconUser className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className="pl-9"
                  required
                />
              </div>
            </div>

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
                  disabled={loading || !!inviteData?.email}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-foreground">
                Organization Name
              </Label>
              <div className="relative">
                <IconBuildingCommunity className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  placeholder="My Company"
                  value={formData.organizationName}
                  onChange={handleChange}
                  disabled={loading || !!inviteData?.organization}
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
                  placeholder="Enter a password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link to="/login">
              <Button variant="outline" className="w-full" size="lg" asChild>
                <span>Sign In Instead</span>
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
