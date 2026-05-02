import { type DependencyLink, type DependencyNode } from "@/lib/domain/admin/structure";

import { AdminStructureLinkFields } from "./AdminStructureLinkFields";
import { inlineEditStyle } from "./AdminStructureLinksStyles";
import type { UpdateDependencyLink } from "./AdminStructureLinksTypes";

type AdminStructureLinksEditFormProps = {
  link: DependencyLink;
  dependencyNodes: DependencyNode[];
  onUpdateDependencyLink: UpdateDependencyLink;
};

export function AdminStructureLinksEditForm({
  link,
  dependencyNodes,
  onUpdateDependencyLink,
}: AdminStructureLinksEditFormProps) {
  return (
    <div style={inlineEditStyle}>
      <AdminStructureLinkFields
        dependencyNodes={dependencyNodes}
        link={link}
        onUpdate={(field, value) => onUpdateDependencyLink(link.id, field, value)}
      />
    </div>
  );
}
