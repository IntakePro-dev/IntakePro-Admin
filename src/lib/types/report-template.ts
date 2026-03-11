export type ReportFieldFormat = "text" | "boolean" | "date" | "phone" | "duration";

export interface ReportFieldConfig {
  id: string;
  path: string;
  label: string;
  enabled: boolean;
  order: number;
  format?: ReportFieldFormat;
}

export interface ReportSectionConfig {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  fields: ReportFieldConfig[];
}

export interface ReportTemplate {
  version: number;
  sections: ReportSectionConfig[];
}

export interface ReportTemplateResponse {
  template: ReportTemplate;
  isDefault: boolean;
}

export const PREMADE_FIELDS: Record<string, Omit<ReportFieldConfig, "enabled" | "order">> = {
  claim_summary: { id: "claim_summary", path: "claim.summary", label: "Claim Summary" },
  call_datetime: { id: "call_datetime", path: "call.startTime", label: "Date/Time", format: "date" },
  call_duration: { id: "call_duration", path: "call.durationSeconds", label: "Duration", format: "duration" },
  call_mode: { id: "call_mode", path: "mode", label: "Mode" },
  caller_name: { id: "caller_name", path: "caller.name", label: "Name" },
  caller_phone: { id: "caller_phone", path: "caller.callbackNumber", label: "Phone", format: "phone" },
  caller_email: { id: "caller_email", path: "caller.email", label: "Email" },
  caller_relationship: { id: "caller_relationship", path: "caller.relationship", label: "Relationship" },
  caller_language: { id: "caller_language", path: "caller.language", label: "Language" },
  policy_number: { id: "policy_number", path: "policy.policyNumber", label: "Policy Number" },
  policy_carrier: { id: "policy_carrier", path: "policy.carrier", label: "Carrier" },
  policy_effective: { id: "policy_effective", path: "policy.effectiveDate", label: "Effective Date", format: "date" },
  policy_expiration: { id: "policy_expiration", path: "policy.expirationDate", label: "Expiration Date", format: "date" },
  policy_coverage: { id: "policy_coverage", path: "policy.coverageType", label: "Coverage Type" },
  policy_lob: { id: "policy_lob", path: "policy.lineOfBusiness", label: "Line of Business" },
  loss_type: { id: "loss_type", path: "loss.type", label: "Type of Loss" },
  loss_cause: { id: "loss_cause", path: "loss.cause", label: "Cause of Loss" },
  loss_date: { id: "loss_date", path: "loss.dateTime", label: "Date of Loss", format: "date" },
  loss_time: { id: "loss_time", path: "loss.timeOfLoss", label: "Time of Loss" },
  loss_location: { id: "loss_location", path: "loss.address", label: "Loss Location" },
  loss_summary: { id: "loss_summary", path: "damage.summary", label: "Summary" },
  damage_emergency: { id: "damage_emergency", path: "damage.emergencyWorkNeeded", label: "Emergency", format: "boolean" },
  damage_severity: { id: "damage_severity", path: "damage.severity", label: "Severity" },
  damage_areas: { id: "damage_areas", path: "damage.affectedAreas", label: "Affected Areas" },
  damage_injuries: { id: "damage_injuries", path: "damage.injuries", label: "Injuries" },
  damage_injury_details: { id: "damage_injury_details", path: "damage.injuryDetails", label: "Injury Details" },
};
