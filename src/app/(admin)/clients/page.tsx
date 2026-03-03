"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientListTable } from "@/components/clients/client-list-table";
import { CreateClientModal } from "@/components/clients/create-client-modal";
import { useAdminClients } from "@/hooks/use-admin-clients";
import type { ClientStatus } from "@/lib/types/client";

type SortOption =
  | "name-asc"
  | "name-desc"
  | "revenue-high"
  | "revenue-low"
  | "calls-high"
  | "calls-low";

export default function ClientsPage() {
  const { data: clients, isLoading } = useAdminClients();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!clients) return [];

    let result = [...clients];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.displayName?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "revenue-high":
        result.sort((a, b) => (b.amountBilled ?? 0) - (a.amountBilled ?? 0));
        break;
      case "revenue-low":
        result.sort((a, b) => (a.amountBilled ?? 0) - (b.amountBilled ?? 0));
        break;
      case "calls-high":
        result.sort((a, b) => (b.callsThisMonth ?? 0) - (a.callsThisMonth ?? 0));
        break;
      case "calls-low":
        result.sort((a, b) => (a.callsThisMonth ?? 0) - (b.callsThisMonth ?? 0));
        break;
    }

    return result;
  }, [clients, search, sortBy, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage insurance clients and their AI configurations
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="revenue-high">Revenue (High-Low)</SelectItem>
            <SelectItem value="revenue-low">Revenue (Low-High)</SelectItem>
            <SelectItem value="calls-high">Calls (High-Low)</SelectItem>
            <SelectItem value="calls-low">Calls (Low-High)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {(["all", "ACTIVE", "TRIAL", "SUSPENDED"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <ClientListTable clients={filteredClients} loading={isLoading} />

      <CreateClientModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
