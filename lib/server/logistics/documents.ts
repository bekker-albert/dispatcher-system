import { createHash, randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AuthUser } from "../../domain/auth/types";
import { isAuthUserSuperuser } from "../../domain/auth/types";
import { dbRows, dbTransaction } from "../mysql/pool";

type Meta = { ip?: string; userAgent?: string; correlationId?: string; reason?: string };

type TemplateRow = RowDataPacket & {
  template_id: string;
  template_type: string;
  name: string;
  version_no: number;
  status: "draft" | "active" | "archived";
  legal_entity: string | null;
  effective_from: Date | null;
  effective_to: Date | null;
  storage_path: string;
  mime_type: string;
  variables: string | string[];
  checksum_sha256: string;
  content_html: string;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
};

type RuleRow = RowDataPacket & {
  rule_id: string;
  name: string;
  event_code: string;
  request_kind: string | null;
  requires_business_trip: number | null;
  requires_waybill: number | null;
  requires_consignment_note: number | null;
  template_type: string;
  sequence_no: number;
  required_flag: number;
  active: number;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
};

type InstanceRow = RowDataPacket & {
  document_id: string;
  request_id: string | null;
  trip_id: string | null;
  template_id: string;
  template_version_no: number;
  document_type: string;
  status: "generated" | "signed" | "cancelled" | "superseded";
  source_snapshot: string | Record<string, unknown>;
  storage_path: string;
  mime_type: string;
  checksum_sha256: string;
  supersedes_document_id: string | null;
  generated_by_user_id: string;
  generated_at: Date;
  content_html: string;
  template_name: string;
};

type RequestSnapshotRow = RowDataPacket & {
  request_id: string;
  request_number: string;
  version: number;
  status: string;
  kind: string;
  author_user_id: string;
  author_display_name: string;
  department: string | null;
  project: string | null;
  cost_center: string | null;
  purpose: string;
  priority: string;
  desired_departure_at: Date | null;
  desired_return_at: Date | null;
  passenger_count: number | null;
  cargo_description: string | null;
  cargo_weight_kg: string | number | null;
  cargo_volume_m3: string | number | null;
  requires_business_trip: number;
  requires_waybill: number;
  requires_consignment_note: number;
  notes: string | null;
};

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function boolOrNull(value: unknown) { return value === true ? true : value === false ? false : null; }
function parseJson<T>(value: string | T): T { return typeof value === "string" ? JSON.parse(value) as T : value; }
function checksum(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }
function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function formatDate(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ru-RU");
}
function renderTemplate(source: string, snapshot: Record<string, unknown>) {
  return source.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, path: string) => {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
      return (current as Record<string, unknown>)[key];
    }, snapshot);
    return escapeHtml(value);
  });
}
async function audit(
  execute: Parameters<Parameters<typeof dbTransaction>[0]>[0],
  user: AuthUser,
  eventType: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  meta: Meta,
) {
  await execute(
    `INSERT INTO logistics_audit_events (
      audit_id, actor_user_id, actor_display_name, event_type, entity_type, entity_id,
      reason, before_snapshot, after_snapshot, source, correlation_id, request_ip, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ui', ?, ?, ?)`,
    [randomUUID(), user.id, user.displayName, eventType, entityType, entityId, meta.reason ?? null,
      before ?? null, after ?? null, meta.correlationId ?? randomUUID(), meta.ip ?? null, meta.userAgent ?? null],
  );
}
function requireManager(user: AuthUser) {
  if (!isAuthUserSuperuser(user)) throw new Error("Недостаточно прав для управления документами");
}
function mapTemplate(row: TemplateRow) {
  return {
    id: row.template_id,
    type: row.template_type,
    name: row.name,
    version: row.version_no,
    status: row.status,
    legalEntity: row.legal_entity ?? undefined,
    effectiveFrom: row.effective_from?.toISOString().slice(0, 10),
    effectiveTo: row.effective_to?.toISOString().slice(0, 10),
    variables: parseJson<string[]>(row.variables),
    checksum: row.checksum_sha256,
    contentHtml: row.content_html,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
function mapRule(row: RuleRow) {
  return {
    id: row.rule_id,
    name: row.name,
    eventCode: row.event_code,
    requestKind: row.request_kind ?? undefined,
    requiresBusinessTrip: row.requires_business_trip === null ? undefined : Boolean(row.requires_business_trip),
    requiresWaybill: row.requires_waybill === null ? undefined : Boolean(row.requires_waybill),
    requiresConsignmentNote: row.requires_consignment_note === null ? undefined : Boolean(row.requires_consignment_note),
    templateType: row.template_type,
    sequence: row.sequence_no,
    required: Boolean(row.required_flag),
    active: Boolean(row.active),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
function mapInstance(row: InstanceRow) {
  return {
    id: row.document_id,
    requestId: row.request_id ?? undefined,
    tripId: row.trip_id ?? undefined,
    templateId: row.template_id,
    templateVersion: row.template_version_no,
    templateName: row.template_name,
    documentType: row.document_type,
    status: row.status,
    sourceSnapshot: parseJson<Record<string, unknown>>(row.source_snapshot),
    contentHtml: row.content_html,
    checksum: row.checksum_sha256,
    generatedByUserId: row.generated_by_user_id,
    generatedAt: row.generated_at.toISOString(),
  };
}

export async function listDocumentTemplates() {
  const rows = await dbRows<TemplateRow>(
    `SELECT t.template_id, t.template_type, t.name, t.version_no, t.status, t.legal_entity,
      t.effective_from, t.effective_to, t.storage_path, t.mime_type, t.variables, t.checksum_sha256,
      t.created_by_user_id, t.created_at, t.updated_at, c.content_html
     FROM logistics_document_templates t
     JOIN logistics_document_template_contents c ON c.template_id = t.template_id
     ORDER BY t.template_type, t.version_no DESC`,
  );
  return rows.map(mapTemplate);
}

export async function listDocumentPackageRules() {
  const rows = await dbRows<RuleRow>(
    `SELECT rule_id, name, event_code, request_kind, requires_business_trip, requires_waybill,
      requires_consignment_note, template_type, sequence_no, required_flag, active,
      created_by_user_id, created_at, updated_at
     FROM logistics_document_package_rules ORDER BY event_code, sequence_no, created_at`,
  );
  return rows.map(mapRule);
}

export async function listDocumentInstances(user: AuthUser, limit = 100) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
  const accessClause = isAuthUserSuperuser(user)
    ? ""
    : "AND (r.author_user_id = ? OR t.driver_user_id = ?)";
  const values = isAuthUserSuperuser(user) ? [safeLimit] : [user.id, user.id, safeLimit];
  const rows = await dbRows<InstanceRow>(
    `SELECT d.document_id, d.request_id, d.trip_id, d.template_id, d.template_version_no,
      d.document_type, d.status, d.source_snapshot, d.storage_path, d.mime_type,
      d.checksum_sha256, d.supersedes_document_id, d.generated_by_user_id, d.generated_at,
      c.content_html, tpl.name AS template_name
     FROM logistics_document_instances d
     JOIN logistics_document_instance_contents c ON c.document_id = d.document_id
     JOIN logistics_document_templates tpl ON tpl.template_id = d.template_id
     LEFT JOIN logistics_requests r ON r.request_id = d.request_id
     LEFT JOIN logistics_trips t ON t.trip_id = d.trip_id
     WHERE 1=1 ${accessClause}
     ORDER BY d.generated_at DESC LIMIT ?`,
    values,
  );
  return rows.map(mapInstance);
}

export async function getDocumentBootstrap(user: AuthUser) {
  const [templates, rules, instances] = await Promise.all([
    listDocumentTemplates(),
    listDocumentPackageRules(),
    listDocumentInstances(user),
  ]);
  return { templates, rules, instances, canManage: isAuthUserSuperuser(user) };
}

export async function createDocumentTemplate(payloadValue: unknown, user: AuthUser, meta: Meta = {}) {
  requireManager(user);
  const payload = payloadValue && typeof payloadValue === "object" && !Array.isArray(payloadValue)
    ? payloadValue as Record<string, unknown> : {};
  const templateType = text(payload.templateType);
  const name = text(payload.name);
  const contentHtml = text(payload.contentHtml);
  if (!templateType) throw new Error("Укажите тип документа");
  if (!name) throw new Error("Укажите название шаблона");
  if (!contentHtml) throw new Error("Введите содержимое шаблона");
  const variables = Array.from(contentHtml.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)).map((match) => match[1]);
  const uniqueVariables = [...new Set(variables)];
  const versionRows = await dbRows<RowDataPacket & { next_version: number }>(
    "SELECT COALESCE(MAX(version_no), 0) + 1 AS next_version FROM logistics_document_templates WHERE template_type = ?",
    [templateType],
  );
  const version = Number(versionRows[0]?.next_version ?? 1);
  const templateId = randomUUID();
  const sha = checksum(contentHtml);
  const snapshot = { templateId, templateType, name, version, status: "draft", variables: uniqueVariables, checksum: sha };
  await dbTransaction(async (execute) => {
    await execute(
      `INSERT INTO logistics_document_templates (
        template_id, template_type, name, version_no, status, legal_entity, effective_from,
        effective_to, storage_path, mime_type, variables, checksum_sha256, created_by_user_id
       ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, 'text/html; charset=utf-8', ?, ?, ?)`,
      [templateId, templateType, name, version, text(payload.legalEntity) || null,
        text(payload.effectiveFrom) || null, text(payload.effectiveTo) || null,
        `db://logistics/templates/${templateId}`, JSON.stringify(uniqueVariables), sha, user.id],
    );
    await execute(
      "INSERT INTO logistics_document_template_contents (template_id, content_html) VALUES (?, ?)",
      [templateId, contentHtml],
    );
    await audit(execute, user, "document_template.created", "logistics_document_template", templateId, null, snapshot, meta);
  });
  return snapshot;
}

export async function activateDocumentTemplate(templateId: string, user: AuthUser, meta: Meta = {}) {
  requireManager(user);
  const [template] = await dbRows<TemplateRow>(
    `SELECT t.template_id, t.template_type, t.name, t.version_no, t.status, t.legal_entity,
      t.effective_from, t.effective_to, t.storage_path, t.mime_type, t.variables, t.checksum_sha256,
      t.created_by_user_id, t.created_at, t.updated_at, c.content_html
     FROM logistics_document_templates t JOIN logistics_document_template_contents c ON c.template_id = t.template_id
     WHERE t.template_id = ? LIMIT 1`, [templateId],
  );
  if (!template) throw new Error("Шаблон не найден");
  await dbTransaction(async (execute) => {
    await execute(
      "UPDATE logistics_document_templates SET status = 'archived' WHERE template_type = ? AND status = 'active' AND template_id <> ?",
      [template.template_type, templateId],
    );
    await execute("UPDATE logistics_document_templates SET status = 'active' WHERE template_id = ?", [templateId]);
    await audit(execute, user, "document_template.activated", "logistics_document_template", templateId,
      { status: template.status }, { status: "active", templateType: template.template_type, version: template.version_no }, meta);
  });
  return { templateId, status: "active" as const };
}

export async function createDocumentPackageRule(payloadValue: unknown, user: AuthUser, meta: Meta = {}) {
  requireManager(user);
  const payload = payloadValue && typeof payloadValue === "object" && !Array.isArray(payloadValue)
    ? payloadValue as Record<string, unknown> : {};
  const name = text(payload.name);
  const eventCode = text(payload.eventCode) || "approval.completed";
  const templateType = text(payload.templateType);
  if (!name) throw new Error("Укажите название правила");
  if (!templateType) throw new Error("Выберите тип шаблона");
  const ruleId = randomUUID();
  const rule = {
    ruleId, name, eventCode, templateType,
    requestKind: text(payload.requestKind) || undefined,
    requiresBusinessTrip: boolOrNull(payload.requiresBusinessTrip),
    requiresWaybill: boolOrNull(payload.requiresWaybill),
    requiresConsignmentNote: boolOrNull(payload.requiresConsignmentNote),
    sequence: Math.max(1, Math.trunc(Number(payload.sequence) || 1)),
    required: payload.required !== false,
  };
  await dbTransaction(async (execute) => {
    await execute(
      `INSERT INTO logistics_document_package_rules (
        rule_id, name, event_code, request_kind, requires_business_trip, requires_waybill,
        requires_consignment_note, template_type, sequence_no, required_flag, active, created_by_user_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [ruleId, name, eventCode, rule.requestKind ?? null, rule.requiresBusinessTrip,
        rule.requiresWaybill, rule.requiresConsignmentNote, templateType, rule.sequence, rule.required, user.id],
    );
    await audit(execute, user, "document_rule.created", "logistics_document_rule", ruleId, null, rule, meta);
  });
  return rule;
}

async function getRequestSnapshot(requestId: string, user: AuthUser) {
  const [row] = await dbRows<RequestSnapshotRow>(
    `SELECT request_id, request_number, version, status, kind, author_user_id, author_display_name,
      department, project, cost_center, purpose, priority, desired_departure_at, desired_return_at,
      passenger_count, cargo_description, cargo_weight_kg, cargo_volume_m3, requires_business_trip,
      requires_waybill, requires_consignment_note, notes
     FROM logistics_requests WHERE request_id = ? LIMIT 1`, [requestId],
  );
  if (!row) throw new Error("Заявка не найдена");
  if (row.author_user_id !== user.id && !isAuthUserSuperuser(user)) throw new Error("Недостаточно прав для формирования документов заявки");
  return {
    request: {
      id: row.request_id,
      number: row.request_number,
      version: row.version,
      status: row.status,
      kind: row.kind,
      authorUserId: row.author_user_id,
      authorDisplayName: row.author_display_name,
      department: row.department ?? "",
      project: row.project ?? "",
      costCenter: row.cost_center ?? "",
      purpose: row.purpose,
      priority: row.priority,
      desiredDepartureAt: formatDate(row.desired_departure_at),
      desiredReturnAt: formatDate(row.desired_return_at),
      passengerCount: row.passenger_count ?? "",
      cargoDescription: row.cargo_description ?? "",
      cargoWeightKg: row.cargo_weight_kg ?? "",
      cargoVolumeM3: row.cargo_volume_m3 ?? "",
      requiresBusinessTrip: Boolean(row.requires_business_trip),
      requiresWaybill: Boolean(row.requires_waybill),
      requiresConsignmentNote: Boolean(row.requires_consignment_note),
      notes: row.notes ?? "",
    },
    generated: { at: new Date().toLocaleString("ru-RU"), by: user.displayName },
  };
}

export async function generateDocumentPackage(requestId: string, user: AuthUser, meta: Meta = {}) {
  const sourceSnapshot = await getRequestSnapshot(requestId, user);
  const request = sourceSnapshot.request;
  if (request.status !== "approved" && request.status !== "planned" && request.status !== "in_progress" && request.status !== "completed") {
    throw new Error("Документы формируются только после утверждения заявки");
  }
  const rules = await dbRows<RuleRow>(
    `SELECT rule_id, name, event_code, request_kind, requires_business_trip, requires_waybill,
      requires_consignment_note, template_type, sequence_no, required_flag, active,
      created_by_user_id, created_at, updated_at
     FROM logistics_document_package_rules
     WHERE event_code = 'approval.completed' AND active = 1
       AND (request_kind IS NULL OR request_kind = ?)
       AND (requires_business_trip IS NULL OR requires_business_trip = ?)
       AND (requires_waybill IS NULL OR requires_waybill = ?)
       AND (requires_consignment_note IS NULL OR requires_consignment_note = ?)
     ORDER BY sequence_no`,
    [request.kind, request.requiresBusinessTrip, request.requiresWaybill, request.requiresConsignmentNote],
  );
  if (rules.length === 0) throw new Error("Для этой заявки не настроен комплект документов");
  const generated: Array<{ id: string; type: string; templateName: string; templateVersion: number; checksum: string }> = [];
  await dbTransaction(async (execute) => {
    for (const rule of rules) {
      const templates = await dbRows<TemplateRow>(
        `SELECT t.template_id, t.template_type, t.name, t.version_no, t.status, t.legal_entity,
          t.effective_from, t.effective_to, t.storage_path, t.mime_type, t.variables, t.checksum_sha256,
          t.created_by_user_id, t.created_at, t.updated_at, c.content_html
         FROM logistics_document_templates t
         JOIN logistics_document_template_contents c ON c.template_id = t.template_id
         WHERE t.template_type = ? AND t.status = 'active'
           AND (t.effective_from IS NULL OR t.effective_from <= CURRENT_DATE())
           AND (t.effective_to IS NULL OR t.effective_to >= CURRENT_DATE())
         ORDER BY t.version_no DESC LIMIT 1`, [rule.template_type],
      );
      const template = templates[0];
      if (!template) {
        if (rule.required_flag) throw new Error(`Нет активного шаблона обязательного документа: ${rule.template_type}`);
        continue;
      }
      const contentHtml = renderTemplate(template.content_html, sourceSnapshot as unknown as Record<string, unknown>);
      const documentId = randomUUID();
      const sha = checksum(contentHtml);
      await execute(
        `INSERT INTO logistics_document_instances (
          document_id, request_id, template_id, template_version_no, document_type, status,
          source_snapshot, storage_path, mime_type, checksum_sha256, generated_by_user_id, generated_at
         ) VALUES (?, ?, ?, ?, ?, 'generated', ?, ?, 'text/html; charset=utf-8', ?, ?, NOW(3))`,
        [documentId, requestId, template.template_id, template.version_no, template.template_type,
          JSON.stringify(sourceSnapshot), `db://logistics/documents/${documentId}`, sha, user.id],
      );
      await execute(
        "INSERT INTO logistics_document_instance_contents (document_id, content_html) VALUES (?, ?)",
        [documentId, contentHtml],
      );
      generated.push({ id: documentId, type: template.template_type, templateName: template.name, templateVersion: template.version_no, checksum: sha });
      await audit(execute, user, "document.generated", "logistics_document", documentId, null,
        { requestId, templateId: template.template_id, templateVersion: template.version_no, checksum: sha }, meta);
    }
  });
  return { requestId, documents: generated };
}
