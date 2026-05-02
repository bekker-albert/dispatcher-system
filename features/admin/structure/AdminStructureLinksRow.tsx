import { Fragment } from "react";

import {
  dependencyNodeLabel,
  type DependencyLink,
  type DependencyNode,
} from "@/lib/domain/admin/structure";
import { CompactTd } from "@/shared/ui/layout";

import { AdminStructureLinksEditForm } from "./AdminStructureLinksEditForm";
import { AdminStructureRowActions } from "./AdminStructureRowActions";
import { detailCellStyle } from "./AdminStructureLinksStyles";
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
          <AdminStructureRowActions
            deleteLabel="Удалить связь"
            editLabel="Редактировать связь"
            finishEditLabel="Завершить редактирование"
            hiddenIconLabel="Вернуть связь"
            isEditing={isEditing}
            visible={link.visible}
            visibleIconLabel="Скрыть связь"
            onDelete={() => onDeleteDependencyLink(link.id)}
            onToggleEdit={() => onEditDependencyLink(isEditing ? null : link.id)}
            onToggleVisible={() => onUpdateDependencyLink(link.id, "visible", !link.visible)}
          />
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
