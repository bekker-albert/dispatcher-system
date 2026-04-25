export type OrgMember = {
  id: string;
  name: string;
  position: string;
  department: string;
  area: string;
  linearManagerId: string;
  functionalManagerId: string;
  active: boolean;
};

export type DependencyLinkType = "Линейная" | "Функциональная";

export type DependencyNode = {
  id: string;
  name: string;
  kind: string;
  owner: string;
  visible: boolean;
};

export type DependencyLink = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  linkType: DependencyLinkType;
  rule: string;
  owner: string;
  visible: boolean;
};

export const defaultOrgMembers: OrgMember[] = [
  {
    id: "director-dispatch",
    name: "Альберт",
    position: "Начальник диспетчерской службы",
    department: "Диспетчерская служба",
    area: "Все участки",
    linearManagerId: "",
    functionalManagerId: "",
    active: true,
  },
  {
    id: "pto-engineer",
    name: "ПТО",
    position: "Инженер ПТО",
    department: "ПТО",
    area: "Все участки",
    linearManagerId: "director-dispatch",
    functionalManagerId: "",
    active: true,
  },
  {
    id: "shift-dispatcher",
    name: "Диспетчер смены",
    position: "Диспетчер",
    department: "Диспетчерская служба",
    area: "Аксу",
    linearManagerId: "director-dispatch",
    functionalManagerId: "pto-engineer",
    active: true,
  },
];

export const defaultOrgMemberForm: OrgMember = {
  id: "",
  name: "",
  position: "",
  department: "",
  area: "",
  linearManagerId: "",
  functionalManagerId: "",
  active: true,
};

export const defaultDependencyNodes: DependencyNode[] = [
  { id: "sites", name: "Участки", kind: "Справочник", owner: "Админка", visible: true },
  { id: "vehicles", name: "Техника / СводТехники", kind: "Справочник", owner: "Админка / Диспетчер", visible: true },
  { id: "body-measurements", name: "Замеры кузовов", kind: "ПТО", owner: "ПТО", visible: true },
  { id: "volumes", name: "Объемы кузова", kind: "Расчет", owner: "ПТО", visible: true },
  { id: "pto-plan", name: "План / ПланС / График", kind: "План", owner: "ПТО", visible: true },
  { id: "shift-summary", name: "БД сменных записей", kind: "Факт смены", owner: "Диспетчер", visible: true },
  { id: "oper-accounting", name: "Оперативный учет", kind: "Агрегатор факта", owner: "ПТО", visible: true },
  { id: "survey-measurements", name: "Маркзамер", kind: "Корректировка каждые 5 дней", owner: "Маркшейдер", visible: true },
  { id: "performance", name: "Производительность", kind: "Рейсы / объемы / часы", owner: "ПТО", visible: true },
  { id: "reasons", name: "Причины: ремонт, простой, аренда", kind: "Объяснение отклонений", owner: "Диспетчер / Механик", visible: true },
  { id: "reports", name: "Отчетность AAM", kind: "Итог", owner: "Руководитель / ПТО", visible: true },
];

export const defaultDependencyLinks: DependencyLink[] = [
  { id: "sites-vehicles", fromNodeId: "sites", toNodeId: "vehicles", linkType: "Линейная", rule: "Техника закрепляется за участком.", owner: "Админка", visible: true },
  { id: "vehicles-body-measurements", fromNodeId: "vehicles", toNodeId: "body-measurements", linkType: "Функциональная", rule: "Для техники выбирается замер кузова по модели, материалу и актуальности.", owner: "ПТО", visible: true },
  { id: "body-measurements-volumes", fromNodeId: "body-measurements", toNodeId: "volumes", linkType: "Функциональная", rule: "Объем подтягивается из замеров кузовов и используется в расчетах.", owner: "ПТО", visible: true },
  { id: "vehicles-shift-summary", fromNodeId: "vehicles", toNodeId: "shift-summary", linkType: "Линейная", rule: "По технике заполняются рейсы, часы, статус, ремонт, простой и аренда.", owner: "Диспетчер", visible: true },
  { id: "shift-summary-oper-accounting", fromNodeId: "shift-summary", toNodeId: "oper-accounting", linkType: "Линейная", rule: "БД сменных записей агрегируется по участку, структуре работ и дате.", owner: "Диспетчер / ПТО", visible: true },
  { id: "volumes-oper-accounting", fromNodeId: "volumes", toNodeId: "oper-accounting", linkType: "Функциональная", rule: "Рейсы умножаются на объем материала.", owner: "ПТО", visible: true },
  { id: "oper-accounting-survey", fromNodeId: "oper-accounting", toNodeId: "survey-measurements", linkType: "Функциональная", rule: "Маркзамер берет оперучет для дней после последнего замера.", owner: "Маркшейдер / ПТО", visible: true },
  { id: "shift-summary-performance", fromNodeId: "shift-summary", toNodeId: "performance", linkType: "Функциональная", rule: "Рейсы, часы и объемы техники собираются в производительность.", owner: "ПТО", visible: true },
  { id: "shift-summary-reasons", fromNodeId: "shift-summary", toNodeId: "reasons", linkType: "Линейная", rule: "Ремонт, простой и аренда превращаются в причины отклонения.", owner: "Диспетчер / Механик", visible: true },
  { id: "pto-plan-reports", fromNodeId: "pto-plan", toNodeId: "reports", linkType: "Функциональная", rule: "План дает суточный план, план месяца, план с начала года и годовой план.", owner: "ПТО", visible: true },
  { id: "survey-measurements-reports", fromNodeId: "survey-measurements", toNodeId: "reports", linkType: "Функциональная", rule: "Факт отчетности = маркзамер + оперучет недостающих дней до выбранной даты.", owner: "Маркшейдер / ПТО", visible: true },
  { id: "performance-reports", fromNodeId: "performance", toNodeId: "reports", linkType: "Функциональная", rule: "Производительность техники попадает в отдельные колонки отчета.", owner: "ПТО", visible: true },
  { id: "reasons-reports", fromNodeId: "reasons", toNodeId: "reports", linkType: "Функциональная", rule: "Причины показываются за сутки и накоплением с начала года.", owner: "Диспетчер / ПТО", visible: true },
];

export const dependencyStages = [
  { title: "1. База", nodeIds: ["sites", "vehicles"] },
  { title: "2. ПТО", nodeIds: ["body-measurements", "volumes", "pto-plan"] },
  { title: "3. Факт смены", nodeIds: ["shift-summary"] },
  { title: "4. Расчеты", nodeIds: ["oper-accounting", "survey-measurements", "performance", "reasons"] },
  { title: "5. Итог", nodeIds: ["reports"] },
];

export const defaultDependencyNodeForm: DependencyNode = {
  id: "",
  name: "",
  kind: "",
  owner: "",
  visible: true,
};

export const defaultDependencyLinkForm: DependencyLink = {
  id: "",
  fromNodeId: "sites",
  toNodeId: "vehicles",
  linkType: "Линейная",
  rule: "",
  owner: "",
  visible: true,
};

export function orgMemberLabel(member?: OrgMember) {
  if (!member) return "Не назначен";

  return [member.name, member.position ? `(${member.position})` : ""].filter(Boolean).join(" ");
}

export function dependencyNodeLabel(nodes: DependencyNode[], id: string) {
  return nodes.find((node) => node.id === id)?.name ?? "Не выбрано";
}
