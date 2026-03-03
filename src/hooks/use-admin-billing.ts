"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClientBilling,
  enableClientBilling,
  getClientBillingPortal,
  getBillingOverview,
  getQuickBooksStatus,
  getQuickBooksAuthUrl,
  disconnectQuickBooks,
  generateQboInvoices,
} from "@/lib/api/admin-api";
import type { BillingRange } from "@/lib/types/billing";

export function useClientBilling(clientId: string) {
  return useQuery({
    queryKey: ["admin", "clients", clientId, "billing"],
    queryFn: () => getClientBilling(clientId),
    enabled: !!clientId,
  });
}

export function useEnableClientBilling(clientId: string) {
  return useMutation({
    mutationFn: () => enableClientBilling(clientId),
  });
}

export function useClientBillingPortal(clientId: string) {
  return useMutation({
    mutationFn: () => getClientBillingPortal(clientId),
  });
}

export function useBillingOverview(range: BillingRange) {
  return useQuery({
    queryKey: ["admin", "billing", "overview", range],
    queryFn: () => getBillingOverview(range),
  });
}

export function useQuickBooksStatus(clientId: string) {
  return useQuery({
    queryKey: ["admin", "clients", clientId, "quickbooks"],
    queryFn: () => getQuickBooksStatus(clientId),
    enabled: !!clientId,
  });
}

export function useConnectQuickBooks(clientId: string) {
  return useMutation({
    mutationFn: () => getQuickBooksAuthUrl(clientId),
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
  });
}

export function useDisconnectQuickBooks(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectQuickBooks(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId, "quickbooks"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId, "billing"] });
    },
  });
}

export function useGenerateQboInvoices() {
  return useMutation({
    mutationFn: () => generateQboInvoices(),
  });
}
