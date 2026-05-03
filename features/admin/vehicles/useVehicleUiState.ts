"use client";

import { useRef, useState } from "react";
import type { PendingVehicleFocus } from "@/features/admin/vehicles/useVehiclePendingFocus";
import { adminVehicleFallbackPreviewRows, type VehicleFilterKey, type VehicleFilters, type VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export function useVehicleUiState(defaultRows: VehicleRow[]) {
  const [adminVehiclesEditing, setAdminVehiclesEditing] = useState(false);
  const [showAllVehicleRows, setShowAllVehicleRows] = useState(false);
  const [vehiclePreviewRowLimit, setVehiclePreviewRowLimit] = useState(adminVehicleFallbackPreviewRows);
  const [vehicleRows, setVehicleRows] = useState<VehicleRow[]>(defaultRows);
  const [vehicleFilters, setVehicleFilters] = useState<VehicleFilters>({});
  const [vehicleFilterDrafts, setVehicleFilterDrafts] = useState<VehicleFilters>({});
  const [openVehicleFilter, setOpenVehicleFilter] = useState<VehicleFilterKey | null>(null);
  const [vehicleFilterSearch, setVehicleFilterSearch] = useState<Partial<Record<VehicleFilterKey, string>>>({});
  const [pendingVehicleFocus, setPendingVehicleFocus] = useState<PendingVehicleFocus | null>(null);
  const [activeVehicleCell, setActiveVehicleCell] = useState<string | null>(null);
  const [vehicleSelectionAnchorCell, setVehicleSelectionAnchorCell] =
    useState<{ id: number; field: VehicleInlineField } | null>(null);
  const [selectedVehicleCellKeys, setSelectedVehicleCellKeys] = useState<string[]>([]);
  const [editingVehicleCell, setEditingVehicleCell] = useState<string | null>(null);
  const [vehicleCellDraft, setVehicleCellDraft] = useState("");
  const [vehicleCellInitialDraft, setVehicleCellInitialDraft] = useState("");
  const vehicleCellSkipBlurCommitRef = useRef(false);
  const vehicleSelectionDraggingRef = useRef(false);
  const vehicleSelectionAnchorRef = useRef<{ id: number; field: VehicleInlineField } | null>(null);
  const vehicleImportInputRef = useRef<HTMLInputElement | null>(null);
  const adminVehicleTableScrollRef = useRef<HTMLDivElement | null>(null);
  const vehicleRowsRef = useRef(vehicleRows);
  const vehiclesDatabaseLoadedRef = useRef(false);
  const vehiclesDatabaseSaveSnapshotRef = useRef("");
  const vehiclesDatabaseAutoSaveBlockedSnapshotRef = useRef("");

  return {
    adminVehiclesEditing,
    setAdminVehiclesEditing,
    showAllVehicleRows,
    setShowAllVehicleRows,
    vehiclePreviewRowLimit,
    setVehiclePreviewRowLimit,
    vehicleRows,
    setVehicleRows,
    vehicleFilters,
    setVehicleFilters,
    vehicleFilterDrafts,
    setVehicleFilterDrafts,
    openVehicleFilter,
    setOpenVehicleFilter,
    vehicleFilterSearch,
    setVehicleFilterSearch,
    pendingVehicleFocus,
    setPendingVehicleFocus,
    activeVehicleCell,
    setActiveVehicleCell,
    vehicleSelectionAnchorCell,
    setVehicleSelectionAnchorCell,
    selectedVehicleCellKeys,
    setSelectedVehicleCellKeys,
    editingVehicleCell,
    setEditingVehicleCell,
    vehicleCellDraft,
    setVehicleCellDraft,
    vehicleCellInitialDraft,
    setVehicleCellInitialDraft,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    vehicleImportInputRef,
    adminVehicleTableScrollRef,
    vehicleRowsRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    vehiclesDatabaseAutoSaveBlockedSnapshotRef,
  };
}
