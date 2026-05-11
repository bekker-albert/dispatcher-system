import type { VersionedEntityReference } from "@/lib/domain/editing/patchEditing";

export type SmtsTerminalStatus = "warehouse" | "installed" | "removed" | "transferred" | "faulty" | "repair" | "written_off" | "reserve";
export type SmtsSimCardStatus = "warehouse" | "active" | "installed" | "blocked" | "lost" | "replaced" | "written_off";
export type SmtsMountingEventType = "install" | "remove" | "transfer" | "replace" | "diagnostics";
export type EcoDrivingEventType = "speeding" | "hard_acceleration" | "hard_braking" | "hard_cornering" | "no_seatbelt" | "no_lights" | "idle";
export type EcoDrivingMailingStatus = "draft" | "queued" | "sent" | "failed" | "cancelled";
export type FuelDrainCheckStatus = "new" | "reviewing" | "confirmed" | "not_confirmed" | "sensor_error" | "closed";

export type SmtsVehicleCard = VersionedEntityReference & {
  vehicleId: string;
  terminalInstalled: boolean;
  terminalId?: string;
  imei?: string;
  terminalModel?: string;
  simCardId?: string;
  wialonId?: string;
  installedAt?: string;
  removedAt?: string;
  installerId?: string;
  lightsConnected: boolean;
  seatbeltConnected: boolean;
  fuelSensorInstalled: boolean;
  fuelSensorLength?: number;
  canConnected: boolean;
  rpmConnected: boolean;
  engineHoursReadable: boolean;
  mileageReadable: boolean;
  ecoDrivingConfigured: boolean;
  buzzerInstalled: boolean;
  comment?: string;
};

export type SmtsTerminal = VersionedEntityReference & {
  imei: string;
  model: string;
  status: SmtsTerminalStatus;
  currentVehicleId?: string;
  currentSimCardId?: string;
};

export type SmtsSimCard = VersionedEntityReference & {
  phoneNumber: string;
  provider: string;
  status: SmtsSimCardStatus;
  currentTerminalId?: string;
};

export type SmtsMountingEvent = VersionedEntityReference & {
  eventType: SmtsMountingEventType;
  vehicleId: string;
  terminalId?: string;
  simCardId?: string;
  installerId: string;
  eventDate: string;
  relatedRequest1cId?: string;
  comment?: string;
};

export type EcoDrivingEvent = VersionedEntityReference & {
  periodStart: string;
  periodEnd: string;
  sectionId: string;
  driverId: string;
  vehicleId: string;
  eventType: EcoDrivingEventType;
  count: number;
  mailingId?: string;
};

export type EcoDrivingMailing = VersionedEntityReference & {
  periodStart: string;
  periodEnd: string;
  sectionId: string;
  recipientUserIds: string[];
  status: EcoDrivingMailingStatus;
  createdBy: string;
  sentAt?: string;
};

export type FuelDrainEvent = VersionedEntityReference & {
  vehicleId: string;
  sectionId: string;
  detectedAt: string;
  litersDelta: number;
  reasonCode: "sharp_drop" | "outside_zone" | "without_waybill" | "night" | "level_not_increased" | "parking_drop";
  status: FuelDrainCheckStatus;
  checkedBy?: string;
};

export type ContractorMonitoringAccess = VersionedEntityReference & {
  contractorId: string;
  userId: string;
  system: string;
  visibleVehicleIds: string[];
  validFrom: string;
  validTo: string;
  approvedBy?: string;
  issuedAt?: string;
  disabledAt?: string;
  status: "draft" | "active" | "expired" | "disabled" | "cancelled";
};
