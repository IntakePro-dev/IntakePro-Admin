"use client";

import { useState, useMemo } from "react";
import { Download, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/layout/stat-card";
import { useUsageOverview } from "@/hooks/use-admin-usage";
import { formatNumber, formatPercent } from "@/lib/utils/format-currency";
import { formatRelativeTime, formatDate } from "@/lib/utils/format-date";
import { exportToCsv } from "@/lib/utils/csv-export";
import type { ActivityItem } from "@/lib/types/usage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type StatusFilter = "all" | "success" | "warning" | "error";

export default function UsageLogsPage() {
  const { data: usage, isLoading } = useUsageOverview();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredActivity = useMemo(() => {
    if (!usage?.recentActivity) return [];

    let result = [...usage.recentActivity];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.clientName.toLowerCase().includes(searchLower) ||
          a.type.toLowerCase().includes(searchLower) ||
          a.message.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result;
  }, [usage?.recentActivity, search, statusFilter]);

  const chartData = useMemo(() => {
    if (!usage?.dailyUsage) return [];

    const grouped: Record<string, Record<string, number>> = {};
    const clients = new Set<string>();

    usage.dailyUsage.forEach((item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = {};
      }
      grouped[item.date][item.clientName] = item.calls;
      clients.add(item.clientName);
    });

    return Object.entries(grouped)
      .map(([date, clientCalls]) => ({
        date,
        ...clientCalls,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [usage?.dailyUsage]);

  const clientNames = useMemo(() => {
    if (!usage?.dailyUsage) return [];
    return [...new Set(usage.dailyUsage.map((d) => d.clientName))].slice(0, 5);
  }, [usage?.dailyUsage]);

  const colors = ["#4B7BD9", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899"];

  function cycleStatusFilter() {
    const filters: StatusFilter[] = ["all", "success", "warning", "error"];
    const currentIndex = filters.indexOf(statusFilter);
    setStatusFilter(filters[(currentIndex + 1) % filters.length]);
  }

  function handleExport() {
    if (!usage?.dailyUsage) return;
    exportToCsv(
      usage.dailyUsage,
      `usage-logs-${new Date().toISOString().split("T")[0]}.csv`,
      [
        { key: "date", label: "Date" },
        { key: "clientName", label: "Client" },
        { key: "calls", label: "Calls" },
      ]
    );
  }

  function getStatusColor(status: ActivityItem["status"]) {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }

  function getStatusBadge(status: ActivityItem["status"]) {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>;
      case "error":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage Logs</h1>
          <p className="text-muted-foreground">System-wide activity and call metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={usage ? formatNumber(usage.totals.totalCalls) : "—"}
          loading={isLoading}
        />
        <StatCard
          title="FNOLs Completed"
          value={usage ? formatNumber(usage.totals.totalFnols) : "—"}
          loading={isLoading}
        />
        <StatCard
          title="Escalations"
          value={usage ? formatNumber(usage.totals.totalEscalations) : "—"}
          loading={isLoading}
        />
        <StatCard
          title="Success Rate"
          value={usage ? formatPercent(usage.totals.successRate) : "—"}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Call Volume by Client</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Last 30 Days
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport} disabled={!usage}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value, "MMM d")}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) => formatDate(value as string, "MMM d, yyyy")}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  {clientNames.map((name, index) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No usage data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cycleStatusFilter}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredActivity.length > 0 ? (
            <div className="space-y-4">
              {filteredActivity.slice(0, visibleCount).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(activity.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.clientName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{activity.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{activity.message}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(activity.status)}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}

              {filteredActivity.length > visibleCount && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisibleCount((c) => c + 20)}
                >
                  Load More Activity
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No activity found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
