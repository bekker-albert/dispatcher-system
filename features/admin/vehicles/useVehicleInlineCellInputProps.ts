"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  parseVehicleInlineFieldDomKey,
  vehicleInlineFieldDomKey,
  type VehicleInlineField,
} from "@/lib/domain/vehicles/grid";

type UseVehicleInlineCellInputPropsOptions = {
  activeVehicleCell: string | null;
  selectedVehicleCellKeys: string[];
  editingVehicleCell: string | null;
  vehicleCellDraft: string;
  vehicleCellSkipBlurCommitRef: MutableRefObject<boolean>;
  setVehicleCellDraft: Dispatch<SetStateAction<string>>;
  startVehicleInlineSelection: (id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => void;
  extendVehicleInlineSelection: (id: number, field: VehicleInlineField, event: MouseEvent<HTMLElement>) => void;
  startVehicleInlineCellEdit: (id: number, field: VehicleInlineField, draftOverride?: string) => void;
  commitVehicleInlineCellEdit: (id: number, field: VehicleInlineField) => void;
  handleVehicleCellKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    id: number,
    field: VehicleInlineField,
    editing: boolean,
  ) => void;
};

export function useVehicleInlineCellInputProps({
  activeVehicleCell,
  selectedVehicleCellKeys,
  editingVehicleCell,
  vehicleCellDraft,
  vehicleCellSkipBlurCommitRef,
  setVehicleCellDraft,
  startVehicleInlineSelection,
  extendVehicleInlineSelection,
  startVehicleInlineCellEdit,
  commitVehicleInlineCellEdit,
  handleVehicleCellKeyDown,
}: UseVehicleInlineCellInputPropsOptions) {
  const selectedVehicleCellKeySet = useMemo(() => new Set(selectedVehicleCellKeys), [selectedVehicleCellKeys]);
  const selectedVehicleCellKeysById = useMemo(() => {
    const keysById = new Map<number, string[]>();

    selectedVehicleCellKeys.forEach((key) => {
      const cell = parseVehicleInlineFieldDomKey(key);
      if (!cell) return;

      const rowKeys = keysById.get(cell.vehicleId);
      if (rowKeys) {
        rowKeys.push(key);
        return;
      }

      keysById.set(cell.vehicleId, [key]);
    });

    return keysById;
  }, [selectedVehicleCellKeys]);
  const vehicleRowCellStateSignatures = useMemo(() => {
    const affectedVehicleRowIds = new Set<number>();
    const activeVehicleInlineCell = activeVehicleCell ? parseVehicleInlineFieldDomKey(activeVehicleCell) : null;
    const editingVehicleInlineCell = editingVehicleCell ? parseVehicleInlineFieldDomKey(editingVehicleCell) : null;

    if (activeVehicleInlineCell) affectedVehicleRowIds.add(activeVehicleInlineCell.vehicleId);
    if (editingVehicleInlineCell) affectedVehicleRowIds.add(editingVehicleInlineCell.vehicleId);
    selectedVehicleCellKeysById.forEach((_keys, vehicleId) => affectedVehicleRowIds.add(vehicleId));

    const signatures = new Map<number, string>();
    affectedVehicleRowIds.forEach((id) => {
      const rowPrefix = `${id}:`;
      const activeKey = activeVehicleCell?.startsWith(rowPrefix) ? activeVehicleCell : "";
      const editingKey = editingVehicleCell?.startsWith(rowPrefix) ? editingVehicleCell : "";
      const selectedKeys = selectedVehicleCellKeysById.get(id)?.join(",") ?? "";
      const draftKey = editingKey ? vehicleCellDraft : "";

      signatures.set(id, `${activeKey}|${editingKey}|${draftKey}|${selectedKeys}`);
    });

    return signatures;
  }, [activeVehicleCell, editingVehicleCell, selectedVehicleCellKeysById, vehicleCellDraft]);
  const editingVehicleCellRef = useRef(editingVehicleCell);
  const handlersRef = useRef({
    commitVehicleInlineCellEdit,
    extendVehicleInlineSelection,
    handleVehicleCellKeyDown,
    setVehicleCellDraft,
    startVehicleInlineCellEdit,
    startVehicleInlineSelection,
  });

  useLayoutEffect(() => {
    editingVehicleCellRef.current = editingVehicleCell;
    handlersRef.current = {
      commitVehicleInlineCellEdit,
      extendVehicleInlineSelection,
      handleVehicleCellKeyDown,
      setVehicleCellDraft,
      startVehicleInlineCellEdit,
      startVehicleInlineSelection,
    };
  }, [
    commitVehicleInlineCellEdit,
    editingVehicleCell,
    extendVehicleInlineSelection,
    handleVehicleCellKeyDown,
    setVehicleCellDraft,
    startVehicleInlineCellEdit,
    startVehicleInlineSelection,
  ]);

  const vehicleRowCellStateSignature = useCallback((id: number) => {
    return vehicleRowCellStateSignatures.get(id) ?? "";
  }, [vehicleRowCellStateSignatures]);

  const vehicleCellInputProps = useCallback((id: number, field: VehicleInlineField) => {
    const fieldKey = vehicleInlineFieldDomKey(id, field);

    return {
      active: activeVehicleCell === fieldKey,
      selected: selectedVehicleCellKeySet.has(fieldKey),
      editing: editingVehicleCell === fieldKey,
      draft: vehicleCellDraft,
      fieldKey,
      onSelect: (event: MouseEvent<HTMLElement>) => handlersRef.current.startVehicleInlineSelection(id, field, event),
      onExtendSelection: (event: MouseEvent<HTMLElement>) => handlersRef.current.extendVehicleInlineSelection(id, field, event),
      onStartEdit: () => handlersRef.current.startVehicleInlineCellEdit(id, field),
      onDraftChange: (value: string) => handlersRef.current.setVehicleCellDraft(value),
      onCommitEdit: () => {
        if (vehicleCellSkipBlurCommitRef.current) {
          vehicleCellSkipBlurCommitRef.current = false;
          return;
        }

        if (editingVehicleCellRef.current === fieldKey) handlersRef.current.commitVehicleInlineCellEdit(id, field);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => handlersRef.current.handleVehicleCellKeyDown(event, id, field, editingVehicleCellRef.current === fieldKey),
    };
  }, [activeVehicleCell, editingVehicleCell, selectedVehicleCellKeySet, vehicleCellDraft, vehicleCellSkipBlurCommitRef]);

  return {
    vehicleCellInputProps,
    vehicleRowCellStateSignature,
  };
}
