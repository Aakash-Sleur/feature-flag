// src/components/create-organization-dialog.tsx

import { useState } from "react"

import { Plus, Copy, Check, ExternalLink, Info } from "lucide-react"

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
import apiClient from "@/lib/api-client"
import { toaster } from "@/lib/toast"

interface CreateOrganizationModalProps {
  onSuccess?: () => void
}

export function CreateOrganizationModal({
  onSuccess,
}: CreateOrganizationModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  const [inviteToken, setInviteToken] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [showInviteLink, setShowInviteLink] = useState(false)

  const getInviteUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/invite/${inviteToken}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Organization name is required")
      return
    }

    if (!adminEmail.trim()) {
      setError("Admin email is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create organization with invite - call the invite API
      const response = await apiClient.post("/invites/organization", {
        organization: name.trim(),
        email: adminEmail.trim(),
        username: adminName.trim() || adminEmail.trim().split("@")[0],
      })

      const data = response.data

      setInviteToken(data.data.token)
      setShowInviteLink(true)

      onSuccess?.()

      toaster.success("Organization invite created successfully!")
    } catch (err: any) {
      if (err?.status == 409) {
        setError("Organization or email already exists")
      } else {
        setError(err.message || "Failed to create organization")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvite = () => {
    const inviteUrl = getInviteUrl()
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toaster.success("Invite link copied to clipboard!")

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleOpenInvite = () => {
    const inviteUrl = getInviteUrl()
    window.open(inviteUrl, "_blank")
  }

  const handleClose = () => {
    setName("")
    setAdminEmail("")
    setAdminName("")
    setError("")
    setInviteToken("")
    setShowInviteLink(false)
    setCopied(false)
    setOpen(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-2xl">
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-4xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {showInviteLink ? "Invite Created!" : "Create Organization"}
          </DialogTitle>

          <DialogDescription>
            {showInviteLink
              ? "Share this invite link with the organization admin"
              : "Create a new organization and invite an admin."}
          </DialogDescription>
        </DialogHeader>

        {!showInviteLink ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>

              <Input
                id="name"
                placeholder="Acme Inc"
                className="rounded-2xl"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <Input
                  id="adminName"
                  placeholder="John Doe"
                  className="rounded-2xl"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@acme.com"
                  className="rounded-2xl"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value)
                    setError("")
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 text-sm">
              <p className="mb-1 flex items-center font-semibold"><Info size={13} className="mr-1" />Email Invite</p>
              <p>
                An invitation email will be sent to the provided email address.
                You can also copy and share the invite link manually after
                submission.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button type="submit" className="rounded-2xl" disabled={loading}>
                {loading ? "Creating..." : "Create & Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={getInviteUrl()}
                  readOnly
                  className="rounded-2xl font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-2xl"
                  onClick={handleCopyInvite}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-2xl"
                  onClick={handleOpenInvite}
                  title="Open invite link in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-3 text-sm">
              <p className="mb-1 flex items-center font-semibold"><Info size={13} className="mr-1" />Email Invite</p>
              <p>
                An invitation email has been sent to the provided email address.
                You can also copy and share the invite link manually.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                className="w-full rounded-2xl"
                onClick={handleClose}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
