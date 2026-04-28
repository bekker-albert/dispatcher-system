import { type DependencyLink, type DependencyLinkType, type DependencyNode } from "@/lib/domain/admin/structure";
import { Field } from "@/shared/ui/layout";

import { inlineEditStyle, inputStyle } from "./AdminStructureLinksStyles";
import { dependencyLinkTypeOptions, type UpdateDependencyLink } from "./AdminStructureLinksTypes";

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
      <Field label="Откуда">
        <select
          value={link.fromNodeId}
          onChange={(event) => onUpdateDependencyLink(link.id, "fromNodeId", event.target.value)}
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
          value={link.linkType}
          onChange={(event) => onUpdateDependencyLink(link.id, "linkType", event.target.value as DependencyLinkType)}
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
          value={link.toNodeId}
          onChange={(event) => onUpdateDependencyLink(link.id, "toNodeId", event.target.value)}
          style={inputStyle}
        >
          {dependencyNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Правило / что передает">
        <input
          value={link.rule}
          onChange={(event) => onUpdateDependencyLink(link.id, "rule", event.target.value)}
          placeholder="Например: рейсы x объем кузова"
          style={inputStyle}
        />
      </Field>
      <Field label="Ответственный">
        <input
          value={link.owner}
          onChange={(event) => onUpdateDependencyLink(link.id, "owner", event.target.value)}
          placeholder="Например: ПТО"
          style={inputStyle}
        />
      </Field>
    </div>
  );
}
