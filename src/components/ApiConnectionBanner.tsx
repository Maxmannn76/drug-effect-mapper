import { useState } from "react";
import { Cloud, CloudOff, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ApiConnectionBannerProps {
  isConnected: boolean;
  onConnect: (url: string) => Promise<boolean>;
}

export function ApiConnectionBanner({ isConnected, onConnect }: ApiConnectionBannerProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!apiUrl.trim()) return;
    setIsConnecting(true);
    await onConnect(apiUrl);
    setIsConnecting(false);
    setShowConfig(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm transition-colors",
        isConnected
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border bg-card/50 text-muted-foreground"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Cloud className="h-4 w-4" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          <span>
            {isConnected
              ? "Connected to API"
              : "Using mock data — connect your Python API for live results"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfig(!showConfig)}
          className="h-8 px-2"
        >
          {showConfig ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
        </Button>
      </div>

      {showConfig && (
        <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
          <Input
            placeholder="https://your-api.com"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="flex-1 h-9 text-foreground"
          />
          <Button
            variant="glow"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting || !apiUrl.trim()}
            className="h-9"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      )}
    </div>
  );
}
