"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/layout/stat-card";
import { useAdminClient, useUpdateClient } from "@/hooks/use-admin-client";
import {
  useClientBilling,
  useEnableClientBilling,
  useClientBillingPortal,
  useQuickBooksStatus,
  useConnectQuickBooks,
  useDisconnectQuickBooks,
  useGenerateQboInvoices,
} from "@/hooks/use-admin-billing";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BillingProvider } from "@/lib/types/client";

function getInvoiceStatusBadge(status: string) {
  switch (status) {
    case "PAID":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
    case "SENT":
    case "DRAFT":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Due</Badge>;
    case "OVERDUE":
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ClientBillingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.clientId as string;
  const { data: client, isLoading: clientLoading } = useAdminClient(clientId);
  const { data: billing, isLoading: billingLoading } = useClientBilling(clientId);
  const { data: qboStatus, isLoading: qboLoading } = useQuickBooksStatus(clientId);
  const enableBilling = useEnableClientBilling(clientId);
  const getBillingPortal = useClientBillingPortal(clientId);
  const updateClient = useUpdateClient(clientId);
  const connectQbo = useConnectQuickBooks(clientId);
  const disconnectQbo = useDisconnectQuickBooks(clientId);
  const generateInvoices = useGenerateQboInvoices();

  const isLoading = clientLoading || billingLoading || qboLoading;

  useEffect(() => {
    if (searchParams.get("qbo") === "connected") {
      toast.success("QuickBooks connected successfully");
      window.history.replaceState({}, "", `/clients/${clientId}/billing`);
    }
  }, [searchParams, clientId]);

  async function handleEnableBilling() {
    try {
      await enableBilling.mutateAsync();
      toast.success("Stripe billing enabled successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable billing");
    }
  }

  async function handleOpenPortal() {
    try {
      const result = await getBillingPortal.mutateAsync();
      window.open(result.url, "_blank");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal");
    }
  }

  function handleProviderChange(provider: BillingProvider) {
    updateClient.mutate(
      { billingProvider: provider },
      {
        onSuccess: () => toast.success("Billing provider updated"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!client || !billing) {
    return <div>Client or billing data not found</div>;
  }

  const avgCostPerFnol = billing.totals.totalCalls > 0
    ? billing.totals.totalAmount / billing.totals.totalCalls
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${clientId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Billing & Usage</h1>
          <p className="text-muted-foreground">{client.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Billing Provider</CardTitle>
          <CardDescription>
            Select which billing system is active for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={client.integrations?.billingProvider || "manual"}
            onValueChange={(value) => handleProviderChange(value as BillingProvider)}
            disabled={updateClient.isPending}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="stripe"
                id="stripe"
                disabled={!billing.stripe.billingEnabled}
              />
              <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Stripe (Credit Card)
                {!billing.stripe.billingEnabled && (
                  <Badge variant="outline" className="text-xs">Not Enabled</Badge>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="quickbooks"
                id="quickbooks"
                disabled={!qboStatus?.connected}
              />
              <Label htmlFor="quickbooks" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                QuickBooks (Invoices)
                {!qboStatus?.connected && (
                  <Badge variant="outline" className="text-xs">Not Connected</Badge>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Manual (Local Invoices Only)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Billing</CardTitle>
            <CardDescription>
              {billing.stripe.billingEnabled
                ? `Subscription status: ${billing.stripe.subscriptionStatus || "Active"}`
                : "Credit card billing via Stripe"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.stripe.billingEnabled ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Enabled
                  </Badge>
                </div>
                {billing.stripe.customerId && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Customer ID</p>
                    <p className="font-mono text-xs">{billing.stripe.customerId}</p>
                  </div>
                )}
                <Button variant="outline" onClick={handleOpenPortal} disabled={getBillingPortal.isPending}>
                  {getBillingPortal.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Open Stripe Portal
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary">Not Enabled</Badge>
                <p className="text-sm text-muted-foreground">
                  Enable Stripe to accept credit card payments with real-time usage billing.
                </p>
                <Button onClick={handleEnableBilling} disabled={enableBilling.isPending}>
                  {enableBilling.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enable Stripe Billing
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QuickBooks Online</CardTitle>
            <CardDescription>
              {qboStatus?.connected
                ? `Connected to ${qboStatus.companyName || "QuickBooks"}`
                : "Invoice-based billing via QuickBooks"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qboStatus?.connected ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Connected
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium">{qboStatus.companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Connected</p>
                    <p className="font-medium">
                      {qboStatus.connectedAt ? formatDate(qboStatus.connectedAt) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => disconnectQbo.mutate(undefined, {
                      onSuccess: () => toast.success("QuickBooks disconnected"),
                      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
                    })}
                    disabled={disconnectQbo.isPending}
                  >
                    {disconnectQbo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect
                  </Button>
                  <Button
                    onClick={() => generateInvoices.mutate(undefined, {
                      onSuccess: (data) => toast.success(`Generated ${data.generated} invoices`),
                      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
                    })}
                    disabled={generateInvoices.isPending}
                  >
                    {generateInvoices.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Invoices
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Badge variant="secondary">Not Connected</Badge>
                <p className="text-sm text-muted-foreground">
                  Connect QuickBooks to generate monthly invoices for bank transfer payments.
                </p>
                <Button
                  onClick={() => connectQbo.mutate()}
                  disabled={connectQbo.isPending}
                >
                  {connectQbo.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect QuickBooks
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Usage This Month</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Billed FNOLs" value={billing.totals.totalCalls} />
          <StatCard title="Usage Total" value={formatCurrency(billing.totals.usageTotal)} />
          <StatCard title="Base Monthly Fee" value={formatCurrency(billing.totals.baseMonthlyFee)} />
          <StatCard title="Invoice Total" value={formatCurrency(billing.totals.totalAmount)} />
          <StatCard title="Avg. Cost per FNOL" value={formatCurrency(avgCostPerFnol)} />
        </div>
      </div>

      {billing.dailyUsage && billing.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Call Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={billing.dailyUsage}>
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
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pricing Configuration</CardTitle>
            <CardDescription>Current pricing model: Per FNOL</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}/integrations`}>Edit pricing</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Price per FNOL</p>
              <p className="font-medium">{formatCurrency(billing.pricePerCall)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Base monthly fee</p>
              <p className="font-medium">
                {billing.baseMonthlyFee ? formatCurrency(billing.baseMonthlyFee) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Minimum monthly</p>
              <p className="font-medium">
                {billing.minimumMonthlyCharge ? formatCurrency(billing.minimumMonthlyCharge) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">{billing.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {billing.recentInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Calls Billed</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.billingPeriod}</TableCell>
                    <TableCell>{invoice.totalCalls}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
