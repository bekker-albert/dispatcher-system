import { Fragment } from "react";
import { Check, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import {
  dependencyNodeLabel,
  type DependencyLink,
  type DependencyNode,
} from "@/lib/domain/admin/structure";
import { IconButton } from "@/shared/ui/buttons";
import { CompactTd } from "@/shared/ui/layout";

import { AdminStructureLinksEditForm } from "./AdminStructureLinksEditForm";
import { actionButtonsStyle, detailCellStyle } from "./AdminStructureLinksStyles";
import { dependencyLinkTypeLabel, type UpdateDependencyLink } from "./AdminStructureLinksTypes";

type AdminStructureLinksRowProps = {
  link: DependencyLink;
  dependencyNodes: DependencyNode[];
  isEditing: boolean;
  onEditDependencyLink: (id: string | null) => void;
  onUpdateDependencyLink: UpdateDependencyLink;
  onDeleteDependencyLink: (id: string) => void;
};

export function AdminStructureLinksRow({
  link,
  dependencyNodes,
  isEditing,
  onEditDependencyLink,
  onUpdateDependencyLink,
  onDeleteDependencyLink,
}: AdminStructureLinksRowProps) {
  return (
    <Fragment>
      <tr>
        <CompactTd>{dependencyNodeLabel(dependencyNodes, link.fromNodeId)}</CompactTd>
        <CompactTd>{dependencyLinkTypeLabel(link.linkType)}</CompactTd>
        <CompactTd>{dependencyNodeLabel(dependencyNodes, link.toNodeId)}</CompactTd>
        <CompactTd>{link.rule || "-"}</CompactTd>
        <CompactTd>{link.owner || "-"}</CompactTd>
        <CompactTd>{link.visible ? "Показывается" : "Скрыта"}</CompactTd>
        <CompactTd>
          <div style={actionButtonsStyle}>
            <IconButton
              label={isEditing ? "Завершить редактирование" : "Редактировать связь"}
              onClick={() => onEditDependencyLink(isEditing ? null : link.id)}
            >
              {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
            </IconButton>
            <IconButton
              label={link.visible ? "Скрыть связь" : "Вернуть связь"}
              onClick={() => onUpdateDependencyLink(link.id, "visible", !link.visible)}
            >
              {link.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </IconButton>
            <IconButton label="Удалить связь" onClick={() => onDeleteDependencyLink(link.id)}>
              <Trash2 size={16} aria-hidden />
            </IconButton>
          </div>
        </CompactTd>
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={7} style={detailCellStyle}>
            <AdminStructureLinksEditForm
              link={link}
              dependencyNodes={dependencyNodes}
              onUpdateDependencyLink={onUpdateDependencyLink}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
