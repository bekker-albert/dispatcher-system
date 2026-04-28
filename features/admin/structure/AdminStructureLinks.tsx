import { CompactTh } from "@/shared/ui/layout";
import type { DependencyLink, DependencyNode } from "@/lib/domain/admin/structure";

import { AdminStructureLinksAddForm } from "./AdminStructureLinksAddForm";
import { AdminStructureLinksRow } from "./AdminStructureLinksRow";
import { sectionStyle, tableHeaderRowStyle, tableStyle, titleStyle } from "./AdminStructureLinksStyles";
import type { UpdateDependencyLink, UpdateDependencyLinkForm } from "./AdminStructureLinksTypes";

type AdminStructureLinksProps = {
  dependencyNodes: DependencyNode[];
  dependencyLinks: DependencyLink[];
  dependencyLinkForm: DependencyLink;
  editingDependencyLinkId: string | null;
  onEditDependencyLink: (id: string | null) => void;
  onUpdateDependencyLink: UpdateDependencyLink;
  onUpdateDependencyLinkForm: UpdateDependencyLinkForm;
  onAddDependencyLink: () => void;
  onDeleteDependencyLink: (id: string) => void;
};

export function AdminStructureLinks({
  dependencyNodes,
  dependencyLinks,
  dependencyLinkForm,
  editingDependencyLinkId,
  onEditDependencyLink,
  onUpdateDependencyLink,
  onUpdateDependencyLinkForm,
  onAddDependencyLink,
  onDeleteDependencyLink,
}: AdminStructureLinksProps) {
  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>Связи зависимостей</div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <CompactTh>Откуда</CompactTh>
              <CompactTh>Тип связи</CompactTh>
              <CompactTh>Куда</CompactTh>
              <CompactTh>Правило / что передает</CompactTh>
              <CompactTh>Ответственный</CompactTh>
              <CompactTh>Показ</CompactTh>
              <CompactTh>Действия</CompactTh>
            </tr>
          </thead>
          <tbody>
            {dependencyLinks.map((link) => (
              <AdminStructureLinksRow
                key={link.id}
                link={link}
                dependencyNodes={dependencyNodes}
                isEditing={editingDependencyLinkId === link.id}
                onEditDependencyLink={onEditDependencyLink}
                onUpdateDependencyLink={onUpdateDependencyLink}
                onDeleteDependencyLink={onDeleteDependencyLink}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AdminStructureLinksAddForm
        dependencyNodes={dependencyNodes}
        dependencyLinkForm={dependencyLinkForm}
        onUpdateDependencyLinkForm={onUpdateDependencyLinkForm}
        onAddDependencyLink={onAddDependencyLink}
      />
    </div>
  );
}
