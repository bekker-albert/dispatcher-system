export type WialonTelemetryTrust = "trusted" | "diagnostic" | "not-configured";

export type WialonTelemetry = {
  lastSignalAt: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  satellites: number | null;
  mileage: number | null;
  mileageSource: string | null;
  mileageTrust: WialonTelemetryTrust;
  canMileage: number | null;
  canMileageSource: string | null;
  canMileageTrust: WialonTelemetryTrust;
  engineHours: number | null;
  engineHoursSource: string | null;
  engineHoursTrust: WialonTelemetryTrust;
  engineOn: boolean | null;
  engineRpm: number | null;
  fuelLevel: number | null;
  fuelLevelSource: string | null;
  fuelLevelTrust: WialonTelemetryTrust;
  rawFuelLevel: number | null;
  rawFuelLevelSource: string | null;
  externalVoltage: number | null;
  internalVoltage: number | null;
  gsmLevel: number | null;
  validNavigation: boolean | null;
};

export type WialonUnit = {
  id: number;
  name: string;
  uniqueId: string;
  phone: string;
  position: WialonPosition | null;
  telemetry: WialonTelemetry;
  raw: Record<string, unknown>;
};

export type WialonPosition = {
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  course: number | null;
  altitude: number | null;
  time: string | null;
  raw: Record<string, unknown>;
};

export type StoredWialonUnit = WialonUnit & {
  vehicleId: number | null;
  hidden: boolean;
  syncedAt: string | null;
  updatedAt: string | null;
};

export type WialonUnitMappingInput = {
  wialonUnitId: number;
  vehicleId?: number | null;
  hidden?: boolean;
};

export type WialonSyncLog = {
  id: number;
  syncType: string;
  status: string;
  message: string;
  details: unknown;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
};
