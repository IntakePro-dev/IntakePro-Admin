"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminClient,
  updateAdminClient,
  deleteAdminClient,
  createAdminClientUser,
  updateAdminClientUserRole,
  deleteAdminClientUser,
  updateAdminClientIntegrations,
} from "@/lib/api/admin-api";
import type {
  UpdateClientInput,
  CreateUserInput,
  UserRole,
  IntegrationSettings,
} from "@/lib/types/client";

export function useAdminClient(clientId: string) {
  return useQuery({
    queryKey: ["admin", "clients", clientId],
    queryFn: () => getAdminClient(clientId),
    enabled: !!clientId,
  });
}

export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateClientInput) => updateAdminClient(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
  });
}

export function useDeleteClient(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAdminClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
  });
}

export function useCreateClientUser(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createAdminClientUser(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId] });
    },
  });
}

export function useUpdateClientUserRole(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateAdminClientUserRole(clientId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId] });
    },
  });
}

export function useDeleteClientUser(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteAdminClientUser(clientId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId] });
    },
  });
}

export function useUpdateClientIntegrations(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Partial<IntegrationSettings> & {
        elevenlabsApiKey?: string;
        guidewireApiKey?: string;
        guidewireOauthClientSecret?: string;
      }
    ) => updateAdminClientIntegrations(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients", clientId] });
    },
  });
}
