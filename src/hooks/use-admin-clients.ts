"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAdminClients,
  createAdminClient,
} from "@/lib/api/admin-api";
import type { CreateClientInput } from "@/lib/types/client";

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin", "clients"],
    queryFn: listAdminClients,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => createAdminClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
  });
}
