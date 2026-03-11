"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminClient } from "@/hooks/use-admin-client";
import { useReportTemplate, useUpdateReportTemplate, useResetReportTemplate } from "@/hooks/use-report-template";
import { DEFAULT_REPORT_TEMPLATE, DEFAULT_SECTIONS } from "@/lib/constants/default-report-template";
import { PREMADE_FIELDS } from "@/lib/types/report-template";
import type { ReportTemplate, ReportSectionConfig, ReportFieldConfig, ReportFieldFormat } from "@/lib/types/report-template";
import { toast } from "sonner";

function generateFieldId(label: string): string {
  return `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function isCustomField(fieldId: string): boolean {
  return !PREMADE_FIELDS[fieldId];
}

function validateTemplate(template: ReportTemplate): string[] {
  const errors: string[] = [];
  const fieldIds = new Set<string>();

  const enabledSections = template.sections.filter((s) => s.enabled);
  if (enabledSections.length === 0) {
    errors.push("At least one section must be enabled");
  }

  for (const section of template.sections) {
    if (section.enabled) {
      const enabledFields = section.fields.filter((f) => f.enabled);
      if (enabledFields.length === 0) {
        errors.push(`Section "${section.title}" must have at least one enabled field`);
      }
    }

    for (const field of section.fields) {
      if (fieldIds.has(field.id)) {
        errors.push(`Duplicate field ID: ${field.id}`);
      }
      fieldIds.add(field.id);

      if (!field.label.trim()) {
        errors.push(`Field "${field.id}" must have a label`);
      }
      if (!field.path.trim()) {
        errors.push(`Field "${field.id}" must have a JSON path`);
      }
      if (field.order < 1) {
        errors.push(`Field "${field.id}" must have a positive order number`);
      }
    }

    if (section.order < 1) {
      errors.push(`Section "${section.title}" must have a positive order number`);
    }
  }

  return errors;
}

export default function ReportTemplatePage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const { data: client, isLoading: clientLoading } = useAdminClient(clientId);
  const { data: templateData, isLoading: templateLoading } = useReportTemplate(clientId);
  const updateTemplate = useUpdateReportTemplate(clientId);
  const resetTemplate = useResetReportTemplate(clientId);

  const [template, setTemplate] = useState<ReportTemplate>(DEFAULT_REPORT_TEMPLATE);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<string>("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newField, setNewField] = useState({
    label: "",
    path: "",
    format: "text" as ReportFieldFormat,
  });

  const isDefault = templateData?.isDefault ?? true;

  useEffect(() => {
    if (templateData?.template) {
      setTemplate(templateData.template);
      setExpandedSections(new Set(templateData.template.sections.map((s) => s.id)));
    }
  }, [templateData]);

  const sortedSections = useMemo(() => {
    return [...template.sections].sort((a, b) => a.order - b.order);
  }, [template.sections]);

  function toggleSectionExpanded(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  function updateSection(sectionId: string, updates: Partial<ReportSectionConfig>) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }));
  }

  function updateField(sectionId: string, fieldId: string, updates: Partial<ReportFieldConfig>) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) }
          : s
      ),
    }));
  }

  function moveFieldToSection(fromSectionId: string, fieldId: string, toSectionId: string) {
    setTemplate((prev) => {
      const fromSection = prev.sections.find((s) => s.id === fromSectionId);
      const field = fromSection?.fields.find((f) => f.id === fieldId);
      if (!field) return prev;

      const toSection = prev.sections.find((s) => s.id === toSectionId);
      const maxOrder = Math.max(0, ...(toSection?.fields.map((f) => f.order) || []));

      return {
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id === fromSectionId) {
            return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) };
          }
          if (s.id === toSectionId) {
            return { ...s, fields: [...s.fields, { ...field, order: maxOrder + 1 }] };
          }
          return s;
        }),
      };
    });
  }

  function deleteField(sectionId: string, fieldId: string) {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s
      ),
    }));
  }

  function openAddFieldDialog(sectionId: string) {
    setAddFieldSection(sectionId);
    setNewField({ label: "", path: "", format: "text" });
    setAddFieldOpen(true);
  }

  function handleAddField() {
    if (!newField.label.trim() || !newField.path.trim()) {
      toast.error("Label and JSON path are required");
      return;
    }

    const fieldId = generateFieldId(newField.label);
    const allFieldIds = template.sections.flatMap((s) => s.fields.map((f) => f.id));
    if (allFieldIds.includes(fieldId)) {
      toast.error("A field with this ID already exists");
      return;
    }

    const section = template.sections.find((s) => s.id === addFieldSection);
    const maxOrder = Math.max(0, ...(section?.fields.map((f) => f.order) || []));

    const field: ReportFieldConfig = {
      id: fieldId,
      label: newField.label.trim(),
      path: newField.path.trim(),
      enabled: true,
      order: maxOrder + 1,
      format: newField.format,
    };

    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === addFieldSection ? { ...s, fields: [...s.fields, field] } : s
      ),
    }));

    setAddFieldOpen(false);
    toast.success("Custom field added");
  }

  async function handleSave() {
    const errors = validateTemplate(template);
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setSaving(true);
    try {
      await updateTemplate.mutateAsync(template);
      toast.success("Report template saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    try {
      await resetTemplate.mutateAsync();
      setTemplate(DEFAULT_REPORT_TEMPLATE);
      setResetDialogOpen(false);
      toast.success("Template reset to default");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset template");
    }
  }

  if (clientLoading || templateLoading) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/clients/${clientId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Report Template</h1>
            <p className="text-muted-foreground">{client.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDefault ? (
            <Badge variant="secondary">Using Default</Badge>
          ) : (
            <Badge>Custom Template</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Configuration</CardTitle>
          <CardDescription>
            Configure which fields appear in FNOL reports for this client. Drag sections to reorder,
            toggle fields on/off, and add custom fields as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedSections.map((section) => (
            <Collapsible
              key={section.id}
              open={expandedSections.has(section.id)}
              onOpenChange={() => toggleSectionExpanded(section.id)}
            >
              <div className="border rounded-lg">
                <div className="flex items-center gap-3 p-4 bg-muted/50">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <div className="flex-1">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="h-8 font-medium bg-transparent border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Order</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={section.order}
                        onChange={(e) =>
                          updateSection(section.id, { order: parseInt(e.target.value) || 1 })
                        }
                        className="w-16 h-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={(checked) => updateSection(section.id, { enabled: checked })}
                      />
                      <Label className="text-sm">Enabled</Label>
                    </div>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="p-4 space-y-3 border-t">
                    {section.fields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-3 rounded-md border bg-background"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.enabled}
                              onCheckedChange={(checked) =>
                                updateField(section.id, field.id, { enabled: checked })
                              }
                              disabled={!section.enabled}
                            />
                          </div>
                          <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                            <div>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(section.id, field.id, { label: e.target.value })
                                }
                                placeholder="Label"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Input
                                value={field.path}
                                onChange={(e) =>
                                  updateField(section.id, field.id, { path: e.target.value })
                                }
                                placeholder="JSON Path"
                                className="h-8 font-mono text-xs"
                                disabled={!isCustomField(field.id)}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                Order
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={field.order}
                                onChange={(e) =>
                                  updateField(section.id, field.id, {
                                    order: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-16 h-8"
                              />
                            </div>
                            <div>
                              <Select
                                value={section.id}
                                onValueChange={(value) =>
                                  moveFieldToSection(section.id, field.id, value)
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DEFAULT_SECTIONS.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCustomField(field.id) && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  Custom
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => deleteField(section.id, field.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {field.format && (
                              <Badge variant="secondary" className="text-xs">
                                {field.format}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openAddFieldDialog(section.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Custom Field
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setResetDialogOpen(true)}
          disabled={isDefault}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Template"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Create a custom field with a specific JSON path to display additional data in reports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={newField.label}
                onChange={(e) => setNewField((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g., Custom Field Name"
              />
            </div>
            <div className="space-y-2">
              <Label>JSON Path</Label>
              <Input
                value={newField.path}
                onChange={(e) => setNewField((p) => ({ ...p, path: e.target.value }))}
                placeholder="e.g., loss.myCustomField"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                The path to the data in the FNOL report JSON (e.g., caller.name, loss.type)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={newField.format}
                onValueChange={(value) =>
                  setNewField((p) => ({ ...p, format: value as ReportFieldFormat }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFieldOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all custom configurations and restore the default report template.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reset Template"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
