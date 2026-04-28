import { Plus } from "lucide-react";

import { type DependencyLink, type DependencyLinkType, type DependencyNode } from "@/lib/domain/admin/structure";
import { IconButton } from "@/shared/ui/buttons";
import { Field } from "@/shared/ui/layout";

import { addFormStyle, inputStyle } from "./AdminStructureLinksStyles";
import { dependencyLinkTypeOptions, type UpdateDependencyLinkForm } from "./AdminStructureLinksTypes";

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
      <Field label="Откуда">
        <select
          value={dependencyLinkForm.fromNodeId}
          onChange={(event) => onUpdateDependencyLinkForm("fromNodeId", event.target.value)}
          style={inputStyle}
        >
          {dependencyNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Тип связи">
        <select
          value={dependencyLinkForm.linkType}
          onChange={(event) => onUpdateDependencyLinkForm("linkType", event.target.value as DependencyLinkType)}
          style={inputStyle}
        >
          {dependencyLinkTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Куда">
        <select
          value={dependencyLinkForm.toNodeId}
          onChange={(event) => onUpdateDependencyLinkForm("toNodeId", event.target.value)}
          style={inputStyle}
        >
          {dependencyNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Правило">
        <input
          value={dependencyLinkForm.rule}
          onChange={(event) => onUpdateDependencyLinkForm("rule", event.target.value)}
          placeholder="Что передает / как считается"
          style={inputStyle}
        />
      </Field>
      <Field label="Ответственный">
        <input
          value={dependencyLinkForm.owner}
          onChange={(event) => onUpdateDependencyLinkForm("owner", event.target.value)}
          placeholder="Ответственный"
          style={inputStyle}
        />
      </Field>
      <IconButton label="Добавить связь" onClick={onAddDependencyLink}>
        <Plus size={16} aria-hidden />
      </IconButton>
    </div>
  );
}
