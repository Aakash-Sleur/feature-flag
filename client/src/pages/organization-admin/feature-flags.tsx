// src/pages/org-admin/feature-flags.tsx

import { useState, useEffect, useCallback } from "react"

import {
  Flag,
  Search,
  Trash2,
  Pencil,
  Loader2,
  Plus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Switch } from "@/components/ui/switch"
import { FeatureFlagModal } from "@/components/modals/feature-flag-modal"
import { InviteUserModal } from "@/components/modals/invite-users-modal"
import { featureFlagAPI, handleError } from "@/services/feature-flag.service"
import { toaster } from "@/lib/toast"

export interface FeatureFlagData {
  _id: string
  title: string
  feature_key: string
  description?: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlagData | undefined>(undefined)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchFeatureFlags = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await featureFlagAPI.getAll()
      setFlags(data)
    } catch (err) {
      setError(handleError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeatureFlags()
  }, [fetchFeatureFlags])

  const toggleFlag = async (flag: FeatureFlagData) => {
    try {
      const updated = await featureFlagAPI.toggle(flag._id, !flag.enabled)
      setFlags((prev) =>
        prev.map((f) => (f._id === flag._id ? { ...f, ...updated } : f))
      )
      toaster.success(`Feature ${updated.enabled ? "enabled" : "disabled"}`)
    } catch (err) {
      toaster.error(handleError(err))
    }
  }

  const handleEdit = (flag: FeatureFlagData) => {
    setEditingFlag(flag)
    setEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await featureFlagAPI.delete(id)
      setFlags((prev) => prev.filter((f) => f._id !== id))
      toaster.success("Feature flag deleted successfully")
    } catch (err) {
      toaster.error(handleError(err))
    } finally {
      setDeletingId(null)
    }
  }

  const filteredFlags = flags.filter(
    (flag) =>
      flag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.feature_key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date?: string) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Organization Admin
            </p>

            <h1 className="font-heading text-4xl font-bold tracking-tight">
              Feature Flags
            </h1>

            <p className="text-muted-foreground">
              Manage and control feature rollout for your
              organization.
            </p>
          </div>

          <div className="flex gap-3">
            <InviteUserModal
              open={inviteModalOpen}
              onOpenChange={setInviteModalOpen}
              onSuccess={() => toaster.success("Invitation sent successfully!")}
            />
            <Button 
              size="lg" 
              className="rounded-2xl"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Feature Flag
            </Button>
            <FeatureFlagModal
              mode={"create"}
              open={createModalOpen}
              onOpenChange={setCreateModalOpen}
              onSuccess={() => {
                fetchFeatureFlags()
                setCreateModalOpen(false)
              }}
            />
          </div> 
        </div>

        {/* SEARCH */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search feature flags..."
            className="h-11 rounded-2xl pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* TABLE */}
        <Card className="rounded-4xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFlags.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery
                  ? "No feature flags match your search"
                  : "No feature flags yet. Create one to get started."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">
                      Toggle
                    </TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredFlags.map((flag) => (
                    <TableRow key={flag._id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                            <Flag className="h-5 w-5 text-primary" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {flag.title}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {flag.feature_key}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            flag.enabled
                              ? "default"
                              : "secondary"
                          }
                          className="rounded-xl"
                        >
                          {flag.enabled
                            ? "Enabled"
                            : "Disabled"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {formatDate(flag.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={() => toggleFlag(flag)}
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => handleEdit(flag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => handleDelete(flag._id)}
                            disabled={deletingId === flag._id}
                          >
                            {deletingId === flag._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* EDIT MODAL */}
        {editingFlag && (
          <FeatureFlagModal
            mode={"edit"}
            featureFlag={editingFlag}
            open={editModalOpen}
            onOpenChange={(open) => {
              setEditModalOpen(open)
              if (!open) setEditingFlag(undefined)
            }}
            onSuccess={() => {
              fetchFeatureFlags()
              setEditModalOpen(false)
              setEditingFlag(undefined)
            }}
          />
        )}
      </section>
    </main>
  )
}