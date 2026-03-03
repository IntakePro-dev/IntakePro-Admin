"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { AdminClientListItem, ClientStatus } from "@/lib/types/client";

interface ClientListTableProps {
  clients: AdminClientListItem[];
  loading?: boolean;
}

function getStatusBadgeVariant(status: ClientStatus) {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "TRIAL":
      return "secondary";
    case "SUSPENDED":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusBadgeClass(status: ClientStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20";
    case "TRIAL":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20";
    case "SUSPENDED":
      return "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20";
    default:
      return "";
  }
}

export function ClientListTable({ clients, loading }: ClientListTableProps) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Calls This Month</TableHead>
              <TableHead>Amount Billed</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No clients found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Calls This Month</TableHead>
            <TableHead>Amount Billed</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className="text-sm font-medium"
                      style={{
                        backgroundColor: `hsl(${client.name.charCodeAt(0) * 10}, 70%, 50%)`,
                        color: "white",
                      }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    {client.displayName && client.displayName !== client.name && (
                      <p className="text-xs text-muted-foreground">
                        {client.displayName}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(client.status)}
                  className={getStatusBadgeClass(client.status)}
                >
                  {client.status}
                </Badge>
              </TableCell>
              <TableCell>
                {client.callsThisMonth !== undefined ? client.callsThisMonth : "—"}
              </TableCell>
              <TableCell>
                {client.amountBilled !== undefined
                  ? formatCurrency(client.amountBilled)
                  : "—"}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clients/${client.id}`}>Open</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
