"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminClient, useUpdateClientIntegrations } from "@/hooks/use-admin-client";
import {
  testGuidewireConnection,
  previewGuidewirePayload,
  testSendGuidewirePayload,
  listGuidewireTestReports,
  seedGuidewireTestReports,
  type TestReport,
} from "@/lib/api/admin-api";
import { toast } from "sonner";
import type { FnolField } from "@/lib/types/client";

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

export default function IntegrationsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const { data: client, isLoading } = useAdminClient(clientId);
  const updateIntegrations = useUpdateClientIntegrations(clientId);

  const [saving, setSaving] = useState(false);
  const [fnolFields, setFnolFields] = useState<FnolField[]>(DEFAULT_FNOL_FIELDS);

  const [billing, setBilling] = useState({
    pricePerCall: 0.80,
    baseMonthlyFee: 0,
    minimumMonthlyCharge: 0,
    implementationFee: 0,
    freeTrialLimit: 0,
  });

  const [elevenlabs, setElevenlabs] = useState({
    agentId: "",
    voiceId: "",
    apiKey: "",
    showApiKey: false,
  });

  const [guidewire, setGuidewire] = useState({
    enabled: false,
    oauthTokenUrl: "",
    oauthClientId: "",
    oauthClientSecret: "",
    oauthScope: "",
    validateBeforeSubmit: true,
    autoSubmit: false,
    attachDocuments: true,
    createPayloadTemplate: "",
    patchPayloadTemplate: "",
    typecodeMap: "",
    defaults: "",
    payloadSchema: "",
    legacyApiKey: "",
    showLegacyApiKey: false,
  });

  const [email, setEmail] = useState({
    claimsInboxEmail: "",
    ccRecipients: "",
    bccRecipients: "",
    emailEnabled: false,
    includeJsonAttachment: false,
    includeReportLink: true,
  });

  const [phone, setPhone] = useState({
    twilioIncomingNumber: "",
    webhookSecret: "",
    showWebhookSecret: false,
  });

  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [selectedTestReport, setSelectedTestReport] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [previewingPayload, setPreviewingPayload] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; steps: Array<{ step: string; status: string; message?: string }> } | null>(null);
  const [previewResult, setPreviewResult] = useState<object | null>(null);

  useEffect(() => {
    if (client?.integrations) {
      const i = client.integrations;

      if (i.fnolSchema?.fields) {
        setFnolFields(i.fnolSchema.fields);
      }

      setBilling({
        pricePerCall: i.pricePerCall,
        baseMonthlyFee: i.baseMonthlyFee || 0,
        minimumMonthlyCharge: i.minimumMonthlyCharge || 0,
        implementationFee: i.implementationFee || 0,
        freeTrialLimit: i.freeTrialLimit || 0,
      });

      setElevenlabs({
        agentId: i.elevenlabsAgentId || "",
        voiceId: i.elevenlabsVoiceId || "",
        apiKey: "",
        showApiKey: false,
      });

      setGuidewire({
        enabled: i.guidewireEnabled,
        oauthTokenUrl: i.guidewireOauthTokenUrl || "",
        oauthClientId: i.guidewireOauthClientId || "",
        oauthClientSecret: "",
        oauthScope: i.guidewireOauthScope || "",
        validateBeforeSubmit: i.guidewireValidateBeforeSubmit,
        autoSubmit: i.guidewireAutoSubmit,
        attachDocuments: i.guidewireAttachDocuments,
        createPayloadTemplate: i.guidewirePayloadTemplate ? JSON.stringify(i.guidewirePayloadTemplate, null, 2) : "",
        patchPayloadTemplate: i.guidewirePatchPayloadTemplate ? JSON.stringify(i.guidewirePatchPayloadTemplate, null, 2) : "",
        typecodeMap: i.guidewirePayloadTypecodes ? JSON.stringify(i.guidewirePayloadTypecodes, null, 2) : "",
        defaults: i.guidewirePayloadDefaults ? JSON.stringify(i.guidewirePayloadDefaults, null, 2) : "",
        payloadSchema: i.guidewirePayloadSchema ? JSON.stringify(i.guidewirePayloadSchema, null, 2) : "",
        legacyApiKey: "",
        showLegacyApiKey: false,
      });

      setEmail({
        claimsInboxEmail: i.claimsInboxEmail || "",
        ccRecipients: i.ccRecipients?.join(", ") || "",
        bccRecipients: i.bccRecipients?.join(", ") || "",
        emailEnabled: i.emailEnabled,
        includeJsonAttachment: i.includeJsonAttachment,
        includeReportLink: i.includeReportLink,
      });

      setPhone({
        twilioIncomingNumber: i.twilioIncomingNumber || "",
        webhookSecret: "",
        showWebhookSecret: false,
      });
    }
  }, [client]);

  useEffect(() => {
    if (clientId) {
      listGuidewireTestReports(clientId)
        .then((res) => setTestReports(res.reports))
        .catch(() => {});
    }
  }, [clientId]);

  function toggleFnolField(key: string, field: "enabled" | "required") {
    setFnolFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: !f[field] } : f))
    );
  }

  function copyFnolSpec() {
    const spec = fnolFields.filter((f) => f.enabled).map((f) => ({
      key: f.key,
      label: f.label,
      path: f.path,
      required: f.required,
    }));
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    toast.success("FNOL spec copied to clipboard");
  }

  async function handleTestConnection() {
    setTestingConnection(true);
    try {
      const result = await testGuidewireConnection(clientId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection test failed");
    } finally {
      setTestingConnection(false);
    }
  }

  async function handlePreviewPayload() {
    if (!selectedTestReport) {
      toast.error("Select a test report first");
      return;
    }
    setPreviewingPayload(true);
    setPreviewResult(null);
    try {
      const result = await previewGuidewirePayload(clientId, selectedTestReport);
      setPreviewResult(result.payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setPreviewingPayload(false);
    }
  }

  async function handleSendTest() {
    if (!selectedTestReport) {
      toast.error("Select a test report first");
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const result = await testSendGuidewirePayload(clientId, selectedTestReport);
      setTestResult(result);
      if (result.success) {
        toast.success("Test FNOL sent successfully");
      } else {
        toast.error("Test FNOL failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test send failed");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSeedTestReports() {
    try {
      const result = await seedGuidewireTestReports(clientId);
      setTestReports((prev) => [...prev, ...result.created]);
      toast.success(`Created ${result.created.length} test reports`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create test reports");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateIntegrations.mutateAsync({
        fnolSchema: { version: 1, fields: fnolFields.filter((f) => f.enabled) },
        pricePerCall: billing.pricePerCall,
        baseMonthlyFee: billing.baseMonthlyFee || undefined,
        minimumMonthlyCharge: billing.minimumMonthlyCharge || undefined,
        implementationFee: billing.implementationFee || undefined,
        freeTrialLimit: client?.status === "TRIAL" ? billing.freeTrialLimit : undefined,
        elevenlabsAgentId: elevenlabs.agentId || undefined,
        elevenlabsVoiceId: elevenlabs.voiceId || undefined,
        elevenlabsApiKey: elevenlabs.apiKey || undefined,
        guidewireEnabled: guidewire.enabled,
        guidewireOauthTokenUrl: guidewire.oauthTokenUrl || undefined,
        guidewireOauthClientId: guidewire.oauthClientId || undefined,
        guidewireOauthClientSecret: guidewire.oauthClientSecret || undefined,
        guidewireOauthScope: guidewire.oauthScope || undefined,
        guidewireValidateBeforeSubmit: guidewire.validateBeforeSubmit,
        guidewireAutoSubmit: guidewire.autoSubmit,
        guidewireAttachDocuments: guidewire.attachDocuments,
        guidewirePayloadTemplate: guidewire.createPayloadTemplate ? JSON.parse(guidewire.createPayloadTemplate) : undefined,
        guidewirePatchPayloadTemplate: guidewire.patchPayloadTemplate ? JSON.parse(guidewire.patchPayloadTemplate) : undefined,
        guidewirePayloadTypecodes: guidewire.typecodeMap ? JSON.parse(guidewire.typecodeMap) : undefined,
        guidewirePayloadDefaults: guidewire.defaults ? JSON.parse(guidewire.defaults) : undefined,
        guidewirePayloadSchema: guidewire.payloadSchema ? JSON.parse(guidewire.payloadSchema) : undefined,
        guidewireApiKey: guidewire.legacyApiKey || undefined,
        emailEnabled: email.emailEnabled,
        claimsInboxEmail: email.claimsInboxEmail || undefined,
        ccRecipients: email.ccRecipients ? email.ccRecipients.split(",").map((s) => s.trim()) : [],
        bccRecipients: email.bccRecipients ? email.bccRecipients.split(",").map((s) => s.trim()) : [],
        includeJsonAttachment: email.includeJsonAttachment,
        includeReportLink: email.includeReportLink,
        twilioIncomingNumber: phone.twilioIncomingNumber || undefined,
      });
      toast.success("Integrations saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${clientId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Client Configuration</h1>
          <p className="text-muted-foreground">{client.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>FNOL Expected Fields</CardTitle>
            <CardDescription>Configure which fields the AI will collect</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={copyFnolSpec}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Spec
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Price per FNOL (CAD)</Label>
              <Input
                type="number"
                step="0.01"
                value={billing.pricePerCall}
                onChange={(e) => setBilling((p) => ({ ...p, pricePerCall: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Base monthly fee (CAD)</Label>
              <Input
                type="number"
                step="0.01"
                value={billing.baseMonthlyFee}
                onChange={(e) => setBilling((p) => ({ ...p, baseMonthlyFee: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum monthly (CAD)</Label>
              <Input
                type="number"
                step="0.01"
                value={billing.minimumMonthlyCharge}
                onChange={(e) => setBilling((p) => ({ ...p, minimumMonthlyCharge: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Implementation fee (CAD)</Label>
              <Input
                type="number"
                step="0.01"
                value={billing.implementationFee}
                onChange={(e) => setBilling((p) => ({ ...p, implementationFee: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          {client.status === "TRIAL" && (
            <div className="space-y-2">
              <Label>Free trial calls</Label>
              <Input
                type="number"
                value={billing.freeTrialLimit}
                onChange={(e) => setBilling((p) => ({ ...p, freeTrialLimit: parseInt(e.target.value) || 0 }))}
                className="max-w-[200px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ElevenLabs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agent ID</Label>
              <Input
                value={elevenlabs.agentId}
                onChange={(e) => setElevenlabs((p) => ({ ...p, agentId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Voice ID</Label>
              <Input
                value={elevenlabs.voiceId}
                onChange={(e) => setElevenlabs((p) => ({ ...p, voiceId: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type={elevenlabs.showApiKey ? "text" : "password"}
                value={elevenlabs.apiKey}
                onChange={(e) => setElevenlabs((p) => ({ ...p, apiKey: e.target.value }))}
                placeholder="Leave empty to keep existing"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setElevenlabs((p) => ({ ...p, showApiKey: !p.showApiKey }))}
              >
                {elevenlabs.showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {client.integrations?.elevenlabsApiKeyLast4 && (
              <p className="text-xs text-muted-foreground">
                Current key ends in: ****{client.integrations.elevenlabsApiKeyLast4}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guidewire ClaimCenter Cloud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Enable Guidewire Integration</Label>
            <Switch
              checked={guidewire.enabled}
              onCheckedChange={(checked) => setGuidewire((p) => ({ ...p, enabled: checked }))}
            />
          </div>

          {guidewire.enabled && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">OAuth2 Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token URL</Label>
                    <Input
                      value={guidewire.oauthTokenUrl}
                      onChange={(e) => setGuidewire((p) => ({ ...p, oauthTokenUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      value={guidewire.oauthClientId}
                      onChange={(e) => setGuidewire((p) => ({ ...p, oauthClientId: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      value={guidewire.oauthClientSecret}
                      onChange={(e) => setGuidewire((p) => ({ ...p, oauthClientSecret: e.target.value }))}
                      placeholder="Leave empty to keep existing"
                    />
                    {client.integrations?.guidewireOauthConfigured && (
                      <p className="text-xs text-muted-foreground">OAuth credentials configured</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <Input
                      value={guidewire.oauthScope}
                      onChange={(e) => setGuidewire((p) => ({ ...p, oauthScope: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Test OAuth Connection
                </Button>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Multi-Step Flow Options</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Validate before submit</Label>
                    <Switch
                      checked={guidewire.validateBeforeSubmit}
                      onCheckedChange={(checked) => setGuidewire((p) => ({ ...p, validateBeforeSubmit: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-submit</Label>
                    <Switch
                      checked={guidewire.autoSubmit}
                      onCheckedChange={(checked) => setGuidewire((p) => ({ ...p, autoSubmit: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Attach documents</Label>
                    <Switch
                      checked={guidewire.attachDocuments}
                      onCheckedChange={(checked) => setGuidewire((p) => ({ ...p, attachDocuments: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Payload Templates</h4>
                <div className="space-y-2">
                  <Label>Create Payload Template (POST /claims)</Label>
                  <Textarea
                    value={guidewire.createPayloadTemplate}
                    onChange={(e) => setGuidewire((p) => ({ ...p, createPayloadTemplate: e.target.value }))}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patch Payload Template (PATCH /claims/id)</Label>
                  <Textarea
                    value={guidewire.patchPayloadTemplate}
                    onChange={(e) => setGuidewire((p) => ({ ...p, patchPayloadTemplate: e.target.value }))}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Typecode Map (JSON)</Label>
                    <Textarea
                      value={guidewire.typecodeMap}
                      onChange={(e) => setGuidewire((p) => ({ ...p, typecodeMap: e.target.value }))}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Defaults (JSON)</Label>
                    <Textarea
                      value={guidewire.defaults}
                      onChange={(e) => setGuidewire((p) => ({ ...p, defaults: e.target.value }))}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payload JSON Schema (optional validation)</Label>
                  <Textarea
                    value={guidewire.payloadSchema}
                    onChange={(e) => setGuidewire((p) => ({ ...p, payloadSchema: e.target.value }))}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Test with FNOL Report</h4>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Test Report</Label>
                    <Select value={selectedTestReport} onValueChange={setSelectedTestReport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test report..." />
                      </SelectTrigger>
                      <SelectContent>
                        {testReports.map((report) => (
                          <SelectItem key={report.id} value={report.id}>
                            {report.id.slice(0, 8)}... - {report.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={handleSeedTestReports}>
                    Create Test Report
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviewPayload}
                    disabled={previewingPayload || !selectedTestReport}
                  >
                    {previewingPayload && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Preview Payload
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSendTest}
                    disabled={sendingTest || !selectedTestReport}
                  >
                    {sendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Test FNOL
                  </Button>
                </div>

                {previewResult && (
                  <div className="p-4 bg-muted rounded-md">
                    <pre className="text-xs overflow-auto max-h-64">
                      {JSON.stringify(previewResult, null, 2)}
                    </pre>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-2">
                    {testResult.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {step.status === "success" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{step.step}</span>
                        {step.message && (
                          <span className="text-xs text-muted-foreground">- {step.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Collapsible>
                <CollapsibleTrigger className="text-sm text-muted-foreground">
                  Legacy API Key (deprecated)
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="flex gap-2">
                    <Input
                      type={guidewire.showLegacyApiKey ? "text" : "password"}
                      value={guidewire.legacyApiKey}
                      onChange={(e) => setGuidewire((p) => ({ ...p, legacyApiKey: e.target.value }))}
                      placeholder="Leave empty to keep existing"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setGuidewire((p) => ({ ...p, showLegacyApiKey: !p.showLegacyApiKey }))}
                    >
                      {guidewire.showLegacyApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Email Delivery Enabled</Label>
            <Switch
              checked={email.emailEnabled}
              onCheckedChange={(checked) => setEmail((p) => ({ ...p, emailEnabled: checked }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Claims Inbox Email</Label>
              <Input
                type="email"
                value={email.claimsInboxEmail}
                onChange={(e) => setEmail((p) => ({ ...p, claimsInboxEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>CC</Label>
              <Input
                value={email.ccRecipients}
                onChange={(e) => setEmail((p) => ({ ...p, ccRecipients: e.target.value }))}
                placeholder="Comma-separated"
              />
            </div>
            <div className="space-y-2">
              <Label>BCC</Label>
              <Input
                value={email.bccRecipients}
                onChange={(e) => setEmail((p) => ({ ...p, bccRecipients: e.target.value }))}
                placeholder="Comma-separated"
              />
            </div>
          </div>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <Switch
                checked={email.includeJsonAttachment}
                onCheckedChange={(checked) => setEmail((p) => ({ ...p, includeJsonAttachment: checked }))}
              />
              <Label>Include JSON Attachment</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={email.includeReportLink}
                onCheckedChange={(checked) => setEmail((p) => ({ ...p, includeReportLink: checked }))}
              />
              <Label>Include Report Link</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Twilio Incoming Number</Label>
              <Input
                value={phone.twilioIncomingNumber}
                onChange={(e) => setPhone((p) => ({ ...p, twilioIncomingNumber: e.target.value }))}
                placeholder="+1XXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>ElevenLabs Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  type={phone.showWebhookSecret ? "text" : "password"}
                  value={phone.webhookSecret}
                  onChange={(e) => setPhone((p) => ({ ...p, webhookSecret: e.target.value }))}
                  placeholder="Leave empty to keep existing"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPhone((p) => ({ ...p, showWebhookSecret: !p.showWebhookSecret }))}
                >
                  {phone.showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save All Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
