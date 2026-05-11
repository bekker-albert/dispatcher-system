import type { EcoDrivingEvent, EcoDrivingEventType } from "./service-contracts";

export type EcoDrivingSeverity = "watch" | "warning" | "critical";

export type EcoDrivingViolationRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  sectionId: string;
  driverId: string;
  vehicleId: string;
  eventCounts: Record<EcoDrivingEventType, number>;
  totalCount: number;
  severity: EcoDrivingSeverity;
};

export type EcoDrivingMailingDraftInput = {
  periodStart: string;
  periodEnd: string;
  sectionId: string;
  recipientUserIds: readonly string[];
  events: readonly EcoDrivingEvent[];
  createdBy: string;
  minTotalCount?: number;
};

export type EcoDrivingMailingDraftResult =
  | {
      ok: true;
      draft: {
        entityType: "eco_driving_mailing";
        periodStart: string;
        periodEnd: string;
        sectionId: string;
        recipientUserIds: string[];
        status: "draft";
        createdBy: string;
        violationRows: EcoDrivingViolationRow[];
        createsQueuedSendRequest: true;
      };
    }
  | {
      ok: false;
      rejection: {
        code: "recipient_required" | "no_violations";
        message: string;
      };
    };

const ecoDrivingEventTypes: EcoDrivingEventType[] = [
  "speeding",
  "hard_acceleration",
  "hard_braking",
  "hard_cornering",
  "no_seatbelt",
  "no_lights",
  "idle",
];

const createEmptyEventCounts = (): Record<EcoDrivingEventType, number> => ({
  speeding: 0,
  hard_acceleration: 0,
  hard_braking: 0,
  hard_cornering: 0,
  no_seatbelt: 0,
  no_lights: 0,
  idle: 0,
});

const createEcoDrivingRowKey = (
  event: Pick<EcoDrivingEvent, "periodStart" | "periodEnd" | "sectionId" | "driverId" | "vehicleId">,
) => [
  event.periodStart,
  event.periodEnd,
  event.sectionId,
  event.driverId,
  event.vehicleId,
].join("|");

const getEcoDrivingSeverity = (totalCount: number): EcoDrivingSeverity => {
  if (totalCount >= 10) return "critical";
  if (totalCount >= 5) return "warning";
  return "watch";
};

export function buildEcoDrivingViolationRows(
  events: readonly EcoDrivingEvent[],
  minTotalCount = 1,
): EcoDrivingViolationRow[] {
  const rowsByKey = new Map<string, EcoDrivingViolationRow>();

  for (const event of events) {
    const key = createEcoDrivingRowKey(event);
    const current = rowsByKey.get(key) ?? {
      id: key,
      periodStart: event.periodStart,
      periodEnd: event.periodEnd,
      sectionId: event.sectionId,
      driverId: event.driverId,
      vehicleId: event.vehicleId,
      eventCounts: createEmptyEventCounts(),
      totalCount: 0,
      severity: "watch" as const,
    };

    current.eventCounts[event.eventType] += event.count;
    current.totalCount += event.count;
    current.severity = getEcoDrivingSeverity(current.totalCount);
    rowsByKey.set(key, current);
  }

  return [...rowsByKey.values()]
    .filter((row) => row.totalCount >= minTotalCount)
    .sort((left, right) => (
      right.totalCount - left.totalCount
      || left.sectionId.localeCompare(right.sectionId)
      || left.driverId.localeCompare(right.driverId)
      || left.vehicleId.localeCompare(right.vehicleId)
    ));
}

export function createEcoDrivingMailingDraft({
  periodStart,
  periodEnd,
  sectionId,
  recipientUserIds,
  events,
  createdBy,
  minTotalCount,
}: EcoDrivingMailingDraftInput): EcoDrivingMailingDraftResult {
  const uniqueRecipientUserIds = [...new Set(recipientUserIds.filter((recipient) => recipient.trim()))];
  if (uniqueRecipientUserIds.length === 0) {
    return {
      ok: false,
      rejection: {
        code: "recipient_required",
        message: "Eco-driving mailing requires at least one recipient.",
      },
    };
  }

  const boundedEvents = events.filter((event) => (
    event.sectionId === sectionId
    && event.periodStart === periodStart
    && event.periodEnd === periodEnd
    && ecoDrivingEventTypes.includes(event.eventType)
  ));
  const violationRows = buildEcoDrivingViolationRows(boundedEvents, minTotalCount);
  if (violationRows.length === 0) {
    return {
      ok: false,
      rejection: {
        code: "no_violations",
        message: "Eco-driving mailing has no violations for the selected bounded period.",
      },
    };
  }

  return {
    ok: true,
    draft: {
      entityType: "eco_driving_mailing",
      periodStart,
      periodEnd,
      sectionId,
      recipientUserIds: uniqueRecipientUserIds,
      status: "draft",
      createdBy,
      violationRows,
      createsQueuedSendRequest: true,
    },
  };
}
