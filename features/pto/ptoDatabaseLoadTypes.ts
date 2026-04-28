import type { Dispatch, SetStateAction } from "react";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import type { PtoDatabaseState } from "@/features/pto/ptoPersistenceModel";

export type MutableRef<T> = {
  current: T;
};

export type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

export type PtoDatabaseLoadOptions = {
  adminDataLoaded: boolean;
  ptoTab: string;
  ptoPlanYear: string;
  ptoDatabaseStateRef: MutableRef<PtoDatabaseState>;
  hasStoredPtoStateRef: MutableRef<boolean>;
  ptoDatabaseLoadedRef: MutableRef<boolean>;
  ptoDatabaseLoadedYearRef: MutableRef<string | null>;
  ptoDatabaseLoadedBucketsYearRef: MutableRef<string | null>;
  ptoDatabaseFullSaveNextRef: MutableRef<boolean>;
  ptoDatabaseSaveSnapshotRef: MutableRef<string>;
  resetUndoHistoryForExternalRestore: () => void;
  showSaveStatus: ShowSaveStatus;
  setPtoDatabaseReady: Dispatch<SetStateAction<boolean>>;
  setPtoDatabaseMessage: Dispatch<SetStateAction<string>>;
  setPtoSaveRevision: Dispatch<SetStateAction<number>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  setPtoTab: Dispatch<SetStateAction<string>>;
  setPtoPlanYear: Dispatch<SetStateAction<string>>;
  setPtoAreaFilter: Dispatch<SetStateAction<string>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
};
