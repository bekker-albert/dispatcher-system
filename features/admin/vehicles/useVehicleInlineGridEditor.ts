import {
  useCallback,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import {
  parseVehicleInlineFieldDomKey,
  vehicleFieldIsNumeric,
  vehicleInlineFieldDomKey,
  vehicleInlineFields,
  type VehicleInlineField,
} from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  editableGridArrowOffset,
  editableGridKeyAtOffset,
  editableGridRangeKeys,
  isEditableGridArrowKey,
  toggleEditableGridSelectionKey,
} from "@/shared/editable-grid/selection";
import { vehicleFilterColumns } from "./vehicleFilterColumns";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type VehicleCell = {
  id: number;
  field: VehicleInlineField;
};

type PendingVehicleFocus = VehicleCell & {
  edit?: boolean;
  selectContents?: boolean;
};

type UseVehicleInlineGridEditorOptions = {
  vehicleRows: VehicleRow[];
  visibleVehicleRows: VehicleRow[];
  activeVehicleCell: string | null;
  selectedVehicleCellKeys: string[];
  editingVehicleCell: string | null;
  vehicleCellDraft: string;
  vehicleCellInitialDraft: string;
  vehicleSelectionAnchorCell: VehicleCell | null;
  vehicleCellSkipBlurCommitRef: MutableRefObject<boolean>;
  vehicleSelectionDraggingRef: MutableRefObject<boolean>;
  vehicleSelectionAnchorRef: MutableRefObject<VehicleCell | null>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setActiveVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleSelectionAnchorCell: Dispatch<SetStateAction<VehicleCell | null>>;
  setSelectedVehicleCellKeys: Dispatch<SetStateAction<string[]>>;
  setEditingVehicleCell: Dispatch<SetStateAction<string | null>>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  setVehicleCellInitialDraft: Dispatch<SetStateAction<string>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  updateVehicleRow: (id: number, field: VehicleInlineField, value: string) => void;
  pushVehicleUndoSnapshot: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useVehicleInlineGridEditor({
  vehicleRows,
  visibleVehicleRows,
  activeVehicleCell,
  selectedVehicleCellKeys,
  editingVehicleCell,
  vehicleCellDraft,
  vehicleCellInitialDraft,
  vehicleSelectionAnchorCell,
  vehicleCellSkipBlurCommitRef,
  vehicleSelectionDraggingRef,
  vehicleSelectionAnchorRef,
  setVehicleRows,
  setActiveVehicleCell,
  setVehicleSelectionAnchorCell,
  setSelectedVehicleCellKeys,
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setPendingVehicleFocus,
  updateVehicleRow,
  pushVehicleUndoSnapshot,
  addAdminLog,
}: UseVehicleInlineGridEditorOptions) {
  const vehicleCellValue = useCallback((id: number, field: VehicleInlineField) => {
    const vehicle = vehicleRows.find((item) => item.id === id);
    return String(vehicle?.[field] ?? "");
  }, [vehicleRows]);

  const vehicleCellRangeKeys = useCallback((anchor: VehicleCell, target: VehicleCell) => {
    const vehicleGridKeys = visibleVehicleRows.map((vehicle) => (
      vehicleInlineFields.map((inlineField) => vehicleInlineFieldDomKey(vehicle.id, inlineField))
    ));

    return editableGridRangeKeys(
      vehicleGridKeys,
      vehicleInlineFieldDomKey(anchor.id, anchor.field),
      vehicleInlineFieldDomKey(target.id, target.field),
    );
  }, [visibleVehicleRows]);

  const selectVehicleInlineCell = useCallback((id: number, field: VehicleInlineField, event?: MouseEvent<HTMLElement>) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    const targetCell = { id, field };

    setActiveVehicleCell(fieldKey);
    setEditingVehicleCell((current) => (current === fieldKey ? current : null));

    if (event?.ctrlKey || event?.metaKey) {
      vehicleSelectionAnchorRef.current = targetCell;
      setVehicleSelectionAnchorCell(targetCell);
      setSelectedVehicleCellKeys((currentKeys) => toggleEditableGridSelectionKey(currentKeys, fieldKey));
      return;
    }

    if (event?.shiftKey && vehicleSelectionAnchorCell) {
      setSelectedVehicleCellKeys(vehicleCellRangeKeys(vehicleSelectionAnchorCell, targetCell));
      return;
    }

    vehicleSelectionAnchorRef.current = targetCell;
    setVehicleSelectionAnchorCell(targetCell);
    setSelectedVehicleCellKeys([fieldKey]);
  }, [
    setActiveVehicleCell,
    setEditingVehicleCell,
    setSelectedVehicleCellKeys,
    setVehicleSelectionAnchorCell,
    vehicleCellRangeKeys,
    vehicleSelectionAnchorCell,
    vehicleSelectionAnchorRef,
  ]);

  const extendVehicleInlineSelection = useCallback((id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => {
    if (!vehicleSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey) return;

    const targetCell = { id, field };
    const anchorCell = vehicleSelectionAnchorRef.current ?? vehicleSelectionAnchorCell ?? targetCell;
    setActiveVehicleCell(vehicleInlineFieldDomKey(id, field));
    setEditingVehicleCell(null);
    setSelectedVehicleCellKeys(vehicleCellRangeKeys(anchorCell, targetCell));
  }, [
    setActiveVehicleCell,
    setEditingVehicleCell,
    setSelectedVehicleCellKeys,
    vehicleCellRangeKeys,
    vehicleSelectionAnchorCell,
    vehicleSelectionAnchorRef,
    vehicleSelectionDraggingRef,
  ]);

  const startVehicleInlineSelection = useCallback((id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    vehicleSelectionDraggingRef.current = true;
    selectVehicleInlineCell(id, field, event);
  }, [selectVehicleInlineCell, vehicleSelectionDraggingRef]);

  const startVehicleInlineCellEdit = useCallback((id: number, field: VehicleInlineField, draftOverride?: string) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    const currentValue = vehicleCellValue(id, field);
    const draft = draftOverride ?? currentValue;

    vehicleCellSkipBlurCommitRef.current = false;
    setActiveVehicleCell(fieldKey);
    vehicleSelectionAnchorRef.current = { id, field };
    setVehicleSelectionAnchorCell({ id, field });
    setSelectedVehicleCellKeys([fieldKey]);
    setEditingVehicleCell(fieldKey);
    setVehicleCellDraft(draft);
    setVehicleCellInitialDraft(currentValue);
    setPendingVehicleFocus({ id, field, edit: true, selectContents: draftOverride === undefined });
  }, [
    setActiveVehicleCell,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setVehicleSelectionAnchorCell,
    vehicleCellSkipBlurCommitRef,
    vehicleCellValue,
    vehicleSelectionAnchorRef,
  ]);

  const commitVehicleInlineCellEdit = useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    setEditingVehicleCell((current) => (current === fieldKey ? null : current));
    if (vehicleCellDraft !== vehicleCellInitialDraft) {
      updateVehicleRow(id, field, vehicleCellDraft);
      const vehicle = vehicleRows.find((item) => item.id === id);
      addAdminLog({
        action: "Редактирование",
        section: "Техника",
        details: `Изменено поле "${vehicleFilterColumns.find((column) => column.key === field)?.label ?? field}"${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
      });
    }
    setVehicleCellInitialDraft("");
  }, [addAdminLog, setEditingVehicleCell, setVehicleCellInitialDraft, updateVehicleRow, vehicleCellDraft, vehicleCellInitialDraft, vehicleRows]);

  const cancelVehicleInlineCellEdit = useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);
    vehicleCellSkipBlurCommitRef.current = true;
    setVehicleCellDraft(vehicleCellInitialDraft);
    setVehicleCellInitialDraft("");
    setEditingVehicleCell((current) => (current === fieldKey ? null : current));
    setPendingVehicleFocus({ id, field });
  }, [
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    vehicleCellInitialDraft,
    vehicleCellSkipBlurCommitRef,
  ]);

  const focusVehicleInlineCell = useCallback((id: number, field: VehicleInlineField, edit = false) => {
    setPendingVehicleFocus({ id, field, edit });
  }, [setPendingVehicleFocus]);

  const clearSelectedVehicleCells = useCallback((id: number, field: VehicleInlineField) => {
    const fallbackKey = vehicleInlineFieldDomKey(id, field);
    const targetKeys = selectedVehicleCellKeys.length ? selectedVehicleCellKeys : [fallbackKey];
    const targetFieldsById = new Map<number, Set<VehicleInlineField>>();

    targetKeys.forEach((key) => {
      const parsedCell = parseVehicleInlineFieldDomKey(key);
      if (!parsedCell) return;

      const fields = targetFieldsById.get(parsedCell.vehicleId) ?? new Set<VehicleInlineField>();
      fields.add(parsedCell.field);
      targetFieldsById.set(parsedCell.vehicleId, fields);
    });

    pushVehicleUndoSnapshot();
    setVehicleRows((current) =>
      current.map((vehicle) => {
        const fields = targetFieldsById.get(vehicle.id);
        if (!fields) return vehicle;

        const nextVehicle = { ...vehicle };
        fields.forEach((inlineField) => {
          nextVehicle[inlineField] = "";
          if (inlineField === "owner") nextVehicle.contractor = "";
        });
        nextVehicle.name = buildVehicleDisplayName(nextVehicle);

        return nextVehicle;
      }),
    );
    addAdminLog({
      action: "Редактирование",
      section: "Техника",
      details: `Очищены выбранные ячейки: ${targetKeys.length}.`,
    });
  }, [addAdminLog, pushVehicleUndoSnapshot, selectedVehicleCellKeys, setVehicleRows]);

  const focusVehicleCellByOffset = useCallback((id: number, field: VehicleInlineField, rowOffset: number, fieldOffset: number) => {
    const vehicleGridKeys = visibleVehicleRows.map((vehicle) => (
      vehicleInlineFields.map((inlineField) => vehicleInlineFieldDomKey(vehicle.id, inlineField))
    ));
    const nextKey = editableGridKeyAtOffset(vehicleGridKeys, vehicleInlineFieldDomKey(id, field), rowOffset, fieldOffset);
    if (!nextKey) return;

    const parsedCell = parseVehicleInlineFieldDomKey(nextKey);

    if (!parsedCell) return;
    focusVehicleInlineCell(parsedCell.vehicleId, parsedCell.field);
  }, [focusVehicleInlineCell, visibleVehicleRows]);

  const handleVehicleCellKeyDown = useCallback((event: KeyboardEvent<HTMLElement>, id: number, field: VehicleInlineField, editing: boolean) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    if (editing) {
      if (isEditableGridArrowKey(event.key)) {
        event.preventDefault();
        commitVehicleInlineCellEdit(id, field);
        const offset = editableGridArrowOffset(event.key);
        focusVehicleCellByOffset(id, field, offset.rowOffset, offset.columnOffset);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        commitVehicleInlineCellEdit(id, field);
        setPendingVehicleFocus({ id, field });
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelVehicleInlineCellEdit(id, field);
        return;
      }

      return;
    }

    if (event.key.length === 1 && (!vehicleFieldIsNumeric(field) || /^[0-9]$/.test(event.key))) {
      event.preventDefault();
      startVehicleInlineCellEdit(id, field, event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      clearSelectedVehicleCells(id, field);
    } else if (event.key === "F2") {
      event.preventDefault();
      startVehicleInlineCellEdit(id, field);
    } else if (isEditableGridArrowKey(event.key)) {
      event.preventDefault();
      const offset = editableGridArrowOffset(event.key);
      focusVehicleCellByOffset(id, field, offset.rowOffset, offset.columnOffset);
    } else if (event.key === "Enter") {
      event.preventDefault();
      startVehicleInlineCellEdit(id, field);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditingVehicleCell(null);
      setSelectedVehicleCellKeys(activeVehicleCell ? [activeVehicleCell] : []);
    } else if (event.key === "Delete") {
      event.preventDefault();
      clearSelectedVehicleCells(id, field);
    }
  }, [
    activeVehicleCell,
    cancelVehicleInlineCellEdit,
    clearSelectedVehicleCells,
    commitVehicleInlineCellEdit,
    focusVehicleCellByOffset,
    setEditingVehicleCell,
    setPendingVehicleFocus,
    setSelectedVehicleCellKeys,
    startVehicleInlineCellEdit,
  ]);

  const vehicleCellInputProps = useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);

    return {
      active: activeVehicleCell === fieldKey,
      selected: selectedVehicleCellKeys.includes(fieldKey),
      editing: editingVehicleCell === fieldKey,
      draft: vehicleCellDraft,
      fieldKey,
      onSelect: (event: MouseEvent<HTMLElement>) => startVehicleInlineSelection(id, field, event),
      onExtendSelection: (event: MouseEvent<HTMLElement>) => extendVehicleInlineSelection(id, field, event),
      onStartEdit: () => startVehicleInlineCellEdit(id, field),
      onDraftChange: setVehicleCellDraft,
      onCommitEdit: () => {
        if (vehicleCellSkipBlurCommitRef.current) {
          vehicleCellSkipBlurCommitRef.current = false;
          return;
        }

        if (editingVehicleCell === fieldKey) commitVehicleInlineCellEdit(id, field);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleVehicleCellKeyDown(event, id, field, editingVehicleCell === fieldKey),
    };
  }, [
    activeVehicleCell,
    commitVehicleInlineCellEdit,
    editingVehicleCell,
    extendVehicleInlineSelection,
    handleVehicleCellKeyDown,
    selectedVehicleCellKeys,
    setVehicleCellDraft,
    startVehicleInlineCellEdit,
    startVehicleInlineSelection,
    vehicleCellDraft,
    vehicleCellSkipBlurCommitRef,
  ]);

  return {
    commitVehicleInlineCellEdit,
    vehicleCellInputProps,
  };
}
