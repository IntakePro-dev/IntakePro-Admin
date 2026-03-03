"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAuditLogs,
  verifyAuditChain,
  exportAuditLogs,
} from "@/lib/api/admin-api";
import type { AuditParams, ExportParams } from "@/lib/types/audit";

export function useAuditLogs(params: AuditParams) {
  return useQuery({
    queryKey: ["admin", "audit", params],
    queryFn: () => getAuditLogs(params),
  });
}

export function useVerifyAuditChain() {
  return useMutation({
    mutationFn: (clientId?: string) => verifyAuditChain(clientId),
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (params: ExportParams) => exportAuditLogs(params),
  });
}
