export type ActorType = "USER" | "SERVICE" | "AGENT";

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  clientId: string;
  actorType: ActorType;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string | null;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  statusCode: number | null;
  errorCode: string | null;
  message: string | null;
  meta: unknown;
}

export interface AuditResponse {
  results: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditParams {
  limit?: number;
  page?: number;
  success?: boolean;
  action?: string;
  search?: string;
  clientId?: string;
}

export interface VerifyResponse {
  ok: boolean;
  checked: number;
  invalidAt?: {
    id: string;
    createdAt: string;
    reason: string;
  };
}

export interface ExportParams {
  clientId?: string;
  limit?: number;
}
