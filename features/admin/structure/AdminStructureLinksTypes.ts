import type { DependencyLink, DependencyLinkType } from "@/lib/domain/admin/structure";

export type UpdateDependencyLink = (id: string, field: keyof DependencyLink, value: string | boolean) => void;

export type UpdateDependencyLinkForm = (field: keyof DependencyLink, value: string | boolean) => void;

type DependencyLinkTypeOption = {
  value: DependencyLinkType;
  label: string;
};

const linearLinkType = "Линейная" as DependencyLinkType;
const functionalLinkType = "Функциональная" as DependencyLinkType;

export const dependencyLinkTypeOptions: DependencyLinkTypeOption[] = [
  { value: linearLinkType, label: "Линейная" },
  { value: functionalLinkType, label: "Функциональная" },
];

const dependencyLinkTypeLabels = new Map<DependencyLinkType, string>(
  dependencyLinkTypeOptions.map((option) => [option.value, option.label]),
);

export function dependencyLinkTypeLabel(linkType: DependencyLinkType) {
  return dependencyLinkTypeLabels.get(linkType) ?? linkType;
}
