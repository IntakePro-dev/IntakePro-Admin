"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Download,
  Search,
  Check,
  X,
  User,
  Bot,
  Server,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs, useVerifyAuditChain, useExportAuditLogs } from "@/hooks/use-admin-audit";
import { formatRelativeTime, formatTimestamp } from "@/lib/utils/format-date";
import { toast } from "sonner";
import type { AuditLogEntry, ActorType } from "@/lib/types/audit";

const ACTION_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "auth.", label: "Authentication" },
  { value: "integration.", label: "Integrations" },
  { value: "webhook.", label: "Webhooks" },
  { value: "stripe.", label: "Stripe" },
  { value: "access.", label: "Access Control" },
  { value: "api_key.", label: "API Keys" },
  { value: "rate_limit.", label: "Rate Limits" },
];

function getActionBadgeColor(action: string) {
  if (action.startsWith("auth.")) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (action.startsWith("integration.")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  if (action.startsWith("webhook.")) return "bg-orange-500/10 text-orange-600 border-orange-500/20";
  if (action.startsWith("stripe.")) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (action.startsWith("access.")) return "bg-red-500/10 text-red-600 border-red-500/20";
  if (action.startsWith("api_key.")) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  if (action.startsWith("rate_limit.")) return "bg-pink-500/10 text-pink-600 border-pink-500/20";
  return "bg-gray-500/10 text-gray-600 border-gray-500/20";
}

function getActorIcon(actorType: ActorType) {
  switch (actorType) {
    case "USER":
      return <User className="h-4 w-4" />;
    case "SERVICE":
      return <Server className="h-4 w-4" />;
    case "AGENT":
      return <Bot className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionCategory, setActionCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");

  const { data: auditData, isLoading, refetch, isRefetching } = useAuditLogs({
    limit: 50,
    page,
    search: search || undefined,
    action: actionCategory === "all" ? undefined : actionCategory,
    success: statusFilter === "all" ? undefined : statusFilter === "success",
  });

  const verifyChain = useVerifyAuditChain();
  const exportLogs = useExportAuditLogs();

  const [chainStatus, setChainStatus] = useState<"unknown" | "valid" | "invalid">("unknown");
  const [chainMessage, setChainMessage] = useState<string | null>(null);

  async function handleVerifyChain() {
    try {
      const result = await verifyChain.mutateAsync(undefined);
      if (result.ok) {
        setChainStatus("valid");
        setChainMessage(`Verified ${result.checked} entries`);
        toast.success("Hash chain verified successfully");
      } else {
        setChainStatus("invalid");
        setChainMessage(result.invalidAt?.reason || "Chain integrity compromised");
        toast.error("Hash chain verification failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    }
  }

  async function handleExport() {
    try {
      const ndjson = await exportLogs.mutateAsync({ limit: 10000 });
      const blob = new Blob([ndjson], { type: "application/x-ndjson" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.ndjson`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Audit logs exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  const totalPages = auditData ? Math.ceil(auditData.total / auditData.limit) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Security audit trail with hash chain verification</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              chainStatus === "valid"
                ? "bg-green-500/10"
                : chainStatus === "invalid"
                ? "bg-red-500/10"
                : "bg-muted"
            }`}
          >
            {chainStatus === "valid" ? (
              <ShieldCheck className="h-6 w-6 text-green-500" />
            ) : chainStatus === "invalid" ? (
              <ShieldX className="h-6 w-6 text-red-500" />
            ) : (
              <Shield className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle>Hash Chain Integrity</CardTitle>
            <CardDescription>
              {chainStatus === "valid"
                ? chainMessage || "Chain integrity verified"
                : chainStatus === "invalid"
                ? chainMessage || "Chain integrity compromised"
                : "Click verify to check chain integrity"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={handleVerifyChain}
            disabled={verifyChain.isPending}
          >
            {verifyChain.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Verify Chain
          </Button>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search action, email, resource, IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={actionCategory}
          onValueChange={(v) => {
            setActionCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action Category" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as "all" | "success" | "failure");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failure">Failure</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportLogs.isPending}
        >
          {exportLogs.isPending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export NDJSON
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total entries: {auditData?.total ?? "—"}</span>
        <span>Showing: {auditData?.results.length ?? 0}</span>
        <span>
          Page {page} of {totalPages}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : auditData && auditData.results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.results.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatRelativeTime(entry.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActorIcon(entry.actorType)}
                        <span className="text-sm">
                          {entry.actorEmail || entry.actorType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.resourceType && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">{entry.resourceType}</span>
                          {entry.resourceId && (
                            <span className="ml-1 font-mono text-xs">
                              {entry.resourceId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.success ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        {entry.statusCode && (
                          <span className="text-xs text-muted-foreground">
                            {entry.statusCode}
                          </span>
                        )}
                        {entry.errorCode && (
                          <span className="text-xs text-red-500">{entry.errorCode}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {entry.ip || "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No audit logs found
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground px-4">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
