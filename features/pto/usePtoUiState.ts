"use client";

import { useRef, useState } from "react";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";
import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";
import { emptyPtoDraftRowFields } from "@/lib/domain/pto/date-table";

export function usePtoUiState() {
  const [draggedPtoRowId, setDraggedPtoRowId] = useState<string | null>(null);
  const [ptoDropTarget, setPtoDropTarget] = useState<PtoDropTarget | null>(null);
  const [ptoFormulaCell, setPtoFormulaCell] = useState<PtoFormulaCell | null>(null);
  const [ptoFormulaDraft, setPtoFormulaDraft] = useState("");
  const [ptoInlineEditCell, setPtoInlineEditCell] = useState<PtoFormulaCell | null>(null);
  const [ptoInlineEditInitialDraft, setPtoInlineEditInitialDraft] = useState("");
  const [ptoSelectionAnchorCell, setPtoSelectionAnchorCell] = useState<PtoFormulaCell | null>(null);
  const [ptoSelectedCellKeys, setPtoSelectedCellKeys] = useState<string[]>([]);
  const [ptoDateEditing, setPtoDateEditing] = useState(false);
  const [hoveredPtoAddRowId, setHoveredPtoAddRowId] = useState<string | null>(null);
  const [ptoPendingFieldFocus, setPtoPendingFieldFocus] = useState<{ rowId: string; field: string } | null>(null);
  const [ptoRowFieldDrafts, setPtoRowFieldDrafts] = useState<Record<string, string>>({});
  const [ptoDraftRowFields, setPtoDraftRowFields] = useState(() => ({ ...emptyPtoDraftRowFields }));
  const ptoSelectionDraggingRef = useRef(false);
  const ptoPlanImportInputRef = useRef<HTMLInputElement | null>(null);
  const hasStoredPtoStateRef = useRef(false);
  const ptoDatabaseLoadedRef = useRef(false);

  return {
    draggedPtoRowId,
    setDraggedPtoRowId,
    ptoDropTarget,
    setPtoDropTarget,
    ptoFormulaCell,
    setPtoFormulaCell,
    ptoFormulaDraft,
    setPtoFormulaDraft,
    ptoInlineEditCell,
    setPtoInlineEditCell,
    ptoInlineEditInitialDraft,
    setPtoInlineEditInitialDraft,
    ptoSelectionAnchorCell,
    setPtoSelectionAnchorCell,
    ptoSelectedCellKeys,
    setPtoSelectedCellKeys,
    ptoDateEditing,
    setPtoDateEditing,
    hoveredPtoAddRowId,
    setHoveredPtoAddRowId,
    ptoPendingFieldFocus,
    setPtoPendingFieldFocus,
    ptoRowFieldDrafts,
    setPtoRowFieldDrafts,
    ptoDraftRowFields,
    setPtoDraftRowFields,
    ptoSelectionDraggingRef,
    ptoPlanImportInputRef,
    hasStoredPtoStateRef,
    ptoDatabaseLoadedRef,
  };
}
