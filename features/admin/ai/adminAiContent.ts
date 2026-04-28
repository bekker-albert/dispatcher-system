export type AdminAiHeaderContent = {
  title: string;
  description: string;
  badge: string;
};

export type AdminAiSourceNote = {
  title: string;
  source: string;
  text: string;
};

export type AdminAiReasonField = {
  label: string;
  value: string;
};

export type AdminAiReasonPreviewContent = {
  title: string;
  fields: AdminAiReasonField[];
  reasonLabel: string;
  reason: string;
  note: string;
};

export type AdminAiAccumulatedReason = {
  title: string;
  note: string;
  hours: string;
};

export type AdminAiAccumulationContent = {
  title: string;
  reasons: AdminAiAccumulatedReason[];
};

export type AdminAiDatabaseRow = {
  table: string;
  stores: string;
  purpose: string;
  owner: string;
};

export type AdminAiDatabaseContent = {
  title: string;
  columns: string[];
  rows: AdminAiDatabaseRow[];
};

export type AdminAiRuleContent = {
  title: string;
  body: string;
};

export const adminAiHeaderContent: AdminAiHeaderContent = {
  title: "ИИ-сводка: как будет копиться база причин",
  description:
    "Черновая схема: диспетчерская сводка сохраняет факты по технике, отчетность хранит подтвержденные причины по дате и виду работ, ИИ позже дает только предварительную версию причины.",
  badge: "макет",
};

export const adminAiSourceNotes: AdminAiSourceNote[] = [
  {
    title: "1. Диспетчерская сводка",
    source: "Факты за смену",
    text: "техника, участок, вид работ, рейсы, работа, ремонт, простой, производительность, комментарии",
  },
  {
    title: "2. Причины за сутки",
    source: "Ручной ввод",
    text: "дата + участок + вид работ + текст причины, например: Простой ДСК (5 ч.)",
  },
  {
    title: "3. Накопление",
    source: "Расчет отчета",
    text: "все суточные причины с начала года группируются отдельно по каждому виду работ",
  },
  {
    title: "4. ИИ-предложение",
    source: "Будущий помощник",
    text: "анализирует ремонты, простои, рейсы и производительность, затем предлагает причину для подтверждения",
  },
];

export const adminAiReasonPreviewContent: AdminAiReasonPreviewContent = {
  title: "Как диспетчер заполняет причину",
  fields: [
    { label: "Дата", value: "2026-04-18" },
    { label: "Участок", value: "Аксу" },
    { label: "Вид работ", value: "Перевозка горной массы" },
  ],
  reasonLabel: "Причина за сутки",
  reason: "Ремонт транспортировочной техники: 1 ед. самосвала (3 ч.); Простой ДСК (5 ч.)",
  note: "В реальной версии это поле будет редактироваться прямо в отчете по выбранной рабочей дате.",
};

export const adminAiAccumulationContent: AdminAiAccumulationContent = {
  title: "Что покажет накопление с начала года",
  reasons: [
    {
      title: "Ремонт транспортировочной техники",
      note: "самосвалы, подтверждено диспетчером",
      hours: "18 ч.",
    },
    {
      title: "Простой ДСК",
      note: "показывается только в этой строке вида работ",
      hours: "11 ч.",
    },
    {
      title: "Ожидание экскаватора",
      note: "накопление по датам до выбранной даты",
      hours: "6 ч.",
    },
  ],
};

export const adminAiDatabaseContent: AdminAiDatabaseContent = {
  title: "Какие таблицы я бы заложил в базу",
  columns: ["Таблица", "Что хранит", "Зачем нужна", "Кто заполняет"],
  rows: [
    {
      table: "dispatch_shifts",
      stores: "дата, смена, участок, диспетчер",
      purpose: "шапка каждой диспетчерской сводки",
      owner: "диспетчер",
    },
    {
      table: "dispatch_equipment_rows",
      stores: "техника, работа, ремонт, простой, рейсы, производительность",
      purpose: "факты, по которым ИИ будет искать причину невыполнения",
      owner: "диспетчерская сводка",
    },
    {
      table: "daily_plan_reasons",
      stores: "дата, участок, вид работ, причина, часы, количество техники",
      purpose: "ручная причина за сутки и накопление с начала года",
      owner: "диспетчер, позже ИИ после подтверждения",
    },
    {
      table: "ai_reason_suggestions",
      stores: "предложенный текст, доказательства, статус принятия",
      purpose: "ИИ предлагает, человек подтверждает или отклоняет",
      owner: "ИИ + диспетчер",
    },
  ],
};

export const adminAiRuleContent: AdminAiRuleContent[] = [
  {
    title: "Правило для отчета",
    body: 'Если выбранная дата меняется, ячейка "Причина за сутки" берет причину только за эту дату. Ячейка "Причины с накоплением" собирает все причины с 01.01 выбранного года по выбранную дату.',
  },
  {
    title: "Правило для ИИ",
    body: "ИИ не пишет в официальный отчет напрямую. Он предлагает текст с доказательствами: какая техника стояла, сколько часов ремонта, где просела производительность.",
  },
  {
    title: "Правило связки",
    body: "Связь строится не по названию для заказчика, а по внутреннему ключу: дата + участок + вид работ. Название строки можно переименовывать без потери данных.",
  },
];
