"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/layout/stat-card";
import { useBillingOverview } from "@/hooks/use-admin-billing";
import { formatCurrency, formatNumber } from "@/lib/utils/format-currency";
import { exportToCsv } from "@/lib/utils/csv-export";
import type { BillingRange } from "@/lib/types/billing";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const rangeOptions: { value: BillingRange; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "all_time", label: "All Time" },
];

export default function GlobalBillingPage() {
  const [range, setRange] = useState<BillingRange>("this_month");
  const { data: billing, isLoading, refetch, isRefetching } = useBillingOverview(range);

  const suspendedClients = billing?.clients.filter((c) => c.status === "SUSPENDED") || [];
  const topClients = billing?.clients
    .sort((a, b) => b.callsThisMonth - a.callsThisMonth)
    .slice(0, 5) || [];

  function handleExport() {
    if (!billing) return;
    exportToCsv(
      billing.clients.map((c) => ({
        name: c.name,
        status: c.status,
        calls: c.callsThisMonth,
        revenue: c.amountBilled,
      })),
      `billing-${range}-${new Date().toISOString().split("T")[0]}.csv`,
      [
        { key: "name", label: "Client Name" },
        { key: "status", label: "Status" },
        { key: "calls", label: "Calls" },
        { key: "revenue", label: "Revenue (CAD)" },
      ]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing Overview</h1>
          <p className="text-muted-foreground">
            Global billing metrics and revenue tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={billing ? formatNumber(billing.totals.totalCalls) : "—"}
          subtitle={rangeOptions.find((r) => r.value === range)?.label}
          loading={isLoading}
        />
        <StatCard
          title="Revenue"
          value={billing ? formatCurrency(billing.totals.totalRevenue) : "—"}
          loading={isLoading}
        />
        <StatCard
          title="Active Clients"
          value={billing ? billing.totals.activeClients : "—"}
          loading={isLoading}
        />
        <StatCard
          title="Avg. Revenue per Client"
          value={billing ? formatCurrency(billing.totals.avgRevenuePerClient) : "—"}
          loading={isLoading}
        />
      </div>

      {suspendedClients.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium">Payment Issues</p>
              <p className="text-sm text-muted-foreground">
                The following clients have suspended accounts due to payment issues
              </p>
            </div>
            <div className="flex gap-2">
              {suspendedClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}/billing`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    {client.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue by Client</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {rangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={range === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport} disabled={!billing}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80" />
          ) : billing && billing.clients.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billing.clients.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value, name) => [
                      name === "amountBilled" ? formatCurrency(value as number) : formatNumber(value as number),
                      name === "amountBilled" ? "Revenue" : "Calls",
                    ]}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="callsThisMonth"
                    name="Calls"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="amountBilled"
                    name="Revenue"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No billing data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Call Volume</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : topClients.length > 0 ? (
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}/billing`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-gray-400 text-white"
                        : index === 2
                        ? "bg-amber-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(client.callsThisMonth)} calls
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(client.amountBilled)}</p>
                    <Badge
                      variant="outline"
                      className={
                        client.status === "ACTIVE"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : client.status === "TRIAL"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      }
                    >
                      {client.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No clients found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
