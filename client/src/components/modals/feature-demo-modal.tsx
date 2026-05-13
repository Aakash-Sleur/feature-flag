import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { featureFlagAPI } from "@/services/feature-flag.service"
import { toast } from "sonner"

export function FeatureDemoModal() {
  const [featureKey, setFeatureKey] = useState("")
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleFeatureKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeatureKey(e.target.value)
    // Reset the enabled state when the key changes
    setEnabled(null)
  }

  const handleSubmit = async () => {
    if (!featureKey.trim()) {
      toast.error("Please enter a feature key")
      return
    }

    try {
      setLoading(true)
      const result = await featureFlagAPI.checkByKey(featureKey.trim())
      setEnabled(result.enabled)
    } catch (err: any) {
      console.error(err)
      const errorMessage =
        err.response?.data?.message || "Error checking feature"
      toast.error(errorMessage)
      setEnabled(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && featureKey.trim() && !loading) {
      handleSubmit()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when closing
      setFeatureKey("")
      setEnabled(null)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Check Feature</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feature Flag Demo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Check whether a feature is enabled for your organization.
          </p>
          <Input
            type="text"
            placeholder="Enter feature key (e.g., dark_mode)"
            value={featureKey}
            onChange={handleFeatureKeyChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !featureKey.trim()}
            className="w-full"
          >
            {loading ? "Checking..." : "Check Feature"}
          </Button>
          {enabled !== null && (
            <div
              className={`rounded-md p-3 text-sm ${
                enabled
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span className="font-medium">{featureKey}</span>{" "}
              {enabled ? "Enabled" : "Disabled"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
