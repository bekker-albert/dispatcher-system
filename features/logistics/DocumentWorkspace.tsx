"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
  documents: { templates: Template[]; rules: Rule[]; instances: Instance[]; canManage: boolean };
};

async function api<T>(method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await fetch("/api/logistics", {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: method === "POST"
      ? { "content-type": "application/json", "x-dispatcher-request": "same-origin", "x-correlation-id": crypto.randomUUID() }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Ошибка сервера: ${response.status}`);
  return payload;
}

const templateExample = `<section>
  <h1>Служебная записка</h1>
  <p><b>Заявка:</b> {{request.number}}</p>
  <p><b>Автор:</b> {{request.authorDisplayName}}</p>
  <p><b>Цель:</b> {{request.purpose}}</p>
  <p><b>Проект:</b> {{request.project}}</p>
  <p><b>Период:</b> {{request.desiredDepartureAt}} — {{request.desiredReturnAt}}</p>
  <p><b>Сформировано:</b> {{generated.at}}, {{generated.by}}</p>
</section>`;

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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await api<Bootstrap>("GET")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить документы"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);

  const activeTypes = useMemo(() => {
    const types = new Set(data?.documents.templates.map((item) => item.type) || []);
    return [...types].sort((a, b) => a.localeCompare(b, "ru"));
  }, [data]);

  async function perform(action: string, payload: Record<string, unknown>, success: string) {
    setBusy(true); setError("");
    try { await api("POST", { action, payload }); setNotice(success); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Операция не выполнена"); }
    finally { setBusy(false); }
  }

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await perform("create-document-template", {
      templateType: String(form.get("templateType") || "").trim(),
      name: String(form.get("name") || "").trim(),
      legalEntity: String(form.get("legalEntity") || "").trim(),
      effectiveFrom: String(form.get("effectiveFrom") || "").trim(),
      effectiveTo: String(form.get("effectiveTo") || "").trim(),
      contentHtml: String(form.get("contentHtml") || "").trim(),
    }, "Черновик новой версии шаблона создан");
    setShowTemplate(false);
  }

  async function createRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tri = (name: string) => {
      const value = String(form.get(name) || "any");
      return value === "yes" ? true : value === "no" ? false : undefined;
    };
    await perform("create-document-rule", {
      name: String(form.get("name") || "").trim(),
      eventCode: "approval.completed",
      requestKind: String(form.get("requestKind") || "").trim(),
      requiresBusinessTrip: tri("requiresBusinessTrip"),
      requiresWaybill: tri("requiresWaybill"),
      requiresConsignmentNote: tri("requiresConsignmentNote"),
      templateType: String(form.get("templateType") || "").trim(),
      sequence: Number(form.get("sequence") || 1),
      required: form.get("required") === "on",
    }, "Правило комплекта документов сохранено");
    setShowRule(false);
  }

  if (loading && !data) return <main className={styles.state}>Загрузка документного контура…</main>;
  if (!data) return <main className={styles.state}><h1>Документы логистики</h1><p className={styles.error}>{error || "Нет доступа"}</p><button onClick={() => void load()}>Повторить</button></main>;

  const { templates, rules, instances, canManage } = data.documents;
  const eligibleRequests = data.requests.filter((request) => ["approved", "planned", "in_progress", "completed"].includes(request.status));

  return <main className={styles.app}>
    <header className={styles.header}>
      <div><span>AA Mining · серверный документный контур</span><h1>Документы логистики</h1><p>Версии шаблонов → правила комплекта → неизменяемые экземпляры</p></div>
      <nav><a href="/logistics">Заявки и рейсы</a><a href="/logistics/release">Выпуск</a><a href="/admin">Администрирование</a></nav>
    </header>
    {notice && <div className={styles.notice}>{notice}</div>}
    {error && <div className={styles.errorBar}>{error}</div>}
    <section className={styles.content}>
      <div className={styles.metrics}>
        <Metric label="Версии шаблонов" value={templates.length} />
        <Metric label="Активные шаблоны" value={templates.filter((item) => item.status === "active").length} />
        <Metric label="Правила комплекта" value={rules.filter((item) => item.active).length} />
        <Metric label="Экземпляры" value={instances.length} />
      </div>
      <div className={styles.tabs}>
        <button className={mode === "templates" ? styles.active : ""} onClick={() => setMode("templates")}>Шаблоны и версии</button>
        <button className={mode === "rules" ? styles.active : ""} onClick={() => setMode("rules")}>Комплекты и правила</button>
        <button className={mode === "instances" ? styles.active : ""} onClick={() => setMode("instances")}>Сформированные документы</button>
      </div>

      {mode === "templates" && <>
        <div className={styles.toolbar}><div><h2>Версии шаблонов</h2><p>Новая редакция всегда создаётся отдельной версией. Активация архивирует предыдущую активную версию того же типа.</p></div>{canManage && <button onClick={() => setShowTemplate(true)}>Новая версия</button>}</div>
        <Table headers={["Тип", "Название", "Версия", "Статус", "Переменные", "Контрольная сумма", "Действия"]}>
          {templates.map((item) => <tr key={item.id}><td>{item.type}</td><td><b>{item.name}</b><small>{item.effectiveFrom || "без даты"} — {item.effectiveTo || "без ограничения"}</small></td><td>v{item.version}</td><td><Badge value={item.status} /></td><td>{item.variables.length ? item.variables.join(", ") : "—"}</td><td><code>{item.checksum.slice(0, 12)}…</code></td><td><div className={styles.actions}><button onClick={() => setPreview(item)}>Предпросмотр</button>{canManage && item.status !== "active" && <button disabled={busy} onClick={() => void perform("activate-document-template", { templateId: item.id }, `Активирована версия ${item.version}`)}>Активировать</button>}</div></td></tr>)}
        </Table>
      </>}

      {mode === "rules" && <>
        <div className={styles.toolbar}><div><h2>Состав комплекта</h2><p>Документ включается только тогда, когда правило соответствует типу и признакам утверждённой заявки.</p></div>{canManage && <button onClick={() => setShowRule(true)}>Добавить правило</button>}</div>
        <Table headers={["Порядок", "Правило", "Условия", "Тип шаблона", "Обязательный", "Статус"]}>
          {rules.map((item) => <tr key={item.id}><td>{item.sequence}</td><td><b>{item.name}</b><small>{item.eventCode}</small></td><td>{[
            item.requestKind ? `тип: ${item.requestKind}` : "любой тип",
            item.requiresBusinessTrip === undefined ? "командировка: любая" : `командировка: ${item.requiresBusinessTrip ? "да" : "нет"}`,
            item.requiresWaybill === undefined ? "путевой лист: любой" : `путевой лист: ${item.requiresWaybill ? "да" : "нет"}`,
            item.requiresConsignmentNote === undefined ? "ТТН: любая" : `ТТН: ${item.requiresConsignmentNote ? "да" : "нет"}`,
          ].join(" · ")}</td><td>{item.templateType}</td><td>{item.required ? "Да" : "Нет"}</td><td>{item.active ? "Активно" : "Отключено"}</td></tr>)}
        </Table>
      </>}

      {mode === "instances" && <>
        <div className={styles.toolbar}><div><h2>Неизменяемые экземпляры</h2><p>Каждый документ хранит точную версию шаблона, снимок исходных данных и SHA-256.</p></div></div>
        {canManage && <div className={styles.generateBox}><label>Утверждённая заявка<select id="document-request"><option value="">Выберите заявку</option>{eligibleRequests.map((item) => <option key={item.id} value={item.id}>{item.number} · {item.purpose}</option>)}</select></label><button disabled={busy} onClick={() => { const select = document.getElementById("document-request") as HTMLSelectElement | null; if (select?.value) void perform("generate-document-package", { requestId: select.value }, "Комплект документов сформирован"); }}>Сформировать комплект</button></div>}
        <Table headers={["Документ", "Заявка", "Шаблон", "Создан", "Контрольная сумма", "Действия"]}>
          {instances.map((item) => <tr key={item.id}><td><b>{item.documentType}</b><small>{item.status}</small></td><td>{item.sourceSnapshot.request?.number || item.requestId || "—"}<small>{item.sourceSnapshot.request?.purpose}</small></td><td>{item.templateName}<small>v{item.templateVersion}</small></td><td>{new Date(item.generatedAt).toLocaleString("ru-RU")}</td><td><code>{item.checksum.slice(0, 12)}…</code></td><td><button onClick={() => setPreview(item)}>Открыть / печать</button></td></tr>)}
        </Table>
      </>}
    </section>

    {showTemplate && <Modal title="Новая версия шаблона" close={() => setShowTemplate(false)}><form onSubmit={createTemplate} className={styles.form}><label>Тип документа<input name="templateType" required placeholder="service_note" /></label><label>Название<input name="name" required placeholder="Служебная записка" /></label><label>Юридическое лицо<input name="legalEntity" defaultValue="ТОО AA Mining" /></label><div className={styles.grid2}><label>Действует с<input type="date" name="effectiveFrom" /></label><label>Действует до<input type="date" name="effectiveTo" /></label></div><label>HTML-шаблон<textarea name="contentHtml" required defaultValue={templateExample} rows={16} /><small>Переменные указываются в виде {"{{request.number}}"}.</small></label><div className={styles.modalActions}><button type="button" onClick={() => setShowTemplate(false)}>Отмена</button><button disabled={busy}>Создать черновик</button></div></form></Modal>}

    {showRule && <Modal title="Правило комплекта документов" close={() => setShowRule(false)}><form onSubmit={createRule} className={styles.form}><label>Название правила<input name="name" required placeholder="Служебная записка после утверждения" /></label><label>Тип шаблона<select name="templateType" required><option value="">Выберите тип</option>{activeTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Тип заявки<select name="requestKind"><option value="">Любой</option><option value="documents">Документы</option><option value="passengers">Пассажиры</option><option value="cargo">Груз</option><option value="mixed">Смешанная</option></select></label><div className={styles.grid3}><TriState name="requiresBusinessTrip" label="Командировка" /><TriState name="requiresWaybill" label="Путевой лист" /><TriState name="requiresConsignmentNote" label="ТТН" /></div><label>Порядок<input type="number" name="sequence" min="1" defaultValue="1" /></label><label className={styles.checkbox}><input type="checkbox" name="required" defaultChecked />Обязательный документ</label><div className={styles.modalActions}><button type="button" onClick={() => setShowRule(false)}>Отмена</button><button disabled={busy}>Сохранить правило</button></div></form></Modal>}

    {preview && <Modal title={"contentHtml" in preview ? ("templateName" in preview ? preview.templateName : preview.name) : "Предпросмотр"} close={() => setPreview(null)}><div className={styles.preview} dangerouslySetInnerHTML={{ __html: preview.contentHtml }} /><div className={styles.modalActions}><button onClick={() => setPreview(null)}>Закрыть</button>{"templateName" in preview && <button onClick={() => window.print()}>Печать / PDF</button>}</div></Modal>}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className={styles.metric}><span>{label}</span><b>{value}</b></div>; }
function Badge({ value }: { value: string }) { return <span className={`${styles.badge} ${styles[value] || ""}`}>{value === "draft" ? "Черновик" : value === "active" ? "Активен" : "Архив"}</span>; }
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className={styles.tableWrap}><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function TriState({ name, label }: { name: string; label: string }) { return <label>{label}<select name={name} defaultValue="any"><option value="any">Любое значение</option><option value="yes">Да</option><option value="no">Нет</option></select></label>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className={styles.backdrop} onMouseDown={(event) => event.currentTarget === event.target && close()}><div className={styles.modal}><header><h2>{title}</h2><button onClick={close}>×</button></header>{children}</div></div>; }
