import type { AreaShiftCutoffMap } from "../admin/area-schedule";
import type { DependencyLink, DependencyNode, OrgMember } from "../admin/structure";
import type { EditableSubtabGroup, CustomTab, SubTabConfig, TopTabDefinition } from "../navigation/tabs";
import type { PtoBucketRow } from "../pto/buckets";
import type { PtoPlanRow } from "../pto/date-table";
import type { ReportCustomerConfig } from "../reports/types";
import type { VehicleRow } from "../vehicles/types";

export type UndoSnapshot = {
  reportCustomers: ReportCustomerConfig[];
  reportAreaOrder: string[];
  reportWorkOrder: Record<string, string[]>;
  reportHeaderLabels: Record<string, string>;
  reportColumnWidths: Record<string, number>;
  reportReasons: Record<string, string>;
  areaShiftCutoffs: AreaShiftCutoffMap;
  customTabs: CustomTab[];
  topTabs: TopTabDefinition[];
  subTabs: Record<EditableSubtabGroup, SubTabConfig[]>;
  vehicleRows: VehicleRow[];
  ptoManualYears: string[];
  expandedPtoMonths: Record<string, boolean>;
  ptoPlanRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoColumnWidths: Record<string, number>;
  ptoRowHeights: Record<string, number>;
  ptoHeaderLabels: Record<string, string>;
  ptoBucketValues: Record<string, number>;
  ptoBucketManualRows: PtoBucketRow[];
  orgMembers: OrgMember[];
  dependencyNodes: DependencyNode[];
  dependencyLinks: DependencyLink[];
};

export function cloneUndoSnapshot(snapshot: UndoSnapshot): UndoSnapshot {
  if (typeof structuredClone === "function") {
    return structuredClone(snapshot) as UndoSnapshot;
  }

  return JSON.parse(JSON.stringify(snapshot)) as UndoSnapshot;
}
