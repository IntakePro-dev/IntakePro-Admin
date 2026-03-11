"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClientReportTemplate,
  updateClientReportTemplate,
  resetClientReportTemplate,
} from "@/lib/api/admin-api";
import type { ReportTemplate } from "@/lib/types/report-template";

export function useReportTemplate(clientId: string) {
  return useQuery({
    queryKey: ["admin", "clients", clientId, "report-template"],
    queryFn: () => getClientReportTemplate(clientId),
    enabled: !!clientId,
  });
}

export function useUpdateReportTemplate(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: ReportTemplate) => updateClientReportTemplate(clientId, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId, "report-template"] });
    },
  });
}

export function useResetReportTemplate(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resetClientReportTemplate(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId, "report-template"] });
    },
  });
}
