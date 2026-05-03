import {
  createPtoBucketColumnsModel,
  type PtoBucketColumn,
} from "./buckets";
import type { VehicleRow } from "../vehicles/types";

const cycleColumnPrefix = "cycle:";

export function createPtoCycleColumns(vehicles: VehicleRow[]): PtoBucketColumn[] {
  return createPtoBucketColumnsModel(vehicles).columns.map((column) => ({
    ...column,
    key: `${cycleColumnPrefix}${column.key}`,
  }));
}
