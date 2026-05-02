import { Plus } from "lucide-react";

import { type DependencyLink, type DependencyNode } from "@/lib/domain/admin/structure";
import { IconButton } from "@/shared/ui/buttons";

import { AdminStructureLinkFields } from "./AdminStructureLinkFields";
import { addFormStyle } from "./AdminStructureLinksStyles";
import type { UpdateDependencyLinkForm } from "./AdminStructureLinksTypes";

type AdminStructureLinksAddFormProps = {
  dependencyNodes: DependencyNode[];
  dependencyLinkForm: DependencyLink;
  onUpdateDependencyLinkForm: UpdateDependencyLinkForm;
  onAddDependencyLink: () => void;
};

export function AdminStructureLinksAddForm({
  dependencyNodes,
  dependencyLinkForm,
  onUpdateDependencyLinkForm,
  onAddDependencyLink,
}: AdminStructureLinksAddFormProps) {
  return (
    <div style={addFormStyle}>
      <AdminStructureLinkFields
        dependencyNodes={dependencyNodes}
        link={dependencyLinkForm}
        onUpdate={onUpdateDependencyLinkForm}
      />
      <IconButton label="Добавить связь" onClick={onAddDependencyLink}>
        <Plus size={16} aria-hidden />
      </IconButton>
    </div>
  );
}
