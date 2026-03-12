"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
const THROTTLE_MS = 1000; // Throttle activity updates to once per second

export function useSessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const throttleRef = useRef<number>(0);

  const isLoginPage = pathname === "/login";

  const logout = useCallback(() => {
    if (typeof document !== "undefined") {
      document.cookie = "admin_token=; path=/; max-age=0";
    }
    router.push("/login?error=session_timeout");
  }, [router]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    
    // Throttle updates
    if (now - throttleRef.current < THROTTLE_MS) {
      return;
    }
    throttleRef.current = now;
    
    lastActivityRef.current = now;
    setLastActivity(now);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    // Don't run on login page
    if (isLoginPage) {
      return;
    }

    // Set initial timer
    resetTimer();

    // Add event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer, isLoginPage]);

  return { lastActivity, lastActivityRef };
}
