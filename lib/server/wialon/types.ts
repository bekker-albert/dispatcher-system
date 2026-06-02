export type WialonUnit = {
  id: number;
  name: string;
  uniqueId: string;
  phone: string;
  position: WialonPosition | null;
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
