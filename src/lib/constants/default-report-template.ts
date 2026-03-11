import type { ReportTemplate } from "@/lib/types/report-template";

export const DEFAULT_REPORT_TEMPLATE: ReportTemplate = {
  version: 1,
  sections: [
    {
      id: "summary",
      title: "Summary",
      enabled: true,
      order: 1,
      fields: [
        { id: "claim_summary", path: "claim.summary", label: "Claim Summary", enabled: true, order: 1 },
      ],
    },
    {
      id: "call",
      title: "Call Information",
      enabled: true,
      order: 2,
      fields: [
        { id: "call_datetime", path: "call.startTime", label: "Date/Time", enabled: true, order: 1, format: "date" },
        { id: "call_duration", path: "call.durationSeconds", label: "Duration", enabled: true, order: 2, format: "duration" },
        { id: "call_mode", path: "mode", label: "Mode", enabled: true, order: 3 },
      ],
    },
    {
      id: "caller",
      title: "Caller Information",
      enabled: true,
      order: 3,
      fields: [
        { id: "caller_name", path: "caller.name", label: "Name", enabled: true, order: 1 },
        { id: "caller_phone", path: "caller.callbackNumber", label: "Phone", enabled: true, order: 2, format: "phone" },
        { id: "caller_email", path: "caller.email", label: "Email", enabled: true, order: 3 },
        { id: "caller_relationship", path: "caller.relationship", label: "Relationship", enabled: true, order: 4 },
        { id: "caller_language", path: "caller.language", label: "Language", enabled: true, order: 5 },
      ],
    },
    {
      id: "policy",
      title: "Policy Details",
      enabled: true,
      order: 4,
      fields: [
        { id: "policy_number", path: "policy.policyNumber", label: "Policy Number", enabled: true, order: 1 },
        { id: "policy_carrier", path: "policy.carrier", label: "Carrier", enabled: true, order: 2 },
        { id: "policy_effective", path: "policy.effectiveDate", label: "Effective Date", enabled: true, order: 3, format: "date" },
        { id: "policy_expiration", path: "policy.expirationDate", label: "Expiration Date", enabled: true, order: 4, format: "date" },
        { id: "policy_coverage", path: "policy.coverageType", label: "Coverage Type", enabled: true, order: 5 },
        { id: "policy_lob", path: "policy.lineOfBusiness", label: "Line of Business", enabled: true, order: 6 },
      ],
    },
    {
      id: "loss",
      title: "Loss Details",
      enabled: true,
      order: 5,
      fields: [
        { id: "loss_type", path: "loss.type", label: "Type of Loss", enabled: true, order: 1 },
        { id: "loss_cause", path: "loss.cause", label: "Cause of Loss", enabled: true, order: 2 },
        { id: "loss_date", path: "loss.dateTime", label: "Date of Loss", enabled: true, order: 3, format: "date" },
        { id: "loss_time", path: "loss.timeOfLoss", label: "Time of Loss", enabled: true, order: 4 },
        { id: "loss_location", path: "loss.address", label: "Loss Location", enabled: true, order: 5 },
        { id: "loss_summary", path: "damage.summary", label: "Summary", enabled: true, order: 6 },
      ],
    },
    {
      id: "damage",
      title: "Damage Assessment",
      enabled: true,
      order: 6,
      fields: [
        { id: "damage_emergency", path: "damage.emergencyWorkNeeded", label: "Emergency", enabled: true, order: 1, format: "boolean" },
        { id: "damage_severity", path: "damage.severity", label: "Severity", enabled: true, order: 2 },
        { id: "damage_areas", path: "damage.affectedAreas", label: "Affected Areas", enabled: true, order: 3 },
        { id: "damage_injuries", path: "damage.injuries", label: "Injuries", enabled: true, order: 4 },
        { id: "damage_injury_details", path: "damage.injuryDetails", label: "Injury Details", enabled: true, order: 5 },
      ],
    },
  ],
};

export const DEFAULT_SECTIONS = [
  { id: "summary", title: "Summary" },
  { id: "call", title: "Call Information" },
  { id: "caller", title: "Caller Information" },
  { id: "policy", title: "Policy Details" },
  { id: "loss", title: "Loss Details" },
  { id: "damage", title: "Damage Assessment" },
];
