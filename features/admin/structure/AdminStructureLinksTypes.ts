import type { DependencyLink, DependencyLinkType } from "@/lib/domain/admin/structure";

export type UpdateDependencyLink = (id: string, field: keyof DependencyLink, value: string | boolean) => void;

export type UpdateDependencyLinkForm = (field: keyof DependencyLink, value: string | boolean) => void;

type DependencyLinkTypeOption = {
  value: DependencyLinkType;
  label: string;
};

export const dependencyLinkTypeOptions: DependencyLinkTypeOption[] = [
  { value: "Линейная", label: "Линейная" },
  { value: "Функциональная", label: "Функциональная" },
];

const dependencyLinkTypeLabels = new Map<DependencyLinkType, string>(
  dependencyLinkTypeOptions.map((option) => [option.value, option.label]),
);

export function dependencyLinkTypeLabel(linkType: DependencyLinkType) {
  return dependencyLinkTypeLabels.get(linkType) ?? linkType;
}
