export interface UsageOverview {
  totals: {
    totalCalls: number;
    totalFnols: number;
    totalEscalations: number;
    successRate: number;
  };
  dailyUsage: Array<{
    date: string;
    clientId: string;
    clientName: string;
    calls: number;
  }>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  status: "success" | "warning" | "error";
  message: string;
  createdAt: string;
}
