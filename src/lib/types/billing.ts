import type { ClientStatus, BillingProvider } from "./client";

export interface ClientBillingSummary {
  currency: string;
  pricePerCall: number;
  baseMonthlyFee: number | null;
  minimumMonthlyCharge: number | null;
  billingProvider: BillingProvider;
  stripe: {
    billingEnabled: boolean;
    subscriptionStatus: string | null;
    customerId: string | null;
  };
  quickbooks: {
    connected: boolean;
    realmId: string | null;
    customerId: string | null;
    connectedAt: string | null;
  };
  totals: {
    totalCalls: number;
    usageTotal: number;
    baseMonthlyFee: number;
    totalAmount: number;
  };
  dailyUsage?: Array<{
    date: string;
    calls: number;
  }>;
  recentInvoices: Invoice[];
}

export interface Invoice {
  id: string;
  billingPeriod: string;
  totalCalls: number;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
}

export type BillingRange = "this_month" | "last_6_months" | "last_12_months" | "all_time";

export interface BillingOverview {
  range: string;
  startBillingPeriod: string | null;
  endBillingPeriod: string | null;
  totals: {
    totalCalls: number;
    totalRevenue: number;
    activeClients: number;
    avgRevenuePerClient: number;
  };
  clients: Array<{
    id: string;
    name: string;
    status: ClientStatus;
    callsThisMonth: number;
    amountBilled: number;
  }>;
}
