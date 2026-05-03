import {
  bucketAreaColumnWidth,
  bucketRowHeight,
  bucketValueColumnWidth,
} from "./ptoBucketsConfig";

export const performanceAreaColumnWidth = bucketAreaColumnWidth;
export const performanceStructureColumnWidth = 260;
export const performanceUnitColumnWidth = 64;
export const performanceFrozenWidth = performanceAreaColumnWidth
  + performanceStructureColumnWidth
  + performanceUnitColumnWidth;
export const performanceComputedColumnWidth = 90;
export const performanceRowHeight = bucketRowHeight;
export const performanceFrozenColumnCount = 3;

export function ptoPerformanceTableMinWidth(columnCount: number) {
  return performanceFrozenWidth
    + Math.max(1, columnCount) * bucketValueColumnWidth
    + performanceComputedColumnWidth;
}
