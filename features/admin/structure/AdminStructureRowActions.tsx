import { Check, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { IconButton } from "@/shared/ui/buttons";
import { actionButtonsStyle } from "./AdminStructureSharedStyles";

type AdminStructureRowActionsProps = {
  deleteLabel: string;
  editLabel: string;
  finishEditLabel: string;
  hiddenIconLabel: string;
  isEditing: boolean;
  visible: boolean;
  visibleIconLabel: string;
  onDelete: () => void;
  onToggleEdit: () => void;
  onToggleVisible: () => void;
};

export function AdminStructureRowActions({
  deleteLabel,
  editLabel,
  finishEditLabel,
  hiddenIconLabel,
  isEditing,
  visible,
  visibleIconLabel,
  onDelete,
  onToggleEdit,
  onToggleVisible,
}: AdminStructureRowActionsProps) {
  return (
    <div style={actionButtonsStyle}>
      <IconButton label={isEditing ? finishEditLabel : editLabel} onClick={onToggleEdit}>
        {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
      </IconButton>
      <IconButton label={visible ? visibleIconLabel : hiddenIconLabel} onClick={onToggleVisible}>
        {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </IconButton>
      <IconButton label={deleteLabel} onClick={onDelete}>
        <Trash2 size={16} aria-hidden />
      </IconButton>
    </div>
  );
}
