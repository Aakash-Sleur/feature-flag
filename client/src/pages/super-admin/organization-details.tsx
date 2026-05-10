// src/pages/super-admin/organization-details.tsx

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import {
  Building2,
  CalendarDays,
  Flag,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { superAdminAPI } from "@/services/super-admin.service"

interface FeatureFlag {
  _id: string
  title: string
  feature_key: string
  description?: string
  enabled: boolean
  created_by?: string
  createdAt?: string
  updatedAt?: string
}

export function OrganizationDetailsPage() {
  const { id } = useParams()
  const [organization, setOrganization] = useState<any | null>(null)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError("Organization ID is missing")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch organization details using super admin API
        const data = await superAdminAPI.getOrganizationDetails(id)
        setOrganization(data.organization)
        setFeatureFlags(data.featureFlags)
      } catch (err) {
        console.error("Failed to fetch organization details:", err)
        setError("Failed to load organization details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading organization details...</p>
          </div>
        </section>
      </main>
    )
  }

  if (error || !organization) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
          <div className="flex items-center justify-center py-20">
            <p className="text-red-500">{error || "Organization not found"}</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        {/* HEADER */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-4xl font-bold tracking-tight">
                  {organization.name}
                </h1>

                <Badge
                  variant="secondary"
                  className="rounded-xl"
                >
                  Active
                </Badge>
              </div>

              <p className="text-muted-foreground">
                {organization.admin_id?.name || "Organization"} - {organization.admin_id?.email}
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-1 text-sm text-muted-foreground">
                {/* <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {organization.slug || "N/A"}
                </div> */}

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(organization.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
{/* 
                <div className="text-xs text-muted-foreground">
                  ID: {organization._id}
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-4xl">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Total Users
                </p>

                <h2 className="text-3xl font-bold">
                  {organization.stats?.userCount || 0}
                </h2>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-4xl">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Org Admins
                </p>

                <h2 className="text-3xl font-bold">
                  {organization.stats?.adminCount || 0}
                </h2>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-4xl">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Flag className="h-6 w-6 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Feature Flags
                </p>

                <h2 className="text-3xl font-bold">
                  {organization.stats?.featureFlagCount || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FEATURE FLAGS */}
        <Card className="rounded-4xl">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-semibold">
                Feature Flags
              </h2>

              <p className="text-sm text-muted-foreground">
                {featureFlags.length === 0
                  ? "No feature flags configured for this organization."
                  : `${featureFlags.length} flag${featureFlags.length !== 1 ? "s" : ""} configured for this organization.`}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              {featureFlags.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No feature flags to display
                </p>
              ) : (
                featureFlags.map((flag) => (
                  <div
                    key={flag._id}
                    className="flex items-center justify-between rounded-2xl border border-border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {flag.title || flag.feature_key}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {flag.description || flag.feature_key}
                      </p>
                    </div>

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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}