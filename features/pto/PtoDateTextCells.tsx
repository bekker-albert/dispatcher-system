"use client";

import { PtoDateEditableTextCell } from "@/features/pto/PtoDateEditableTextCell";
import { PtoPlanTd, PtoStatusCell, PtoUnitCell } from "@/features/pto/PtoDateTableParts";
import type { PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import type { PtoRowTextField } from "@/features/pto/usePtoRowTextDrafts";
import { ptoRowFieldDomKey, type PtoPlanRow, type PtoStatus } from "@/lib/domain/pto/date-table";

type PtoDateTextCellsProps = {
  row: PtoPlanRow;
  ptoDateEditing: boolean;
  showLocation: boolean;
  locationListId: string;
  structureListId: string;
  locationOptions: string[];
  structureOptions: string[];
  rowStatus: PtoStatus;
  setRows: PtoRowsSetter;
  requestPtoDatabaseSave: () => void;
  updatePtoDateRow: (setRows: PtoRowsSetter, id: string, field: keyof Omit<PtoPlanRow, "id" | "dailyPlans">, value: string) => void;
  beginPtoRowTextDraft: (row: PtoPlanRow, field: PtoRowTextField) => void;
  getPtoRowTextDraft: (row: PtoPlanRow, field: PtoRowTextField) => string;
  updatePtoRowTextDraft: (rowId: string, field: PtoRowTextField, value: string) => void;
  commitPtoRowTextDraft: (setRows: PtoRowsSetter, row: PtoPlanRow, field: PtoRowTextField) => void;
  cancelPtoRowTextDraft: (rowId: string, field: PtoRowTextField) => void;
};

export function PtoDateTextCells({
  row,
  ptoDateEditing,
  showLocation,
  locationListId,
  structureListId,
  locationOptions,
  structureOptions,
  rowStatus,
  setRows,
  requestPtoDatabaseSave,
  updatePtoDateRow,
  beginPtoRowTextDraft,
  getPtoRowTextDraft,
  updatePtoRowTextDraft,
  commitPtoRowTextDraft,
  cancelPtoRowTextDraft,
}: PtoDateTextCellsProps) {
  return (
    <>
      {showLocation ? (
        <PtoPlanTd>
          <PtoDateEditableTextCell
            editing={ptoDateEditing}
            value={row.location}
            draftValue={getPtoRowTextDraft(row, "location")}
            dataFieldKey={ptoRowFieldDomKey(row.id, "location")}
            listId={locationListId}
            options={locationOptions}
            placeholder="Карьер"
            onBeginDraft={() => beginPtoRowTextDraft(row, "location")}
            onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "location", value)}
            onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "location")}
            onCancelDraft={() => cancelPtoRowTextDraft(row.id, "location")}
          />
        </PtoPlanTd>
      ) : null}
      <PtoPlanTd>
        <PtoDateEditableTextCell
          editing={ptoDateEditing}
          value={row.structure}
          draftValue={getPtoRowTextDraft(row, "structure")}
          dataFieldKey={ptoRowFieldDomKey(row.id, "structure")}
          listId={structureListId}
          options={structureOptions}
          placeholder="Вид работ"
          onBeginDraft={() => beginPtoRowTextDraft(row, "structure")}
          onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "structure", value)}
          onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "structure")}
          onCancelDraft={() => cancelPtoRowTextDraft(row.id, "structure")}
        />
      </PtoPlanTd>
      <PtoPlanTd align="center">
        <PtoUnitCell
          editing={ptoDateEditing}
          value={row.unit}
          dataFieldKey={ptoRowFieldDomKey(row.id, "unit")}
          onChange={(value) => {
            updatePtoDateRow(setRows, row.id, "unit", value);
            requestPtoDatabaseSave();
          }}
        />
      </PtoPlanTd>
      <PtoPlanTd align="center">
        <PtoStatusCell status={rowStatus} />
      </PtoPlanTd>
    </>
  );
}
