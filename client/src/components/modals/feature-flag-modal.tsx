// src/components/feature-flag-dialog.tsx

import { useEffect, useState } from "react"

import { Flag, Plus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { featureFlagAPI, handleError } from "@/services/feature-flag.service"
import { toaster } from "@/lib/toast"

interface FeatureFlagFormData {
  _id?: string
  title: string
  feature_key: string
  description?: string
  enabled: boolean
}

interface FeatureFlagModalProps {
  mode: "create" | "edit"
  featureFlag?: FeatureFlagFormData
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function FeatureFlagModal({
  mode,
  featureFlag,
  open,
  onOpenChange,
  onSuccess,
}: FeatureFlagModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  const [formData, setFormData] = useState<FeatureFlagFormData>({
    title: "",
    feature_key: "",
    description: "",
    enabled: true,
  })

  useEffect(() => {
    if (featureFlag) {
      setFormData({
        title: featureFlag.title || "",
        feature_key: featureFlag.feature_key || "",
        description: featureFlag.description || "",
        enabled: featureFlag.enabled ?? true,
      })
    }
  }, [featureFlag])

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.feature_key.trim()) {
      toaster.error("Title and Feature Key are required")
      return
    }

    try {
      setLoading(true)

      if (mode === "create") {
        await featureFlagAPI.create({
          title: formData.title,
          feature_key: formData.feature_key,
          description: formData.description,
          enabled: formData.enabled,
        })
      } else if (mode === "edit" && featureFlag?._id) {
        await featureFlagAPI.update(featureFlag._id, {
          title: formData.title,
          feature_key: formData.feature_key,
          description: formData.description,
          enabled: formData.enabled,
        })
      }

      toaster.success(mode === "create" ? "Feature flag created" : "Feature flag updated")
      onSuccess?.()
      setIsOpen(false)
      
      // Reset form when closing
      if (!isOpen) {
        setFormData({
          title: "",
          feature_key: "",
          description: "",
          enabled: true,
        })
      }
    } catch (err) {
      toaster.error(handleError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      if (!featureFlag) {
        setFormData({
          title: "",
          feature_key: "",
          description: "",
          enabled: true,
        })
      } else if (!open) {
        // Reset to original values when canceling edit
        setFormData({
          title: featureFlag.title || "",
          feature_key: featureFlag.feature_key || "",
          description: featureFlag.description || "",
          enabled: featureFlag.enabled ?? true,
        })
      }
    }
    setIsOpen(open)
  }

  const triggerButton = mode === "create" ? (
    <Button size="lg" className="rounded-2xl">
      <Plus className="h-4 w-4" />
      Create Feature Flag
    </Button>
  ) : (
    <Button
      size="icon"
      variant="outline"
      className="rounded-xl"
    >
      <Flag className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}

      <DialogContent className="sm:max-w-lg rounded-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {mode === "create"
              ? "Create Feature Flag"
              : "Edit Feature Flag"}
          </DialogTitle>

          <DialogDescription>
            Configure feature rollout settings for your
            organization.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">
              Feature Name
            </Label>

            <Input
              id="title"
              placeholder="New Dashboard"
              className="rounded-2xl"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature_key">
              Feature Key
            </Label>

            <Input
              id="feature_key"
              placeholder="new_dashboard"
              className="rounded-2xl"
              value={formData.feature_key}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  feature_key: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>

            <textarea
              id="description"
              placeholder="Short description..."
              className="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div className="space-y-1">
              <p className="font-medium">
                Enable Feature
              </p>

              <p className="text-sm text-muted-foreground">
                Toggle feature availability.
              </p>
            </div>

            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  enabled: checked,
                }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="rounded-2xl"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create"
                ? "Create Feature"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}