import { useState } from "react"

import { UserPlus, Mail, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { inviteAPI, type InviteResult } from "@/services/invite.service"

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (invite: InviteResult) => void
}

export function InviteUserModal({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [errors, setErrors] = useState<{ email?: string; username?: string }>({})
  const [submitError, setSubmitError] = useState("")

  const validateForm = (): boolean => {
    const newErrors: { email?: string; username?: string } = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!username.trim()) {
      newErrors.username = "Username is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const result = await inviteAPI.createUserInvite({
        email: email.trim(),
        username: username.trim(),
      })

      onSuccess?.(result)

      // Reset form
      setEmail("")
      setUsername("")
      setErrors({})
      onOpenChange(false)
    } catch (err: any) {
      setSubmitError(err.message || "Failed to send invitation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEmail("")
      setUsername("")
      setErrors({})
      setSubmitError("")
    }
    onOpenChange(isOpen)
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }))
    }
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-2xl">
          <UserPlus className="h-4 w-4" />
          Invite Users
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg rounded-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Invite End Users
          </DialogTitle>

          <DialogDescription>
            Send an invitation to join your organization.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              className="rounded-2xl"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.email}
            />

            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </Label>

            <Input
              id="username"
              placeholder="John Doe"
              className="rounded-2xl"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.username}
            />

            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="rounded-2xl"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}