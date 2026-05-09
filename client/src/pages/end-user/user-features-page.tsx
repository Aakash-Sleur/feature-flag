// src/pages/end-user/features.tsx

import { useCallback, useEffect, useState } from "react"

import { CheckCircle2, Flag, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { FeatureFlagData } from "../organization-admin/feature-flags"
import { featureFlagAPI } from "@/services/feature-flag.service"
import { toast } from "sonner"

const initialFeatures = [
  {
    id: "1",
    name: "New Dashboard",
    key: "new_dashboard",
    enabled: true,
  },
  {
    id: "2",
    name: "Beta Checkout",
    key: "beta_checkout",
    enabled: false,
  },
  {
    id: "3",
    name: "Experimental Search",
    key: "experimental_search",
    enabled: true,
  },
]

export function UserFeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlagData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeatureFlags = useCallback(async () => {
    try {
      setLoading(true)
      const data = await featureFlagAPI.getAll()
      setFlags(data)
    } catch (err) {
      console.error(err)
      toast.error("Error while fetching features")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeatureFlags()
  }, [fetchFeatureFlags])

  if (loading) {
    return <p>Loading</p>
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            Feature Access
          </h1>

          <p className="text-muted-foreground">
            Check which features are available for your organization.
          </p>
        </div>

        {/* FEATURES */}
        <div className="grid gap-6">
          {flags.map((feature) => (
            <Card key={feature._id} className="rounded-4xl">
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Flag className="h-6 w-6 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">{feature.title}</h2>

                      <Badge
                        variant={feature.enabled ? "default" : "secondary"}
                        className="rounded-xl"
                      >
                        {feature.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {feature.feature_key}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {feature.enabled ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-primary" />

                          <span className="text-sm text-muted-foreground">
                            Feature available for your organization
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-muted-foreground" />

                          <span className="text-sm text-muted-foreground">
                            Feature currently disabled
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* READ ONLY SWITCH */}
                <div className="flex items-center justify-end">
                  <Switch checked={feature.enabled} disabled />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
