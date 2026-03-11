import { v4 as uuidv4 } from "uuid";
import type {
  AdminClientListItem,
  AdminClientDetail,
  CreateClientInput,
  UpdateClientInput,
  CreateUserInput,
  UserRole,
  ClientUser,
  IntegrationSettings,
} from "@/lib/types/client";
import type { ClientBillingSummary, BillingRange, BillingOverview } from "@/lib/types/billing";
import type { AuditResponse, AuditParams, VerifyResponse, ExportParams } from "@/lib/types/audit";
import type { UsageOverview } from "@/lib/types/usage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )admin_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function generateRequestId(): string {
  return uuidv4();
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please wait a moment and try again.");
    this.name = "RateLimitError";
  }
}

function handleAuthRedirect() {
  if (typeof document !== "undefined") {
    document.cookie = "admin_token=; path=/; max-age=0";
    window.location.href = "/login?error=session_expired";
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const requestId = generateRequestId();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Request-ID": requestId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      handleAuthRedirect();
      throw new AuthError("Session expired. Please log in again.");
    }
    
    if (res.status === 429) {
      throw new RateLimitError();
    }

    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export { AuthError, RateLimitError };

// Auth
export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
  const requestId = generateRequestId();
  
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new RateLimitError();
    }
    const data = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(data?.error || "Invalid credentials");
  }

  return res.json();
}

// Admin Profile
export interface AdminProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  notifications: {
    email: boolean;
    paymentAlerts: boolean;
    systemErrors: boolean;
    weeklyReports: boolean;
  };
}

export async function getAdminProfile(): Promise<AdminProfile> {
  return adminFetch<AdminProfile>("/api/admin/me");
}

export async function updateAdminProfile(
  input: Partial<Omit<AdminProfile, "id" | "role" | "lastLoginAt" | "lastLoginIp">>
): Promise<AdminProfile> {
  return adminFetch<AdminProfile>("/api/admin/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await adminFetch("/api/admin/me/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// Clients
export async function listAdminClients(): Promise<AdminClientListItem[]> {
  return adminFetch<AdminClientListItem[]>("/api/admin/clients");
}

export async function getAdminClient(clientId: string): Promise<AdminClientDetail> {
  return adminFetch<AdminClientDetail>(`/api/admin/clients/${clientId}`);
}

export async function createAdminClient(input: CreateClientInput): Promise<{ id: string }> {
  return adminFetch<{ id: string }>("/api/admin/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminClient(
  clientId: string,
  input: UpdateClientInput
): Promise<AdminClientDetail> {
  return adminFetch<AdminClientDetail>(`/api/admin/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export interface DeleteClientResult {
  ok: true;
  deleted: {
    client: boolean;
    users: number;
    fnolReports: number;
    callRecords: number;
  };
}

export async function deleteAdminClient(clientId: string): Promise<DeleteClientResult> {
  return adminFetch<DeleteClientResult>(`/api/admin/clients/${clientId}`, {
    method: "DELETE",
  });
}

// Client Users
export async function createAdminClientUser(
  clientId: string,
  input: CreateUserInput
): Promise<ClientUser> {
  return adminFetch<ClientUser>(`/api/admin/clients/${clientId}/users`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminClientUserRole(
  clientId: string,
  userId: string,
  role: UserRole
): Promise<ClientUser> {
  return adminFetch<ClientUser>(`/api/admin/clients/${clientId}/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminClientUser(
  clientId: string,
  userId: string
): Promise<{ ok: true }> {
  return adminFetch<{ ok: true }>(`/api/admin/clients/${clientId}/users/${userId}`, {
    method: "DELETE",
  });
}

// Client Integrations
export async function updateAdminClientIntegrations(
  clientId: string,
  input: Partial<IntegrationSettings> & { elevenlabsApiKey?: string; guidewireApiKey?: string; guidewireOauthClientSecret?: string; fnolWebhookSecret?: string }
): Promise<void> {
  await adminFetch(`/api/admin/clients/${clientId}/integrations`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Guidewire Testing
export interface PreviewResult {
  payload: object;
  template: object;
  fnolData: object;
}

export async function previewGuidewirePayload(
  clientId: string,
  fnolReportId: string
): Promise<PreviewResult> {
  return adminFetch<PreviewResult>(`/api/admin/clients/${clientId}/guidewire/preview`, {
    method: "POST",
    body: JSON.stringify({ fnolReportId }),
  });
}

export interface TestSendResult {
  success: boolean;
  steps: Array<{
    step: string;
    status: "success" | "error";
    message?: string;
  }>;
  claimId?: string;
}

export async function testSendGuidewirePayload(
  clientId: string,
  fnolReportId: string
): Promise<TestSendResult> {
  return adminFetch<TestSendResult>(`/api/admin/clients/${clientId}/guidewire/test-send`, {
    method: "POST",
    body: JSON.stringify({ fnolReportId }),
  });
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tokenExpiresIn?: number;
}

export async function testGuidewireConnection(clientId: string): Promise<ConnectionTestResult> {
  return adminFetch<ConnectionTestResult>(`/api/admin/clients/${clientId}/guidewire/test-connection`, {
    method: "POST",
  });
}

export interface TestReport {
  id: string;
  createdAt: string;
  status: string;
}

export async function listGuidewireTestReports(
  clientId: string
): Promise<{ reports: TestReport[] }> {
  return adminFetch<{ reports: TestReport[] }>(
    `/api/admin/clients/${clientId}/guidewire/test-reports`
  );
}

export async function seedGuidewireTestReports(
  clientId: string
): Promise<{ created: TestReport[] }> {
  return adminFetch<{ created: TestReport[] }>(
    `/api/admin/clients/${clientId}/guidewire/test-reports/seed`,
    { method: "POST" }
  );
}

// Client Billing
export async function getClientBilling(clientId: string): Promise<ClientBillingSummary> {
  return adminFetch<ClientBillingSummary>(`/api/admin/clients/${clientId}/billing`);
}

export async function enableClientBilling(clientId: string): Promise<void> {
  await adminFetch(`/api/admin/clients/${clientId}/billing/enable`, {
    method: "POST",
  });
}

export async function getClientBillingPortal(clientId: string): Promise<{ url: string }> {
  return adminFetch<{ url: string }>(`/api/admin/clients/${clientId}/billing/portal`, {
    method: "POST",
  });
}

// QuickBooks
export interface QuickBooksStatus {
  configured: boolean;
  connected: boolean;
  companyName: string | null;
  connectedAt: string | null;
  realmId: string | null;
  customerId: string | null;
}

export async function getQuickBooksStatus(clientId: string): Promise<QuickBooksStatus> {
  return adminFetch<QuickBooksStatus>(`/api/integrations/quickbooks/status?clientId=${clientId}`);
}

export async function getQuickBooksAuthUrl(clientId: string): Promise<{ authUrl: string }> {
  return adminFetch<{ authUrl: string }>(`/api/integrations/quickbooks/authorize?clientId=${clientId}`);
}

export async function disconnectQuickBooks(clientId: string): Promise<void> {
  await adminFetch("/api/integrations/quickbooks/disconnect", {
    method: "POST",
    body: JSON.stringify({ clientId }),
  });
}

export async function generateQboInvoices(): Promise<{ generated: number; errors: number }> {
  return adminFetch<{ generated: number; errors: number }>("/api/admin/billing/generate-qbo-invoices", {
    method: "POST",
  });
}

// Global Billing
export async function getBillingOverview(range: BillingRange): Promise<BillingOverview> {
  return adminFetch<BillingOverview>(`/api/admin/billing/overview?range=${range}`);
}

// Usage
export async function getUsageOverview(): Promise<UsageOverview> {
  return adminFetch<UsageOverview>("/api/admin/usage/overview");
}

// Audit
export async function getAuditLogs(params: AuditParams): Promise<AuditResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.success !== undefined) searchParams.set("success", String(params.success));
  if (params.action) searchParams.set("action", params.action);
  if (params.search) searchParams.set("search", params.search);
  if (params.clientId) searchParams.set("clientId", params.clientId);

  return adminFetch<AuditResponse>(`/api/audit?${searchParams.toString()}`);
}

export async function verifyAuditChain(clientId?: string): Promise<VerifyResponse> {
  const params = clientId ? `?clientId=${clientId}` : "";
  return adminFetch<VerifyResponse>(`/api/audit/verify${params}`);
}

// Report Templates
import type { ReportTemplate, ReportTemplateResponse } from "@/lib/types/report-template";

export async function getClientReportTemplate(clientId: string): Promise<ReportTemplateResponse> {
  return adminFetch<ReportTemplateResponse>(`/api/admin/clients/${clientId}/report-template`);
}

export async function updateClientReportTemplate(
  clientId: string,
  template: ReportTemplate
): Promise<{ success: true; template: ReportTemplate }> {
  return adminFetch(`/api/admin/clients/${clientId}/report-template`, {
    method: "PUT",
    body: JSON.stringify({ template }),
  });
}

export async function resetClientReportTemplate(clientId: string): Promise<{ success: true }> {
  return adminFetch(`/api/admin/clients/${clientId}/report-template`, {
    method: "DELETE",
  });
}

export async function exportAuditLogs(params: ExportParams): Promise<string> {
  const searchParams = new URLSearchParams();
  if (params.clientId) searchParams.set("clientId", params.clientId);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const token = getToken();
  const requestId = generateRequestId();
  
  const res = await fetch(`${API_URL}/api/audit/export?${searchParams.toString()}`, {
    credentials: "include",
    headers: {
      "X-Request-ID": requestId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      handleAuthRedirect();
      throw new AuthError("Session expired. Please log in again.");
    }
    if (res.status === 429) {
      throw new RateLimitError();
    }
    throw new Error("Export failed");
  }

  return res.text();
}
