// src/pages/super-admin/organization-details.tsx

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

const organization = {
  id: "1",
  name: "Acme Inc",
  slug: "acme-inc",
  description:
    "Feature flag infrastructure for internal platform rollout and experimentation.",
  admins: 3,
  users: 128,
  featureFlags: 12,
  createdAt: "May 08, 2026",
  status: "Active",
}

const featureFlags = [
  {
    id: "1",
    key: "new_dashboard",
    enabled: true,
  },
  {
    id: "2",
    key: "beta_checkout",
    enabled: false,
  },
  {
    id: "3",
    key: "experimental_search",
    enabled: true,
  },
]

export function OrganizationDetailsPage() {
  const { id } = useParams()

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
                  {organization.status}
                </Badge>
              </div>

              <p className="text-muted-foreground">
                {organization.description}
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {organization.slug}
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {organization.createdAt}
                </div>

                <div className="text-xs text-muted-foreground">
                  ID: {id}
                </div>
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
                  {organization.users}
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
                  {organization.admins}
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
                  {organization.featureFlags}
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
                Flags configured for this organization.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              {featureFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between rounded-2xl border border-border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {flag.key}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Feature toggle configuration
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
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}