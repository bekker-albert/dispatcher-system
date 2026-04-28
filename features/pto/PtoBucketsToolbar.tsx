"use client";

import { Check, Pencil } from "lucide-react";

import { PtoToolbarButton, PtoToolbarIconButton } from "@/features/pto/PtoToolbarButtons";
import {
  ptoToolbarBlockStyle,
  ptoToolbarLabelStyle,
  ptoToolbarRowStyle,
  ptoToolbarStyle,
} from "@/features/pto/ptoBucketsStyles";

type PtoBucketsToolbarProps = {
  editingMode: boolean;
  onSelectArea: (area: string) => void;
  onToggleEditingMode: () => void;
  ptoAreaFilter: string;
  ptoAreaTabs: string[];
};

export function PtoBucketsToolbar({
  editingMode,
  onSelectArea,
  onToggleEditingMode,
  ptoAreaFilter,
  ptoAreaTabs,
}: PtoBucketsToolbarProps) {
  return (
    <div style={ptoToolbarStyle}>
      <div style={ptoToolbarBlockStyle}>
        <span style={ptoToolbarLabelStyle}>Участки</span>
        <div style={ptoToolbarRowStyle}>
          {ptoAreaTabs.map((area) => (
            <PtoToolbarButton key={area} active={ptoAreaFilter === area} onClick={() => onSelectArea(area)} label={area} />
          ))}
        </div>
      </div>

      <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
        <span style={ptoToolbarLabelStyle}>Редактирование</span>
        <div style={ptoToolbarRowStyle}>
          <PtoToolbarIconButton
            label={editingMode ? "Завершить редактирование таблицы" : "Редактировать таблицу"}
            onClick={onToggleEditingMode}
          >
            {editingMode ? <Check size={14} aria-hidden /> : <Pencil size={14} aria-hidden />}
          </PtoToolbarIconButton>
        </div>
      </div>
    </div>
  );
}
