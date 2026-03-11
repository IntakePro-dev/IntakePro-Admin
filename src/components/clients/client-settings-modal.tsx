"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronDown, Trash2 } from "lucide-react";
import { useUpdateClient, useDeleteClient, useUpdateClientIntegrations } from "@/hooks/use-admin-client";
import { toast } from "sonner";
import type { AdminClientDetail, ClientStatus, LineOfBusiness, FnolField } from "@/lib/types/client";

interface ClientSettingsModalProps {
  client: AdminClientDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIMEZONES = [
  "America/Toronto",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
];

const DEFAULT_FNOL_FIELDS: FnolField[] = [
  { key: "caller.name", label: "Caller name", path: "caller.name", required: true, enabled: true },
  { key: "caller.callbackNumber", label: "Callback number", path: "caller.callbackNumber", required: true, enabled: true },
  { key: "policy.policyNumber", label: "Policy number", path: "policy.policyNumber", required: true, enabled: true },
  { key: "loss.dateTime", label: "Date/time of incident", path: "loss.dateTime", required: true, enabled: true },
  { key: "loss.address", label: "Address of loss", path: "loss.address", required: true, enabled: true },
  { key: "loss.type", label: "Type of loss", path: "loss.type", required: true, enabled: true },
  { key: "damage.summary", label: "Description / summary", path: "damage.summary", required: true, enabled: true },
  { key: "damage.emergencyWorkNeeded", label: "Emergency work needed", path: "damage.emergencyWorkNeeded", required: true, enabled: true },
];

export function ClientSettingsModal({ client, open, onOpenChange }: ClientSettingsModalProps) {
  const router = useRouter();
  const updateClient = useUpdateClient(client.id);
  const deleteClient = useDeleteClient(client.id);
  const updateIntegrations = useUpdateClientIntegrations(client.id);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    status: "ACTIVE" as ClientStatus,
    lineOfBusiness: "" as LineOfBusiness | "",
    timezone: "",
    displayName: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    brandColor: "#4B7BD9",
    logoUrl: "",
  });

  const [emailSettings, setEmailSettings] = useState({
    emailEnabled: false,
    claimsInboxEmail: "",
    ccRecipients: "",
    bccRecipients: "",
    includeJsonAttachment: false,
    includeReportLink: true,
  });

  const [policyholderEmailSettings, setPolicyholderEmailSettings] = useState({
    enabled: true,
    useCustomDomain: false,
    fromAddress: "",
    deadLetterEmail: "",
  });

  const [billingSettings, setBillingSettings] = useState({
    pricePerCall: 0.80,
    baseMonthlyFee: 0,
    minimumMonthlyCharge: 0,
    freeTrialLimit: 0,
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    twilioIncomingNumber: "",
    elevenlabsAgentId: "",
    elevenlabsVoiceId: "",
    elevenlabsApiKey: "",
    guidewireEnabled: false,
    guidewireEndpoint: "",
    guidewireApiKey: "",
    guidewirePayloadTemplate: "",
    guidewireTypecodeMap: "",
    guidewireDefaults: "",
    guidewirePayloadSchema: "",
    fnolWebhookSecret: "",
  });

  const [fnolFields, setFnolFields] = useState<FnolField[]>(DEFAULT_FNOL_FIELDS);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        legalName: client.legalName || "",
        status: client.status,
        lineOfBusiness: client.lineOfBusiness || "",
        timezone: client.timezone || "",
        displayName: client.displayName || "",
        primaryContactName: client.primaryContactName || "",
        primaryContactEmail: client.primaryContactEmail || "",
        primaryContactPhone: client.primaryContactPhone || "",
        brandColor: client.brandColor || "#4B7BD9",
        logoUrl: client.logoUrl || "",
      });

      if (client.integrations) {
        setEmailSettings({
          emailEnabled: client.integrations.emailEnabled,
          claimsInboxEmail: client.integrations.claimsInboxEmail || "",
          ccRecipients: client.integrations.ccRecipients?.join(", ") || "",
          bccRecipients: client.integrations.bccRecipients?.join(", ") || "",
          includeJsonAttachment: client.integrations.includeJsonAttachment,
          includeReportLink: client.integrations.includeReportLink,
        });

        setPolicyholderEmailSettings({
          enabled: client.integrations.policyholderEmailEnabled ?? true,
          useCustomDomain: client.integrations.policyholderEmailUseCustomDomain ?? false,
          fromAddress: client.integrations.policyholderEmailFrom || "",
          deadLetterEmail: client.integrations.policyholderDeadLetterEmail || "",
        });

        setBillingSettings({
          pricePerCall: client.integrations.pricePerCall,
          baseMonthlyFee: client.integrations.baseMonthlyFee || 0,
          minimumMonthlyCharge: client.integrations.minimumMonthlyCharge || 0,
          freeTrialLimit: client.integrations.freeTrialLimit || 0,
        });

        setIntegrationSettings({
          twilioIncomingNumber: client.integrations.twilioIncomingNumber || "",
          elevenlabsAgentId: client.integrations.elevenlabsAgentId || "",
          elevenlabsVoiceId: client.integrations.elevenlabsVoiceId || "",
          elevenlabsApiKey: "",
          guidewireEnabled: client.integrations.guidewireEnabled,
          guidewireEndpoint: client.integrations.guidewireEndpoint || "",
          guidewireApiKey: "",
          guidewirePayloadTemplate: client.integrations.guidewirePayloadTemplate
            ? JSON.stringify(client.integrations.guidewirePayloadTemplate, null, 2)
            : "",
          guidewireTypecodeMap: client.integrations.guidewirePayloadTypecodes
            ? JSON.stringify(client.integrations.guidewirePayloadTypecodes, null, 2)
            : "",
          guidewireDefaults: client.integrations.guidewirePayloadDefaults
            ? JSON.stringify(client.integrations.guidewirePayloadDefaults, null, 2)
            : "",
          guidewirePayloadSchema: client.integrations.guidewirePayloadSchema
            ? JSON.stringify(client.integrations.guidewirePayloadSchema, null, 2)
            : "",
          fnolWebhookSecret: "",
        });

        if (client.integrations.fnolSchema?.fields) {
          setFnolFields(client.integrations.fnolSchema.fields);
        }
      }
    }
  }, [client]);

  function toggleFnolField(key: string, field: "enabled" | "required") {
    setFnolFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: !f[field] } : f))
    );
  }

  async function handleSave() {
    setSaving(true);

    try {
      await updateClient.mutateAsync({
        name: formData.name,
        legalName: formData.legalName || undefined,
        status: formData.status,
        lineOfBusiness: formData.lineOfBusiness as LineOfBusiness || undefined,
        timezone: formData.timezone || undefined,
        displayName: formData.displayName || undefined,
        primaryContactName: formData.primaryContactName || undefined,
        primaryContactEmail: formData.primaryContactEmail || undefined,
        primaryContactPhone: formData.primaryContactPhone || undefined,
        brandColor: formData.brandColor || undefined,
        logoUrl: formData.logoUrl || null,
      });

      await updateIntegrations.mutateAsync({
        emailEnabled: emailSettings.emailEnabled,
        claimsInboxEmail: emailSettings.claimsInboxEmail || undefined,
        ccRecipients: emailSettings.ccRecipients
          ? emailSettings.ccRecipients.split(",").map((s) => s.trim())
          : [],
        bccRecipients: emailSettings.bccRecipients
          ? emailSettings.bccRecipients.split(",").map((s) => s.trim())
          : [],
        includeJsonAttachment: emailSettings.includeJsonAttachment,
        includeReportLink: emailSettings.includeReportLink,
        policyholderEmailEnabled: policyholderEmailSettings.enabled,
        policyholderEmailUseCustomDomain: policyholderEmailSettings.useCustomDomain,
        policyholderEmailFrom: policyholderEmailSettings.fromAddress || undefined,
        policyholderDeadLetterEmail: policyholderEmailSettings.deadLetterEmail || undefined,
        pricePerCall: billingSettings.pricePerCall,
        baseMonthlyFee: billingSettings.baseMonthlyFee || undefined,
        minimumMonthlyCharge: billingSettings.minimumMonthlyCharge || undefined,
        freeTrialLimit: formData.status === "TRIAL" ? billingSettings.freeTrialLimit : undefined,
        twilioIncomingNumber: integrationSettings.twilioIncomingNumber || undefined,
        elevenlabsAgentId: integrationSettings.elevenlabsAgentId || undefined,
        elevenlabsVoiceId: integrationSettings.elevenlabsVoiceId || undefined,
        elevenlabsApiKey: integrationSettings.elevenlabsApiKey || undefined,
        guidewireEnabled: integrationSettings.guidewireEnabled,
        guidewireEndpoint: integrationSettings.guidewireEndpoint || undefined,
        guidewireApiKey: integrationSettings.guidewireApiKey || undefined,
        guidewirePayloadTemplate: integrationSettings.guidewirePayloadTemplate
          ? JSON.parse(integrationSettings.guidewirePayloadTemplate)
          : undefined,
        guidewirePayloadTypecodes: integrationSettings.guidewireTypecodeMap
          ? JSON.parse(integrationSettings.guidewireTypecodeMap)
          : undefined,
        guidewirePayloadDefaults: integrationSettings.guidewireDefaults
          ? JSON.parse(integrationSettings.guidewireDefaults)
          : undefined,
        guidewirePayloadSchema: integrationSettings.guidewirePayloadSchema
          ? JSON.parse(integrationSettings.guidewirePayloadSchema)
          : undefined,
        fnolSchema: { version: 1, fields: fnolFields.filter((f) => f.enabled) },
        fnolWebhookSecret: integrationSettings.fnolWebhookSecret || undefined,
      });

      toast.success("Settings saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteClient.mutateAsync();
      toast.success("Client deleted");
      setDeleteDialogOpen(false);
      onOpenChange(false);
      router.push("/clients");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete client");
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Client Settings</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-lg font-semibold mb-4">Company Info</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalName">Legal Name</Label>
                      <Input
                        id="legalName"
                        value={formData.legalName}
                        onChange={(e) => setFormData((p) => ({ ...p, legalName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData((p) => ({ ...p, status: v as ClientStatus }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="TRIAL">Trial</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lineOfBusiness">Primary Line of Business</Label>
                      <Select
                        value={formData.lineOfBusiness}
                        onValueChange={(v) => setFormData((p) => ({ ...p, lineOfBusiness: v as LineOfBusiness }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="multi">Multi-Line</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Time Zone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(v) => setFormData((p) => ({ ...p, timezone: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-4">Contact & Branding</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactName">Primary Contact Name</Label>
                      <Input
                        id="primaryContactName"
                        value={formData.primaryContactName}
                        onChange={(e) => setFormData((p) => ({ ...p, primaryContactName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactEmail">Primary Contact Email</Label>
                      <Input
                        id="primaryContactEmail"
                        type="email"
                        value={formData.primaryContactEmail}
                        onChange={(e) => setFormData((p) => ({ ...p, primaryContactEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactPhone">Primary Contact Phone</Label>
                      <Input
                        id="primaryContactPhone"
                        value={formData.primaryContactPhone}
                        onChange={(e) => setFormData((p) => ({ ...p, primaryContactPhone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandColor">Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="brandColor"
                          type="color"
                          value={formData.brandColor}
                          onChange={(e) => setFormData((p) => ({ ...p, brandColor: e.target.value }))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.brandColor}
                          onChange={(e) => setFormData((p) => ({ ...p, brandColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, logoUrl: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL to the client&apos;s logo image. Displayed in their portal sidebar.
                    </p>
                    {formData.logoUrl && (
                      <div className="mt-2 p-2 border rounded-md bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <img 
                          src={formData.logoUrl} 
                          alt="Logo preview" 
                          className="h-8 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-4">Email Delivery</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailEnabled">Email enabled</Label>
                    <Switch
                      id="emailEnabled"
                      checked={emailSettings.emailEnabled}
                      onCheckedChange={(checked) => setEmailSettings((p) => ({ ...p, emailEnabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claimsInboxEmail">Claims Inbox Email</Label>
                    <Input
                      id="claimsInboxEmail"
                      type="email"
                      value={emailSettings.claimsInboxEmail}
                      onChange={(e) => setEmailSettings((p) => ({ ...p, claimsInboxEmail: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ccRecipients">CC Recipients</Label>
                      <Input
                        id="ccRecipients"
                        value={emailSettings.ccRecipients}
                        onChange={(e) => setEmailSettings((p) => ({ ...p, ccRecipients: e.target.value }))}
                        placeholder="Comma-separated"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bccRecipients">BCC Recipients</Label>
                      <Input
                        id="bccRecipients"
                        value={emailSettings.bccRecipients}
                        onChange={(e) => setEmailSettings((p) => ({ ...p, bccRecipients: e.target.value }))}
                        placeholder="Comma-separated"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeJsonAttachment">Include JSON attachment</Label>
                    <Switch
                      id="includeJsonAttachment"
                      checked={emailSettings.includeJsonAttachment}
                      onCheckedChange={(checked) => setEmailSettings((p) => ({ ...p, includeJsonAttachment: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeReportLink">Include report link</Label>
                    <Switch
                      id="includeReportLink"
                      checked={emailSettings.includeReportLink}
                      onCheckedChange={(checked) => setEmailSettings((p) => ({ ...p, includeReportLink: checked }))}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-4">Policyholder Confirmation</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="policyholderEnabled">Enable Confirmation Emails</Label>
                      <p className="text-xs text-muted-foreground">
                        Send confirmation emails to policyholders after FNOL submission
                      </p>
                    </div>
                    <Switch
                      id="policyholderEnabled"
                      checked={policyholderEmailSettings.enabled}
                      onCheckedChange={(checked) => setPolicyholderEmailSettings((p) => ({ ...p, enabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="policyholderUseCustomDomain">Use Custom Domain</Label>
                      <p className="text-xs text-muted-foreground">
                        Send from client&apos;s own verified email domain via Resend
                      </p>
                    </div>
                    <Switch
                      id="policyholderUseCustomDomain"
                      checked={policyholderEmailSettings.useCustomDomain}
                      onCheckedChange={(checked) => setPolicyholderEmailSettings((p) => ({ ...p, useCustomDomain: checked }))}
                      disabled={!policyholderEmailSettings.enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyholderFromAddress">From Address</Label>
                    <Input
                      id="policyholderFromAddress"
                      type="email"
                      placeholder="noreply@clientdomain.com"
                      value={policyholderEmailSettings.fromAddress}
                      onChange={(e) => setPolicyholderEmailSettings((p) => ({ ...p, fromAddress: e.target.value }))}
                      disabled={!policyholderEmailSettings.enabled || !policyholderEmailSettings.useCustomDomain}
                    />
                    <p className="text-xs text-muted-foreground">
                      {policyholderEmailSettings.useCustomDomain
                        ? "Domain must be verified in Resend"
                        : "Enable custom domain to use a custom from address"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyholderDeadLetterEmail">Failure Notification Email</Label>
                    <Input
                      id="policyholderDeadLetterEmail"
                      type="email"
                      placeholder="admin@clientdomain.com"
                      value={policyholderEmailSettings.deadLetterEmail}
                      onChange={(e) => setPolicyholderEmailSettings((p) => ({ ...p, deadLetterEmail: e.target.value }))}
                      disabled={!policyholderEmailSettings.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Receive notifications when confirmation emails fail after max retries
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold">FNOL Template</h3>
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-2">
                  {fnolFields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <p className="font-medium">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.path}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.enabled}
                            onCheckedChange={() => toggleFnolField(field.key, "enabled")}
                          />
                          <span className="text-sm">Enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={() => toggleFnolField(field.key, "required")}
                            disabled={!field.enabled}
                          />
                          <span className="text-sm">Required</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-4">Billing</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerCall">Price per call (CAD)</Label>
                      <Input
                        id="pricePerCall"
                        type="number"
                        step="0.01"
                        value={billingSettings.pricePerCall}
                        onChange={(e) => setBillingSettings((p) => ({ ...p, pricePerCall: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baseMonthlyFee">Base monthly fee (CAD)</Label>
                      <Input
                        id="baseMonthlyFee"
                        type="number"
                        step="0.01"
                        value={billingSettings.baseMonthlyFee}
                        onChange={(e) => setBillingSettings((p) => ({ ...p, baseMonthlyFee: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minimumMonthlyCharge">Minimum monthly charge (CAD)</Label>
                      <Input
                        id="minimumMonthlyCharge"
                        type="number"
                        step="0.01"
                        value={billingSettings.minimumMonthlyCharge}
                        onChange={(e) => setBillingSettings((p) => ({ ...p, minimumMonthlyCharge: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    {formData.status === "TRIAL" && (
                      <div className="space-y-2">
                        <Label htmlFor="freeTrialLimit">Free trial calls</Label>
                        <Input
                          id="freeTrialLimit"
                          type="number"
                          value={billingSettings.freeTrialLimit}
                          onChange={(e) => setBillingSettings((p) => ({ ...p, freeTrialLimit: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <Separator />

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold">Integrations</h3>
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilioIncomingNumber">Twilio incoming number</Label>
                    <Input
                      id="twilioIncomingNumber"
                      value={integrationSettings.twilioIncomingNumber}
                      onChange={(e) => setIntegrationSettings((p) => ({ ...p, twilioIncomingNumber: e.target.value }))}
                      placeholder="+1XXXXXXXXXX"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="elevenlabsAgentId">ElevenLabs agent id</Label>
                      <Input
                        id="elevenlabsAgentId"
                        value={integrationSettings.elevenlabsAgentId}
                        onChange={(e) => setIntegrationSettings((p) => ({ ...p, elevenlabsAgentId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elevenlabsVoiceId">ElevenLabs voice id</Label>
                      <Input
                        id="elevenlabsVoiceId"
                        value={integrationSettings.elevenlabsVoiceId}
                        onChange={(e) => setIntegrationSettings((p) => ({ ...p, elevenlabsVoiceId: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elevenlabsApiKey">ElevenLabs API key</Label>
                    <Input
                      id="elevenlabsApiKey"
                      type="password"
                      value={integrationSettings.elevenlabsApiKey}
                      onChange={(e) => setIntegrationSettings((p) => ({ ...p, elevenlabsApiKey: e.target.value }))}
                      placeholder="Leave empty to keep existing"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="guidewireEnabled">Guidewire enabled</Label>
                    <Switch
                      id="guidewireEnabled"
                      checked={integrationSettings.guidewireEnabled}
                      onCheckedChange={(checked) => setIntegrationSettings((p) => ({ ...p, guidewireEnabled: checked }))}
                    />
                  </div>
                  {integrationSettings.guidewireEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="guidewireEndpoint">Guidewire endpoint</Label>
                        <Input
                          id="guidewireEndpoint"
                          value={integrationSettings.guidewireEndpoint}
                          onChange={(e) => setIntegrationSettings((p) => ({ ...p, guidewireEndpoint: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guidewireApiKey">Guidewire API key</Label>
                        <Input
                          id="guidewireApiKey"
                          type="password"
                          value={integrationSettings.guidewireApiKey}
                          onChange={(e) => setIntegrationSettings((p) => ({ ...p, guidewireApiKey: e.target.value }))}
                          placeholder="Leave empty to keep existing"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guidewirePayloadTemplate">Payload template (JSON)</Label>
                        <Textarea
                          id="guidewirePayloadTemplate"
                          value={integrationSettings.guidewirePayloadTemplate}
                          onChange={(e) => setIntegrationSettings((p) => ({ ...p, guidewirePayloadTemplate: e.target.value }))}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guidewireTypecodeMap">Typecode map (JSON)</Label>
                        <Textarea
                          id="guidewireTypecodeMap"
                          value={integrationSettings.guidewireTypecodeMap}
                          onChange={(e) => setIntegrationSettings((p) => ({ ...p, guidewireTypecodeMap: e.target.value }))}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <section>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </section>
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client.name}? This will permanently delete all
              associated users, FNOL reports, and call records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
