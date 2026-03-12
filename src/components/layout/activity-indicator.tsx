"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityIndicatorProps {
  lastActivity: number;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function ActivityIndicator({ lastActivity }: ActivityIndicatorProps) {
  const [display, setDisplay] = useState("just now");

  useEffect(() => {
    setDisplay(formatTimeAgo(lastActivity));
    
    const interval = setInterval(() => {
      setDisplay(formatTimeAgo(lastActivity));
    }, 10000);
    
    return () => clearInterval(interval);
  }, [lastActivity]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
          <Clock className="h-3 w-3" />
          <span>{display}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Last activity: {display}</p>
        <p className="text-xs text-muted-foreground">Session times out after 30 minutes of inactivity</p>
      </TooltipContent>
    </Tooltip>
  );
}
