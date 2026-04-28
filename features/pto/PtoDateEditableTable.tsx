"use client";

import type { ComponentProps, ReactNode, RefObject, UIEventHandler } from "react";
import { PtoDateEditableHeaders } from "@/features/pto/PtoDateEditableHeaders";
import { PtoDateEditableTableBody } from "@/features/pto/PtoDateEditableTableBody";
import {
  ptoDateTableLayoutStyle,
  ptoDateTableScrollStyle,
  ptoPlanTableStyle,
} from "@/features/pto/ptoDateTableStyles";

type PtoDateEditableTableProps = {
  allAreasKey: string;
  areaTabs: string[];
  bodyProps: ComponentProps<typeof PtoDateEditableTableBody>;
  formulaBar: ReactNode;
  headerProps: ComponentProps<typeof PtoDateEditableHeaders>;
  onScroll?: UIEventHandler<HTMLDivElement>;
  scrollRef: RefObject<HTMLDivElement | null>;
  tableColumns: Array<{ key: string; width: number }>;
  tableMinWidth: number;
  toolbar: ReactNode;
};

export function PtoDateEditableTable({
  allAreasKey,
  areaTabs,
  bodyProps,
  formulaBar,
  headerProps,
  onScroll,
  scrollRef,
  tableColumns,
  tableMinWidth,
  toolbar,
}: PtoDateEditableTableProps) {
  return (
    <div style={ptoDateTableLayoutStyle}>
      {toolbar}
      {formulaBar}

      <div ref={scrollRef} onScroll={onScroll} style={ptoDateTableScrollStyle}>
        <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
          <colgroup>
            {tableColumns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <PtoDateEditableHeaders {...headerProps} />
          <PtoDateEditableTableBody {...bodyProps} />
        </table>
      </div>

      <datalist id="pto-area-options">
        {areaTabs.filter((area) => area !== allAreasKey).map((area) => (
          <option key={area} value={`Уч_${area}`} />
        ))}
      </datalist>
    </div>
  );
}
