"use client";

import { useQuery } from "@tanstack/react-query";
import { getUsageOverview } from "@/lib/api/admin-api";

export function useUsageOverview() {
  return useQuery({
    queryKey: ["admin", "usage", "overview"],
    queryFn: getUsageOverview,
  });
}
