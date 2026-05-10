// src/components/create-organization-dialog.tsx

import { useState } from "react"

import { Plus } from "lucide-react"

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
import { type Organization } from "@/services/organization.service"
import apiClient from "@/lib/api-client"

interface CreateOrganizationModalProps {
  onSuccess?: (organization: Organization) => void
}

export function CreateOrganizationModal({ onSuccess }: CreateOrganizationModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  // const [sendInvite, setSendInvite] = useState(true)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError("Organization name is required")
      return
    }

    if (!adminEmail.trim()) {
      setError("Admin email is required when sending invite")
      return
    }

    setLoading(true)
    setError("")

    try {
      // if (sendInvite) {
        // Create organization with invite - call the invite API
        const response = await apiClient.post("/invites/organization", {
          organization: name.trim(),
          email: adminEmail.trim(),
          username: adminName.trim() || adminEmail.trim().split("@")[0],
        })
        
        const data = response.data
        
        // Create a placeholder org for display (will be created when invite is consumed)
        const placeholderOrg: Organization = {
          _id: data.data.token,
          name: name.trim(),
          admin_id: {
            _id: "",
            name: adminName || adminEmail,
            email: adminEmail,
            role: "ORG_ADMIN",
          },
          status: "INVITED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        onSuccess?.(placeholderOrg)
      // } else {
      //   // Direct creation - requires admin_id which we don't have in this flow
      //   // This would require selecting an existing user
      //   setError("Direct organization creation requires selecting an existing user. Please use invite flow.")
      //   setLoading(false)
      //   return
      // }
      
      setName("")
      setAdminEmail("")
      setAdminName("")
      setOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create organization")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("")
      setAdminEmail("")
      setAdminName("")
      setError("")
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

      <DialogContent className="sm:max-w-lg rounded-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Create Organization
          </DialogTitle>

          <DialogDescription>
            Create a new organization and invite an admin.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="name">
              Organization Name
            </Label>

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
            {/* <div className="flex items-center space-x-2">
              <Switch
                id="sendInvite"
                checked={sendInvite}
                onCheckedChange={setSendInvite}
                disabled={loading}
              />
              <Label htmlFor="sendInvite" className="text-sm font-normal">
                Send invite to organization admin
              </Label>
            </div> */}

            {/* {sendInvite && ( */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">
                    Admin Name
                  </Label>
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
                  <Label htmlFor="adminEmail">
                    Admin Email
                  </Label>
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
            {/* )} */}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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

            <Button
              type="submit"
              className="rounded-2xl"
              disabled={loading}
            >
              {loading ? "Creating..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}