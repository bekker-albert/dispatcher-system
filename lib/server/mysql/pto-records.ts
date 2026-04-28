import type { RowDataPacket } from "mysql2/promise";
import type {
  PtoPersistenceBucketRowRecord,
  PtoPersistenceBucketValueRecord,
  PtoPersistenceDayValueRecord,
  PtoPersistenceRowRecord,
} from "../../domain/pto/persistence-shared";

export type PtoRowRecord = RowDataPacket & PtoPersistenceRowRecord;

export type PtoDayValueRecord = RowDataPacket & PtoPersistenceDayValueRecord;

export type PtoBucketRowRecord = RowDataPacket & PtoPersistenceBucketRowRecord;

export type PtoBucketValueRecord = RowDataPacket & PtoPersistenceBucketValueRecord;

export type PtoSettingRecord = RowDataPacket & {
  setting_key: string;
  value: unknown;
  updated_at?: string | null;
};

export type PtoSettingNextRecord = {
  setting_key: string;
  value: unknown;
  updated_at?: string | null;
};
