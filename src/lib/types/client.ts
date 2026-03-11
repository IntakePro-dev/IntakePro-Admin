export type ClientStatus = "ACTIVE" | "TRIAL" | "SUSPENDED";
export type LineOfBusiness = "auto" | "home" | "commercial" | "multi";

export interface AdminClientListItem {
  id: string;
  name: string;
  status: ClientStatus;
  timezone: string | null;
  displayName: string | null;
  claimsInboxEmail: string | null;
  lineOfBusiness: LineOfBusiness | null;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  callsThisMonth?: number;
  amountBilled?: number;
}

export interface ClientUser {
  id: string;
  email: string;
  name: string | null;
  role: "CLIENT_ADMIN" | "CLIENT_VIEWER";
  createdAt: string;
}

export interface AdminClientDetail extends AdminClientListItem {
  legalName: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  integrations: IntegrationSettings | null;
  users: ClientUser[];
}

export type BillingProvider = "stripe" | "quickbooks" | "manual";

export interface IntegrationSettings {
  emailEnabled: boolean;
  claimsInboxEmail: string | null;
  ccRecipients: string[];
  bccRecipients: string[];
  includeJsonAttachment: boolean;
  includeReportLink: boolean;
  policyholderEmailEnabled: boolean;
  policyholderEmailUseCustomDomain: boolean;
  policyholderEmailFrom: string | null;
  policyholderMaxRetries: number;
  policyholderDeadLetterEmail: string | null;
  pricePerCall: number;
  baseMonthlyFee: number | null;
  minimumMonthlyCharge: number | null;
  implementationFee: number | null;
  freeTrialLimit: number | null;
  fnolSchema: FnolSchema | null;
  fnolWebhookSecret?: string;
  twilioIncomingNumber: string | null;
  elevenlabsVoiceId: string | null;
  elevenlabsAgentId: string | null;
  elevenlabsApiKeyLast4: string | null;
  guidewireEnabled: boolean;
  guidewireEndpoint: string | null;
  guidewireOauthTokenUrl: string | null;
  guidewireOauthClientId: string | null;
  guidewireOauthConfigured: boolean;
  guidewireOauthScope: string | null;
  guidewireAutoSubmit: boolean;
  guidewireValidateBeforeSubmit: boolean;
  guidewireAttachDocuments: boolean;
  guidewirePayloadTemplate: object | null;
  guidewirePatchPayloadTemplate: object | null;
  guidewirePayloadTypecodes: object | null;
  guidewirePayloadDefaults: object | null;
  guidewirePayloadSchema: object | null;
  billingProvider: BillingProvider;
  billingCurrency: string | null;
  stripeBillingEnabledAt: string | null;
  stripePerFnolPriceId: string | null;
  qboBillingEnabledAt: string | null;
  qboRealmId: string | null;
  qboCustomerId: string | null;
  qboConnected: boolean;
}

export interface FnolSchema {
  version: number;
  fields: FnolField[];
}

export interface FnolField {
  key: string;
  label: string;
  path: string;
  required: boolean;
  enabled?: boolean;
  custom?: boolean;
}

export interface CreateClientInput {
  name: string;
  legalName: string;
  status?: ClientStatus;
  lineOfBusiness: LineOfBusiness;
  timezone: string;
  displayName: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  claimsInboxEmail: string;
  ccRecipients?: string;
  bccRecipients?: string;
  brandColor?: string;
  logoUrl?: string;
  fnolSchema?: FnolSchema;
  elevenlabsAgentId?: string;
  guidewireEndpoint?: string;
  guidewireApiToken?: string;
  fnolDeliveryMethod?: "api" | "email" | "both";
  pricePerCall?: number;
  baseMonthlyFee?: number;
  minimumMonthlyCharge?: number;
  freeTrialLimit?: number;
}

export interface UpdateClientInput {
  name?: string;
  legalName?: string;
  status?: ClientStatus;
  lineOfBusiness?: LineOfBusiness;
  timezone?: string;
  displayName?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  claimsInboxEmail?: string;
  brandColor?: string;
  logoUrl?: string | null;
  billingProvider?: BillingProvider;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  role: "CLIENT_ADMIN" | "CLIENT_VIEWER";
  enableViewerSignup?: boolean;
  allowedSignupDomains?: string;
}

export type UserRole = "CLIENT_ADMIN" | "CLIENT_VIEWER";
