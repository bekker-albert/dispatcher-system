import { type DependencyLink, type DependencyLinkType, type DependencyNode } from "@/lib/domain/admin/structure";
import { Field } from "@/shared/ui/layout";

import { inputStyle } from "./AdminStructureSharedStyles";
import { dependencyLinkTypeOptions } from "./AdminStructureLinksTypes";

type AdminStructureLinkFieldsProps = {
  dependencyNodes: DependencyNode[];
  link: DependencyLink;
  onUpdate: (field: keyof DependencyLink, value: string | DependencyLinkType) => void;
};

export function AdminStructureLinkFields({
  dependencyNodes,
  link,
  onUpdate,
}: AdminStructureLinkFieldsProps) {
  return (
    <>
      <Field label="Откуда">
        <select
          value={link.fromNodeId}
          onChange={(event) => onUpdate("fromNodeId", event.target.value)}
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
          onChange={(event) => onUpdate("linkType", event.target.value as DependencyLinkType)}
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
          onChange={(event) => onUpdate("toNodeId", event.target.value)}
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
          onChange={(event) => onUpdate("rule", event.target.value)}
          placeholder="Например: рейсы x объем кузова"
          style={inputStyle}
        />
      </Field>
      <Field label="Ответственный">
        <input
          value={link.owner}
          onChange={(event) => onUpdate("owner", event.target.value)}
          placeholder="Например: ПТО"
          style={inputStyle}
        />
      </Field>
    </>
  );
}
