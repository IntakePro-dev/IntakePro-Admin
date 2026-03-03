"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCreateClient } from "@/hooks/use-admin-clients";
import { toast } from "sonner";
import type { CreateClientInput, FnolField, ClientStatus, LineOfBusiness } from "@/lib/types/client";
import { cn } from "@/lib/utils";

interface CreateClientModalProps {
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

const steps = [
  { id: 1, title: "Company Info" },
  { id: 2, title: "Contact & Branding" },
  { id: 3, title: "FNOL Template" },
  { id: 4, title: "Integrations & Billing" },
  { id: 5, title: "Review & Create" },
];

function generateClientId() {
  return `CLT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
}

export function CreateClientModal({ open, onOpenChange }: CreateClientModalProps) {
  const router = useRouter();
  const createClient = useCreateClient();
  const [step, setStep] = useState(1);
  const [clientId] = useState(generateClientId);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    status: "ACTIVE" as ClientStatus,
    lineOfBusiness: "" as LineOfBusiness | "",
    timezone: "",
    displayName: "",
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactEmail: "",
    claimsInboxEmail: "",
    ccRecipients: "",
    bccRecipients: "",
    brandColor: "#4B7BD9",
    elevenlabsAgentId: "",
    guidewireEndpoint: "",
    guidewireApiToken: "",
    fnolDeliveryMethod: "email" as "api" | "email" | "both",
    pricePerCall: 0.80,
    baseMonthlyFee: 0,
    minimumMonthlyCharge: 0,
    freeTrialLimit: 0,
  });

  const [fnolFields, setFnolFields] = useState<FnolField[]>(DEFAULT_FNOL_FIELDS);
  const [customFields, setCustomFields] = useState<FnolField[]>([]);

  function updateFormData<K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFnolField(key: string, field: "enabled" | "required") {
    setFnolFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: !f[field] } : f))
    );
  }

  function addCustomField() {
    const newField: FnolField = {
      key: `custom_${Date.now()}`,
      label: "",
      path: "",
      required: false,
      enabled: true,
      custom: true,
    };
    setCustomFields((prev) => [...prev, newField]);
  }

  function updateCustomField(index: number, updates: Partial<FnolField>) {
    setCustomFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  }

  function removeCustomField(index: number) {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    const allFields = [...fnolFields.filter((f) => f.enabled), ...customFields.filter((f) => f.enabled && f.label)];

    const input: CreateClientInput = {
      name: formData.name,
      legalName: formData.legalName,
      status: formData.status,
      lineOfBusiness: formData.lineOfBusiness as LineOfBusiness,
      timezone: formData.timezone,
      displayName: formData.displayName,
      primaryContactName: formData.primaryContactName,
      primaryContactPhone: formData.primaryContactPhone,
      primaryContactEmail: formData.primaryContactEmail,
      claimsInboxEmail: formData.claimsInboxEmail,
      ccRecipients: formData.ccRecipients,
      bccRecipients: formData.bccRecipients,
      brandColor: formData.brandColor,
      fnolSchema: { version: 1, fields: allFields },
      elevenlabsAgentId: formData.elevenlabsAgentId || undefined,
      guidewireEndpoint: formData.guidewireEndpoint || undefined,
      guidewireApiToken: formData.guidewireApiToken || undefined,
      fnolDeliveryMethod: formData.fnolDeliveryMethod,
      pricePerCall: formData.pricePerCall,
      baseMonthlyFee: formData.baseMonthlyFee || undefined,
      minimumMonthlyCharge: formData.minimumMonthlyCharge || undefined,
      freeTrialLimit: formData.status === "TRIAL" ? formData.freeTrialLimit : undefined,
    };

    try {
      const result = await createClient.mutateAsync(input);
      toast.success("Client created successfully");
      onOpenChange(false);
      router.push(`/clients/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    }
  }

  function canProceed() {
    switch (step) {
      case 1:
        return formData.name && formData.legalName && formData.lineOfBusiness && formData.timezone;
      case 2:
        return formData.primaryContactName && formData.primaryContactPhone && formData.primaryContactEmail && formData.claimsInboxEmail && formData.displayName;
      case 3:
        return true;
      case 4:
        return formData.pricePerCall > 0;
      case 5:
        return true;
      default:
        return false;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  step > s.id
                    ? "bg-green-500 text-white"
                    : step === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-1",
                    step > s.id ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm font-medium text-muted-foreground mb-4">
          Step {step}: {steps[step - 1].title}
        </p>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Acme Insurance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Entity Name *</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => updateFormData("legalName", e.target.value)}
                  placeholder="Acme Insurance Inc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateFormData("status", v as ClientStatus)}
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
                <Label htmlFor="lineOfBusiness">Primary Line of Business *</Label>
                <Select
                  value={formData.lineOfBusiness}
                  onValueChange={(v) => updateFormData("lineOfBusiness", v as LineOfBusiness)}
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
                <Label htmlFor="timezone">Time Zone *</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(v) => updateFormData("timezone", v)}
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
                <Label htmlFor="clientId">Client ID</Label>
                <Input id="clientId" value={clientId} disabled className="bg-muted" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
                <Input
                  id="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={(e) => updateFormData("primaryContactName", e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactPhone">Phone Number *</Label>
                <Input
                  id="primaryContactPhone"
                  value={formData.primaryContactPhone}
                  onChange={(e) => updateFormData("primaryContactPhone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactEmail">Email *</Label>
                <Input
                  id="primaryContactEmail"
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => updateFormData("primaryContactEmail", e.target.value)}
                  placeholder="john@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimsInboxEmail">Claims Inbox *</Label>
                <Input
                  id="claimsInboxEmail"
                  type="email"
                  value={formData.claimsInboxEmail}
                  onChange={(e) => updateFormData("claimsInboxEmail", e.target.value)}
                  placeholder="claims@acme.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ccRecipients">CC/BCC Emails</Label>
              <Input
                id="ccRecipients"
                value={formData.ccRecipients}
                onChange={(e) => updateFormData("ccRecipients", e.target.value)}
                placeholder="Comma-separated emails"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="brandColor"
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => updateFormData("brandColor", e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.brandColor}
                    onChange={(e) => updateFormData("brandColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateFormData("displayName", e.target.value)}
                  placeholder="For caller script"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure which fields the AI will collect during FNOL calls.
            </p>

            <div className="space-y-2">
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
            </div>

            {customFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Custom Fields</p>
                {customFields.map((field, index) => (
                  <div key={field.key} className="flex items-center gap-2 p-3 rounded-md border">
                    <Input
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) => updateCustomField(index, { label: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Key"
                      value={field.path}
                      onChange={(e) => updateCustomField(index, { path: `details.custom.${e.target.value}`, key: e.target.value })}
                      className="flex-1"
                    />
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => updateCustomField(index, { required: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={addCustomField}>
              Add Custom Field
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="elevenlabsAgentId">ElevenLabs Agent ID</Label>
                <Input
                  id="elevenlabsAgentId"
                  value={formData.elevenlabsAgentId}
                  onChange={(e) => updateFormData("elevenlabsAgentId", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fnolDeliveryMethod">FNOL Delivery Method</Label>
                <Select
                  value={formData.fnolDeliveryMethod}
                  onValueChange={(v) => updateFormData("fnolDeliveryMethod", v as "api" | "email" | "both")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guidewireEndpoint">Guidewire API Endpoint</Label>
                <Input
                  id="guidewireEndpoint"
                  value={formData.guidewireEndpoint}
                  onChange={(e) => updateFormData("guidewireEndpoint", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guidewireApiToken">API Token</Label>
                <Input
                  id="guidewireApiToken"
                  type="password"
                  value={formData.guidewireApiToken}
                  onChange={(e) => updateFormData("guidewireApiToken", e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-4">Billing Configuration</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerCall">Price per Call (CAD) *</Label>
                  <Input
                    id="pricePerCall"
                    type="number"
                    step="0.01"
                    value={formData.pricePerCall}
                    onChange={(e) => updateFormData("pricePerCall", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseMonthlyFee">Base Monthly Fee (CAD)</Label>
                  <Input
                    id="baseMonthlyFee"
                    type="number"
                    step="0.01"
                    value={formData.baseMonthlyFee}
                    onChange={(e) => updateFormData("baseMonthlyFee", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumMonthlyCharge">Minimum Monthly Charge (CAD)</Label>
                  <Input
                    id="minimumMonthlyCharge"
                    type="number"
                    step="0.01"
                    value={formData.minimumMonthlyCharge}
                    onChange={(e) => updateFormData("minimumMonthlyCharge", parseFloat(e.target.value) || 0)}
                  />
                </div>
                {formData.status === "TRIAL" && (
                  <div className="space-y-2">
                    <Label htmlFor="freeTrialLimit">Free Trial Calls</Label>
                    <Input
                      id="freeTrialLimit"
                      type="number"
                      value={formData.freeTrialLimit}
                      onChange={(e) => updateFormData("freeTrialLimit", parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the information below before creating the client.
            </p>

            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <h4 className="font-medium mb-2">Company Info</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Legal Name:</span> {formData.legalName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span> {formData.status}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Line of Business:</span> {formData.lineOfBusiness}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timezone:</span> {formData.timezone}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h4 className="font-medium mb-2">Contact & Branding</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Contact:</span> {formData.primaryContactName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {formData.primaryContactEmail}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span> {formData.primaryContactPhone}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Claims Inbox:</span> {formData.claimsInboxEmail}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Display Name:</span> {formData.displayName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Brand Color:</span>
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: formData.brandColor }}
                    />
                    {formData.brandColor}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h4 className="font-medium mb-2">FNOL Fields</h4>
                <div className="flex flex-wrap gap-2">
                  {fnolFields.filter((f) => f.enabled).map((f) => (
                    <span
                      key={f.key}
                      className="px-2 py-1 bg-muted rounded text-xs"
                    >
                      {f.label} {f.required && "*"}
                    </span>
                  ))}
                  {customFields.filter((f) => f.enabled && f.label).map((f) => (
                    <span
                      key={f.key}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs"
                    >
                      {f.label} {f.required && "*"} (custom)
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h4 className="font-medium mb-2">Billing</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price per Call:</span> ${formData.pricePerCall.toFixed(2)} CAD
                  </div>
                  {formData.baseMonthlyFee > 0 && (
                    <div>
                      <span className="text-muted-foreground">Base Monthly Fee:</span> ${formData.baseMonthlyFee.toFixed(2)} CAD
                    </div>
                  )}
                  {formData.minimumMonthlyCharge > 0 && (
                    <div>
                      <span className="text-muted-foreground">Minimum Monthly:</span> ${formData.minimumMonthlyCharge.toFixed(2)} CAD
                    </div>
                  )}
                  {formData.status === "TRIAL" && formData.freeTrialLimit > 0 && (
                    <div>
                      <span className="text-muted-foreground">Free Trial Calls:</span> {formData.freeTrialLimit}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < 5 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={createClient.isPending}>
              {createClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
