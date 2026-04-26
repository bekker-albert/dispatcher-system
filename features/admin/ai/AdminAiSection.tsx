import type { CSSProperties, ReactNode } from "react";

import { CompactTd, CompactTh, Field, SourceNote } from "@/shared/ui/layout";

export function AdminAiSection() {
  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>ИИ-сводка: как будет копиться база причин</div>
          <div style={{ color: "#64748b", marginTop: 4, maxWidth: 900 }}>
            Черновая схема: диспетчерская сводка сохраняет факты по технике, отчетность хранит подтвержденные
            причины по дате и виду работ, ИИ позже дает только предварительную версию причины.
          </div>
        </div>
        <span style={badgeStyle}>макет</span>
      </div>

      <div style={sourceGridStyle}>
        <SourceNote
          title="1. Диспетчерская сводка"
          source="Факты за смену"
          text="техника, участок, вид работ, рейсы, работа, ремонт, простой, производительность, комментарии"
        />
        <SourceNote
          title="2. Причины за сутки"
          source="Ручной ввод"
          text="дата + участок + вид работ + текст причины, например: Простой ДСК (5 ч.)"
        />
        <SourceNote
          title="3. Накопление"
          source="Расчет отчета"
          text="все суточные причины с начала года группируются отдельно по каждому виду работ"
        />
        <SourceNote
          title="4. ИИ-предложение"
          source="Будущий помощник"
          text="анализирует ремонты, простои, рейсы и производительность, затем предлагает причину для подтверждения"
        />
      </div>

      <div style={previewGridStyle}>
        <div style={innerPanelStyle}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Как диспетчер заполняет причину</div>
          <div style={reasonFieldsStyle}>
            <Field label="Дата">
              <input value="2026-04-18" readOnly style={compactInputStyle} />
            </Field>
            <Field label="Участок">
              <input value="Аксу" readOnly style={compactInputStyle} />
            </Field>
            <Field label="Вид работ">
              <input value="Перевозка горной массы" readOnly style={compactInputStyle} />
            </Field>
          </div>
          <Field label="Причина за сутки">
            <textarea
              readOnly
              value="Ремонт транспортировочной техники: 1 ед. самосвала (3 ч.); Простой ДСК (5 ч.)"
              style={reasonTextareaStyle}
            />
          </Field>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
            В реальной версии это поле будет редактироваться прямо в отчете по выбранной рабочей дате.
          </div>
        </div>

        <div style={innerPanelStyle}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Что покажет накопление с начала года</div>
          <div style={{ display: "grid", gap: 8 }}>
            <AccumulatedReason title="Ремонт транспортировочной техники" note="самосвалы, подтверждено диспетчером" hours="18 ч." />
            <AccumulatedReason title="Простой ДСК" note="показывается только в этой строке вида работ" hours="11 ч." />
            <AccumulatedReason title="Ожидание экскаватора" note="накопление по датам до выбранной даты" hours="6 ч." />
          </div>
        </div>
      </div>

      <div style={databasePanelStyle}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Какие таблицы я бы заложил в базу</div>
        <div style={{ overflowX: "auto" }}>
          <table style={databaseTableStyle}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <CompactTh>Таблица</CompactTh>
                <CompactTh>Что хранит</CompactTh>
                <CompactTh>Зачем нужна</CompactTh>
                <CompactTh>Кто заполняет</CompactTh>
              </tr>
            </thead>
            <tbody>
              <DatabaseRow
                table="dispatch_shifts"
                stores="дата, смена, участок, диспетчер"
                purpose="шапка каждой диспетчерской сводки"
                owner="диспетчер"
              />
              <DatabaseRow
                table="dispatch_equipment_rows"
                stores="техника, работа, ремонт, простой, рейсы, производительность"
                purpose="факты, по которым ИИ будет искать причину невыполнения"
                owner="диспетчерская сводка"
              />
              <DatabaseRow
                table="daily_plan_reasons"
                stores="дата, участок, вид работ, причина, часы, количество техники"
                purpose="ручная причина за сутки и накопление с начала года"
                owner="диспетчер, позже ИИ после подтверждения"
              />
              <DatabaseRow
                table="ai_reason_suggestions"
                stores="предложенный текст, доказательства, статус принятия"
                purpose="ИИ предлагает, человек подтверждает или отклоняет"
                owner="ИИ + диспетчер"
              />
            </tbody>
          </table>
        </div>
      </div>

      <div style={ruleGridStyle}>
        <RuleCard title="Правило для отчета">
          Если выбранная дата меняется, ячейка &quot;Причина за сутки&quot; берет причину только за эту дату.
          Ячейка &quot;Причины с накоплением&quot; собирает все причины с 01.01 выбранного года по выбранную дату.
        </RuleCard>
        <RuleCard title="Правило для ИИ">
          ИИ не пишет в официальный отчет напрямую. Он предлагает текст с доказательствами: какая техника стояла,
          сколько часов ремонта, где просела производительность.
        </RuleCard>
        <RuleCard title="Правило связки">
          Связь строится не по названию для заказчика, а по внутреннему ключу: дата + участок + вид работ. Название
          строки можно переименовывать без потери данных.
        </RuleCard>
      </div>
    </div>
  );
}

function AccumulatedReason({ title, note, hours }: { title: string; note: string; hours: string }) {
  return (
    <div style={compactRowStyle}>
      <div>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ color: "#64748b", marginTop: 3 }}>{note}</div>
      </div>
      <div style={{ fontWeight: 800 }}>{hours}</div>
    </div>
  );
}

function DatabaseRow({ table, stores, purpose, owner }: { table: string; stores: string; purpose: string; owner: string }) {
  return (
    <tr>
      <CompactTd>
        <strong>{table}</strong>
      </CompactTd>
      <CompactTd>{stores}</CompactTd>
      <CompactTd>{purpose}</CompactTd>
      <CompactTd>{owner}</CompactTd>
    </tr>
  );
}

function RuleCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={innerPanelStyle}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ color: "#475569" }}>{children}</div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
  marginBottom: 16,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: 14,
};

const badgeStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "5px 8px",
  background: "#ffffff",
};

const sourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const previewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1.1fr) minmax(320px, 0.9fr)",
  gap: 14,
  marginTop: 14,
  alignItems: "start",
};

const innerPanelStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
};

const reasonFieldsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
  gap: 8,
  marginBottom: 10,
};

const inputBaseStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};

const compactInputStyle: CSSProperties = {
  ...inputBaseStyle,
  padding: "8px 10px",
};

const reasonTextareaStyle: CSSProperties = {
  ...inputBaseStyle,
  minHeight: 78,
  resize: "vertical",
};

const compactRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};

const databasePanelStyle: CSSProperties = {
  ...innerPanelStyle,
  marginTop: 14,
};

const databaseTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  fontSize: 13,
};

const ruleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 14,
};
