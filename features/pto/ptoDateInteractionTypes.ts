import type { PtoDropPosition } from "../../lib/domain/pto/date-table";

export type PtoDropTarget = {
  rowId: string;
  position: PtoDropPosition;
};

export type PtoResizeState =
  | { type: "column"; key: string; startX: number; startWidth: number }
  | { type: "row"; key: string; startY: number; startHeight: number };
