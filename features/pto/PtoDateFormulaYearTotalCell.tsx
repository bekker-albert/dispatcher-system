"use client";

import { PtoPlanTd } from "@/features/pto/PtoDateTableParts";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";

type PtoYearFormulaTotalCellProps = {
  rowYearTotalWithCarryover: number;
};

export function PtoYearFormulaTotalCell({ rowYearTotalWithCarryover }: PtoYearFormulaTotalCellProps) {
  return (
    <PtoPlanTd align="center">
      <div style={{ fontWeight: 800, textAlign: "center" }} title={formatPtoFormulaNumber(rowYearTotalWithCarryover)}>
        {formatPtoCellNumber(rowYearTotalWithCarryover)}
      </div>
    </PtoPlanTd>
  );
}
