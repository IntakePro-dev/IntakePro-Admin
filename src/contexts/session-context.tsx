"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSessionTimeout } from "@/hooks/use-session-timeout";

interface SessionContextValue {
  lastActivity: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { lastActivity } = useSessionTimeout();

  return (
    <SessionContext.Provider value={{ lastActivity }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
