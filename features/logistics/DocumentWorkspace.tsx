"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import styles from "./document-workspace.module.css";

type Template = {
  id: string;
  type: string;
  name: string;
  version: number;
  status: "draft" | "active" | "archived";
  variables: string[];
  checksum: string;
  contentHtml: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
};

type Rule = {
  id: string;
  name: string;
  eventCode: string;
  requestKind?: string;
  requiresBusinessTrip?: boolean;
  requiresWaybill?: boolean;
  requiresConsignmentNote?: boolean;
  templateType: string;
  sequence: number;
  required: boolean;
  active: boolean;
};

type Instance = {
  id: string;
  requestId?: string;
  tripId?: string;
  templateId: string;
  templateVersion: number;
  templateName: string;
  documentType: string;
  status: string;
  sourceSnapshot: { request?: { number?: string; purpose?: string } };
  contentHtml: string;
  checksum: string;
  generatedAt: string;
};

type RequestRow = { id: string; number: string; status: string; purpose: string };
type Bootstrap = {
  requests: RequestRow[];
  documents: {
    templates: Template[];
    rules: Rule[];
    instances: Instance[];
    canManage: boolean;
  };
};

type Preset = {
  type: string;
  name: string;
  description: string;
  content: string;
};

const presets: Preset[] = [
  {
    type: "service_note",
    name: "Служебная записка",
    description: "Цель, маршрут, даты и инициатор поездки.",
    content: `<section class="document">
  <h1>Служебная записка</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Автор:</b> {{request.authorDisplayName}}</p>
  <p><b>Подразделение:</b> {{request.department}}</p>
  <p><b>Проект / участок:</b> {{request.project}}</p>
  <p><b>Цель поездки:</b> {{request.purpose}}</p>
  <p><b>Период:</b> {{request.desiredDepartureAt}} — {{request.desiredReturnAt}}</p>
  <p><b>Сформировано:</b> {{generated.at}}</p>
</section>`,
  },
  {
    type: "business_trip_calculation",
    name: "Расчёт командировочных",
    description: "Основание и период командировки.",
    content: `<section class="document">
  <h1>Расчёт командировочных расходов</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Сотрудник / инициатор:</b> {{request.authorDisplayName}}</p>
  <p><b>Цель:</b> {{request.purpose}}</p>
  <p><b>Период:</b> {{request.desiredDepartureAt}} — {{request.desiredReturnAt}}</p>
  <p><b>Центр затрат:</b> {{request.costCenter}}</p>
</section>`,
  },
  {
    type: "driver_statement",
    name: "Заявление водителя",
    description: "Заявление, связанное с выполнением поездки.",
    content: `<section class="document">
  <h1>Заявление водителя</h1>
  <p><b>По заявке:</b> {{request.number}}</p>
  <p><b>Маршрут:</b> {{request.route}}</p>
  <p><b>Период поездки:</b> {{request.desiredDepartureAt}} — {{request.desiredReturnAt}}</p>
  <p>Прошу оформить документы, необходимые для выполнения указанной поездки.</p>
</section>`,
  },
  {
    type: "waybill",
    name: "Путевой лист",
    description: "Основные данные рейса и маршрут.",
    content: `<section class="document">
  <h1>Путевой лист</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Цель:</b> {{request.purpose}}</p>
  <p><b>Маршрут:</b> {{request.route}}</p>
  <p><b>Плановый выезд:</b> {{request.desiredDepartureAt}}</p>
  <p><b>Плановое возвращение:</b> {{request.desiredReturnAt}}</p>
</section>`,
  },
  {
    type: "release_checklist",
    name: "Контрольный лист выпуска",
    description: "Медицинская, техническая и документальная проверка.",
    content: `<section class="document">
  <h1>Контрольный лист выпуска</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Маршрут:</b> {{request.route}}</p>
  <table>
    <tr><th>Проверка</th><th>Отметка</th></tr>
    <tr><td>Медицинский допуск</td><td></td></tr>
    <tr><td>Технический выпуск</td><td></td></tr>
    <tr><td>Документы автомобиля и водителя</td><td></td></tr>
    <tr><td>Комплект документов</td><td></td></tr>
  </table>
</section>`,
  },
  {
    type: "consignment_note",
    name: "Товарно-транспортная накладная",
    description: "Основание для перевозки груза.",
    content: `<section class="document">
  <h1>Товарно-транспортная накладная</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Груз:</b> {{request.cargoDescription}}</p>
  <p><b>Масса, кг:</b> {{request.cargoWeightKg}}</p>
  <p><b>Объём, м³:</b> {{request.cargoVolumeM3}}</p>
  <p><b>Маршрут:</b> {{request.route}}</p>
</section>`,
  },
  {
    type: "custom",
    name: "Другой документ",
    description: "Пустой бланк для отдельного вида документа.",
    content: `<section class="document">
  <h1>Название документа</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Цель:</b> {{request.purpose}}</p>
</section>`,
  },
];

const requestKindLabels: Record<string, string> = {
  documents: "Документы",
  passengers: "Пассажиры",
  cargo: "Груз",
  mixed: "Пассажиры и груз",
};

async function api<T>(method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await fetch("/api/logistics", {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: method === "POST"
      ? {
          "content-type": "application/json",
          "x-dispatcher-request": "same-origin",
          "x-correlation-id": crypto.randomUUID(),
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Ошибка сервера: ${response.status}`);
  return payload;
}

function formatDate(value?: string) {
  if (!value) return "Без ограничения";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU");
}

function printDocument(title: string, contentHtml: string) {
  const popup = window.open("", "_blank", "width=960,height=760");
  if (!popup) return;
  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.45; }
    .document { max-width: 180mm; margin: 0 auto; }
    h1 { margin: 0 0 24px; text-align: center; font-size: 18pt; }
    p { margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
  </style>
</head>
<body>${contentHtml}</body>
</html>`);
  popup.document.close();
  popup.focus();
  popup.setTimeout(() => popup.print(), 250);
}

export default function DocumentWorkspace() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<"templates" | "rules" | "instances">("templates");
  const [showTemplate, setShowTemplate] = useState(false);
  const [showRule, setShowRule] = useState(false);
  const [preview, setPreview] = useState<Instance | Template | null>(null);
  const [presetType, setPresetType] = useState(presets[0].type);
  const [templateName, setTemplateName] = useState(presets[0].name);
  const [templateContent, setTemplateContent] = useState(presets[0].content);
  const [advancedTemplate, setAdvancedTemplate] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<Bootstrap>("GET"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить документы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeTypes = useMemo(() => {
    const types = new Set(data?.documents.templates.map((item) => item.type) || []);
    return [...types].sort((a, b) => a.localeCompare(b, "ru"));
  }, [data]);

  const templateNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const template of data?.documents.templates || []) {
      if (!map.has(template.type) || template.status === "active") map.set(template.type, template.name);
    }
    return map;
  }, [data]);

  async function perform(action: string, payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setError("");
    try {
      await api("POST", { action, payload });
      setNotice(success);
      await load();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Операция не выполнена");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openTemplateDialog() {
    const preset = presets[0];
    setPresetType(preset.type);
    setTemplateName(preset.name);
    setTemplateContent(preset.content);
    setAdvancedTemplate(false);
    setShowTemplate(true);
  }

  function changePreset(nextType: string) {
    const preset = presets.find((item) => item.type === nextType) || presets[0];
    setPresetType(preset.type);
    setTemplateName(preset.name);
    setTemplateContent(preset.content);
  }

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const success = await perform("create-document-template", {
      templateType: presetType === "custom"
        ? String(form.get("customType") || "").trim()
        : presetType,
      name: templateName.trim(),
      legalEntity: String(form.get("legalEntity") || "").trim(),
      effectiveFrom: String(form.get("effectiveFrom") || "").trim(),
      effectiveTo: String(form.get("effectiveTo") || "").trim(),
      contentHtml: templateContent.trim(),
    }, "Новая версия бланка создана как черновик");
    if (success) setShowTemplate(false);
  }

  async function createRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tri = (name: string) => {
      const value = String(form.get(name) || "any");
      return value === "yes" ? true : value === "no" ? false : undefined;
    };
    const success = await perform("create-document-rule", {
      name: String(form.get("name") || "").trim(),
      eventCode: "approval.completed",
      requestKind: String(form.get("requestKind") || "").trim(),
      requiresBusinessTrip: tri("requiresBusinessTrip"),
      requiresWaybill: tri("requiresWaybill"),
      requiresConsignmentNote: tri("requiresConsignmentNote"),
      templateType: String(form.get("templateType") || "").trim(),
      sequence: Number(form.get("sequence") || 1),
      required: form.get("required") === "on",
    }, "Правило включения документа сохранено");
    if (success) setShowRule(false);
  }

  if (loading && !data) return <main className={styles.state}>Загрузка документов…</main>;
  if (!data) {
    return (
      <main className={styles.state}>
        <h1>Документы</h1>
        <p className={styles.error}>{error || "Нет доступа"}</p>
        <button type="button" onClick={() => void load()}>Повторить</button>
      </main>
    );
  }

  const { templates, rules, instances, canManage } = data.documents;
  const eligibleRequests = data.requests.filter((request) =>
    ["approved", "planned", "in_progress", "completed"].includes(request.status));
  const query = search.trim().toLowerCase();
  const visibleTemplates = templates.filter((item) =>
    !query || [item.name, item.type, `v${item.version}`].some((value) => value.toLowerCase().includes(query)));
  const visibleInstances = instances.filter((item) =>
    !query || [
      item.templateName,
      item.documentType,
      item.sourceSnapshot.request?.number,
      item.sourceSnapshot.request?.purpose,
    ].some((value) => value?.toLowerCase().includes(query)));

  return (
    <main className={styles.app}>
      <header className={styles.header} aria-hidden="true" />
      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {error ? <div className={styles.errorBar}>{error}</div> : null}

      <section className={styles.content}>
        <div className={styles.metrics}>
          <Metric label="Бланки" value={templates.length} />
          <Metric label="Действующие" value={templates.filter((item) => item.status === "active").length} />
          <Metric label="Правила комплекта" value={rules.filter((item) => item.active).length} />
          <Metric label="Готовые документы" value={instances.length} />
        </div>

        <div className={styles.tabs}>
          <button type="button" className={mode === "templates" ? styles.active : ""} onClick={() => setMode("templates")}>Бланки</button>
          <button type="button" className={mode === "rules" ? styles.active : ""} onClick={() => setMode("rules")}>Что входит в комплект</button>
          <button type="button" className={mode === "instances" ? styles.active : ""} onClick={() => setMode("instances")}>Готовые документы</button>
        </div>

        {mode !== "rules" ? (
          <div className={styles.searchBar}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по названию, типу или номеру заявки" />
            <span>Найдено: {mode === "templates" ? visibleTemplates.length : visibleInstances.length}</span>
          </div>
        ) : null}

        {mode === "templates" ? (
          <>
            <div className={styles.toolbar}>
              <div>
                <h2>Бланки и версии</h2>
                <p>Новая редакция создаётся отдельной версией. Старые документы сохраняются без изменений.</p>
              </div>
              {canManage ? <button type="button" onClick={openTemplateDialog}>Добавить версию</button> : null}
            </div>
            <Table headers={["Документ", "Версия", "Период действия", "Статус", "Действия"]} empty={visibleTemplates.length === 0}>
              {visibleTemplates.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.name}</b><small>Код: {item.type}</small></td>
                  <td>Версия {item.version}</td>
                  <td>{formatDate(item.effectiveFrom)} — {formatDate(item.effectiveTo)}</td>
                  <td><Badge value={item.status} /></td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => setPreview(item)}>Посмотреть</button>
                      {canManage && item.status !== "active" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void perform(
                            "activate-document-template",
                            { templateId: item.id },
                            `Версия ${item.version} введена в действие`,
                          )}
                        >
                          Ввести в действие
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        ) : null}

        {mode === "rules" ? (
          <>
            <div className={styles.toolbar}>
              <div>
                <h2>Состав комплекта</h2>
                <p>Система добавляет документ только при выполнении указанных условий.</p>
              </div>
              {canManage ? <button type="button" onClick={() => setShowRule(true)}>Добавить правило</button> : null}
            </div>
            <Table headers={["Порядок", "Документ", "Когда добавляется", "Обязательный", "Статус"]} empty={rules.length === 0}>
              {rules.map((item) => (
                <tr key={item.id}>
                  <td>{item.sequence}</td>
                  <td><b>{templateNames.get(item.templateType) || item.templateType}</b><small>{item.name}</small></td>
                  <td>{[
                    item.requestKind ? `перевозка: ${requestKindLabels[item.requestKind] || item.requestKind}` : "любая перевозка",
                    item.requiresBusinessTrip === undefined ? null : `командировка: ${item.requiresBusinessTrip ? "да" : "нет"}`,
                    item.requiresWaybill === undefined ? null : `путевой лист: ${item.requiresWaybill ? "да" : "нет"}`,
                    item.requiresConsignmentNote === undefined ? null : `ТТН: ${item.requiresConsignmentNote ? "да" : "нет"}`,
                  ].filter(Boolean).join(" · ")}</td>
                  <td>{item.required ? "Да" : "Нет"}</td>
                  <td>{item.active ? "Действует" : "Отключено"}</td>
                </tr>
              ))}
            </Table>
          </>
        ) : null}

        {mode === "instances" ? (
          <>
            <div className={styles.toolbar}>
              <div>
                <h2>Готовые документы</h2>
                <p>Сформированный экземпляр больше не меняется. При корректировке создаётся новая версия.</p>
              </div>
            </div>

            {canManage ? (
              <div className={styles.generateBox}>
                <label>
                  <span>Заявка</span>
                  <select value={selectedRequestId} onChange={(event) => setSelectedRequestId(event.target.value)}>
                    <option value="">Выберите утверждённую заявку</option>
                    {eligibleRequests.map((item) => (
                      <option key={item.id} value={item.id}>{item.number} · {item.purpose}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busy || !selectedRequestId}
                  onClick={() => void perform(
                    "generate-document-package",
                    { requestId: selectedRequestId },
                    "Комплект документов сформирован",
                  )}
                >
                  Сформировать комплект
                </button>
              </div>
            ) : null}

            <Table headers={["Документ", "Заявка", "Бланк", "Создан", "Действия"]} empty={visibleInstances.length === 0}>
              {visibleInstances.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.templateName || item.documentType}</b></td>
                  <td>{item.sourceSnapshot.request?.number || item.requestId || "—"}<small>{item.sourceSnapshot.request?.purpose}</small></td>
                  <td>{item.templateName}<small>Версия {item.templateVersion}</small></td>
                  <td>{new Date(item.generatedAt).toLocaleString("ru-RU")}</td>
                  <td><button type="button" onClick={() => setPreview(item)}>Открыть</button></td>
                </tr>
              ))}
            </Table>
          </>
        ) : null}
      </section>

      {showTemplate ? (
        <Modal title="Новая версия бланка" close={() => setShowTemplate(false)}>
          <form onSubmit={createTemplate} className={styles.form}>
            <label>
              Вид документа
              <select value={presetType} onChange={(event) => changePreset(event.target.value)}>
                {presets.map((preset) => (
                  <option key={preset.type} value={preset.type}>{preset.name}</option>
                ))}
              </select>
              <small>{presets.find((item) => item.type === presetType)?.description}</small>
            </label>

            {presetType === "custom" ? (
              <label>
                Код вида документа
                <input name="customType" required placeholder="Например: payment_invoice" />
              </label>
            ) : null}

            <label>
              Название бланка
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
            </label>
            <label>
              Юридическое лицо
              <input name="legalEntity" defaultValue="ТОО AA Mining" />
            </label>
            <div className={styles.grid2}>
              <label>Действует с<input type="date" name="effectiveFrom" /></label>
              <label>Действует до<input type="date" name="effectiveTo" /></label>
            </div>

            <div className={styles.templatePreview} dangerouslySetInnerHTML={{ __html: templateContent }} />

            <label className={styles.checkbox}>
              <input type="checkbox" checked={advancedTemplate} onChange={(event) => setAdvancedTemplate(event.target.checked)} />
              Расширенная настройка содержимого
            </label>

            {advancedTemplate ? (
              <label>
                Содержимое печатной формы
                <textarea
                  value={templateContent}
                  onChange={(event) => setTemplateContent(event.target.value)}
                  rows={15}
                />
                <small>Поля заявки указываются как {"{{request.number}}"}, {"{{request.purpose}}"} и другие.</small>
              </label>
            ) : null}

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowTemplate(false)}>Отмена</button>
              <button type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Создать черновик"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showRule ? (
        <Modal title="Когда добавлять документ" close={() => setShowRule(false)}>
          <form onSubmit={createRule} className={styles.form}>
            <label>
              Документ
              <select name="templateType" required>
                <option value="">Выберите документ</option>
                {activeTypes.map((type) => (
                  <option key={type} value={type}>{templateNames.get(type) || type}</option>
                ))}
              </select>
            </label>
            <label>
              Название правила
              <input name="name" required placeholder="Например: Путевой лист для каждой поездки" />
            </label>
            <label>
              Тип перевозки
              <select name="requestKind">
                <option value="">Любой</option>
                <option value="documents">Документы</option>
                <option value="passengers">Пассажиры</option>
                <option value="cargo">Груз</option>
                <option value="mixed">Пассажиры и груз</option>
              </select>
            </label>
            <div className={styles.grid3}>
              <TriState name="requiresBusinessTrip" label="Командировка" />
              <TriState name="requiresWaybill" label="Путевой лист" />
              <TriState name="requiresConsignmentNote" label="ТТН" />
            </div>
            <label>Порядок в комплекте<input type="number" name="sequence" min="1" defaultValue="1" /></label>
            <label className={styles.checkbox}>
              <input type="checkbox" name="required" defaultChecked />
              Обязательный документ
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowRule(false)}>Отмена</button>
              <button type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Сохранить правило"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {preview ? (
        <Modal title={"templateName" in preview ? preview.templateName : preview.name} close={() => setPreview(null)}>
          <div className={styles.preview} dangerouslySetInnerHTML={{ __html: preview.contentHtml }} />
          <div className={styles.modalActions}>
            <button type="button" onClick={() => setPreview(null)}>Закрыть</button>
            <button
              type="button"
              onClick={() => printDocument(
                "templateName" in preview ? preview.templateName : preview.name,
                preview.contentHtml,
              )}
            >
              Печать / сохранить PDF
            </button>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className={styles.metric}><span>{label}</span><b>{value}</b></div>;
}

function Badge({ value }: { value: string }) {
  return (
    <span className={`${styles.badge} ${styles[value] || ""}`}>
      {value === "draft" ? "Черновик" : value === "active" ? "Действует" : "Архив"}
    </span>
  );
}

function Table({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: ReactNode;
  empty: boolean;
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {empty ? <tr><td colSpan={headers.length} className={styles.empty}>Записей пока нет</td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}

function TriState({ name, label }: { name: string; label: string }) {
  return (
    <label>
      {label}
      <select name={name} defaultValue="any">
        <option value="any">Не учитывать</option>
        <option value="yes">Требуется</option>
        <option value="no">Не требуется</option>
      </select>
    </label>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.currentTarget === event.target && close()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button type="button" onClick={close} aria-label="Закрыть">×</button></header>
        {children}
      </div>
    </div>
  );
}
