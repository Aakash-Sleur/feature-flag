import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { featureFlagAPI } from "@/services/feature-flag.service";
import { toast } from "sonner";

export function FeatureDemoModal() {
  const [featureKey, setFeatureKey] = useState("");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!featureKey.trim()) {
      toast.error("Please enter a feature key");
      return;
    }

    try {
      setLoading(true);
      const result = await featureFlagAPI.checkByKey(featureKey.trim());
      setEnabled(result.enabled);
    } catch (err) {
      console.error(err);
      toast.error("Error checking feature");
      setEnabled(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setFeatureKey("");
      setEnabled(null);
      setLoading(false);
    }
  };

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
            placeholder="Enter feature key"
            value={featureKey}
            onChange={(e) => setFeatureKey(e.target.value)}
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !featureKey.trim()}
            className="w-full"
          >
            {loading ? "Checking..." : "Check Feature"}
          </Button>
          {enabled !== null && (
            <div className="p-4 border rounded-lg">
              <p className="font-medium">
                Feature{" "}
                <span className="font-bold">{featureKey}</span>{" "}
                is{" "}
                <span
                  className={
                    enabled ? "text-green-600" : "text-red-600"
                  }
                >
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}