import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
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
import { IconLock, IconUser, IconBuildingCommunity, IconAlertCircle, IconCheck } from "@tabler/icons-react"
import { inviteAPI } from "@/services/invite.service"
import { useUser } from "@/context/user-context"
import { getRedirectUrl } from "@/lib/constants"

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

export const InvitePage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setUser, setAccessToken } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInviteDetails() {
      if (!token) {
        setError("Invalid invite link")
        setLoading(false)
        return
      }

      try {
        const details = await inviteAPI.getInvite(token)
        setInviteDetails(details)
      } catch (err: any) {
        const message = err.response?.data?.message || "Invalid or expired invite link"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchInviteDetails()
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setValidationError(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setError(null)

    // Validate passwords
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    if (!token) {
      setError("Invalid invite link")
      return
    }

    setSubmitting(true)

    try {
      const result = await inviteAPI.consumeInvite({
        token,
        password: formData.password,
      })

      // Store the access token and user
      setUser(result.user)
      setAccessToken(result.accessToken)

      const url = getRedirectUrl(result.user.role)
      navigate(url)
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to complete registration"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading invite details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !inviteDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
        <Card className="w-full max-w-md border-destructive/30 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <IconAlertCircle className="size-4" />
              <span>{error}</span>
            </div>
            <Link to="/register">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Complete Registration</CardTitle>
          <CardDescription>
            You've been invited to join {inviteDetails?.organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Details */}
          {inviteDetails && (
            <div className="rounded-md bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <IconUser className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{inviteDetails.username}</p>
                  <p className="text-sm text-muted-foreground">{inviteDetails.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-border/30 pt-3">
                <IconBuildingCommunity className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{inviteDetails.organization.name}</p>
                  <p className="text-sm text-muted-foreground">Organization</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || validationError) && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <IconAlertCircle className="size-4" />
                <span>{error || validationError}</span>
              </div>
            )}

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
                  placeholder="Create a password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={submitting}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <IconLock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={submitting}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              size="lg"
            >
              {submitting ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 size-4" />
                  Create Account
                </>
              )}
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

export default InvitePage