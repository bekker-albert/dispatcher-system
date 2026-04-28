import type { ReactNode } from "react";

export type VehicleFilterColumnLike = {
  label: string;
  icon?: ReactNode;
};

export type AdminVehicleFilterHeaderProps = {
  column: VehicleFilterColumnLike;
  options: string[];
  appliedSelectedValues?: string[];
  draftSelectedValues?: string[];
  search: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSearchChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApply: () => void;
  onClose: () => void;
};
