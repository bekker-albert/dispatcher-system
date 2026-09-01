export type LogisticsRequestStatus =
  | "draft"
  | "submitted"
  | "returned"
  | "approved"
  | "rejected"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type LogisticsTripStatus =
  | "planned"
  | "release_pending"
  | "ready"
  | "in_progress"
  | "closing"
  | "completed"
  | "cancelled";

export type LogisticsRequestKind = "passengers" | "cargo" | "documents" | "mixed";
export type LogisticsStopType = "origin" | "loading" | "waypoint" | "unloading" | "destination";

export type LogisticsDataScope = "own" | "department" | "project" | "company";

export type LogisticsPermission = {
  module: string;
  action: string;
  scope: LogisticsDataScope;
  conditions?: Record<string, unknown>;
};

export type LogisticsRequestInput = {
  kind: LogisticsRequestKind;
  purpose: string;
  project?: string;
  department?: string;
  costCenter?: string;
  priority?: "normal" | "urgent" | "critical";
  desiredDepartureAt?: string;
  desiredReturnAt?: string;
  requiresBusinessTrip?: boolean;
  requiresWaybill?: boolean;
  requiresConsignmentNote?: boolean;
  passengerCount?: number;
  cargoDescription?: string;
  cargoWeightKg?: number;
  cargoVolumeM3?: number;
  notes?: string;
  stops: Array<{
    sequence: number;
    type: string;
    name: string;
    address?: string;
    plannedAt?: string;
  }>;
};

export type LogisticsRequestRecord = LogisticsRequestInput & {
  id: string;
  number: string;
  version: number;
  status: LogisticsRequestStatus;
  authorUserId: string;
  authorDisplayName: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LogisticsApprovalDecision = "pending" | "approved" | "returned" | "rejected" | "skipped";

export type LogisticsApprovalStepRecord = {
  id: string;
  approvalId: string;
  sequence: number;
  name: string;
  roleCode: string;
  assigneeUserId?: string;
  decision: LogisticsApprovalDecision;
  comment?: string;
  deadlineAt?: string;
  decidedAt?: string;
};

export type LogisticsTripRecord = {
  id: string;
  number: string;
  status: LogisticsTripStatus;
  requestId?: string;
  requestNumber?: string;
  vehicleId?: string;
  driverUserId?: string;
  plannedDepartureAt?: string;
  plannedReturnAt?: string;
  actualDepartureAt?: string;
  actualReturnAt?: string;
  plannedDistanceKm?: number;
  actualDistanceKm?: number;
  plannedFuelLiters?: number;
  actualFuelLiters?: number;
  createdAt: string;
  updatedAt: string;
};

export type LogisticsDocumentTemplateStatus = "draft" | "active" | "archived";
export type LogisticsDocumentInstanceStatus = "generated" | "signed" | "cancelled" | "superseded";

export type LogisticsConfigPublicationStatus = "draft" | "published" | "archived";

export type LogisticsAuditEvent = {
  id: string;
  actorUserId: string;
  actorDisplayName: string;
  eventType: string;
  entityType: string;
  entityId: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
  source: "ui" | "import" | "integration" | "ai" | "system";
  correlationId: string;
  createdAt: string;
};

export const logisticsRequestStatusLabels: Record<LogisticsRequestStatus, string> = {
  draft: "Черновик",
  submitted: "На согласовании",
  returned: "Возвращена",
  approved: "Согласована",
  rejected: "Отклонена",
  planned: "Запланирована",
  in_progress: "Выполняется",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const logisticsTripStatusLabels: Record<LogisticsTripStatus, string> = {
  planned: "Запланирован",
  release_pending: "Ожидает выпуска",
  ready: "Готов к выезду",
  in_progress: "В пути",
  closing: "Ожидает закрытия",
  completed: "Завершён",
  cancelled: "Отменён",
};
