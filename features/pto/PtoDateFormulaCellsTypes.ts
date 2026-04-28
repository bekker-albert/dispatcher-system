import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import type { PtoFormulaCell, PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaTypes";

export type PtoDateFormulaCellStateProps = {
  ptoDateEditing: boolean;
  formulaCellActive: (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => boolean;
  formulaCellEditing: (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => boolean;
  formulaCellSelected: (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => boolean;
};

export type PtoDateFormulaCellInteractionProps = {
  ptoFormulaDraft: string;
  ptoSelectionDraggingRef: RefObject<boolean>;
  formulaCellDomKey: (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => string;
  selectFormulaCell: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  selectFormulaRange: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  startInlineFormulaEdit: (cell: PtoFormulaCellWithoutScope, value: number | undefined, draftOverride?: string) => void;
  commitInlineFormulaEdit: () => void;
  updateFormulaValue: (value: string) => void;
  handleFormulaCellMouseDown: (
    event: MouseEvent<HTMLElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => void;
  handleFormulaCellMouseEnter: (
    event: MouseEvent<HTMLElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => void;
  handleFormulaCellKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => void;
};
