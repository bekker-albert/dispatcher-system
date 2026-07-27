"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./server-logistics.module.css";

type RequestStatus = "draft" | "submitted" | "returned" | "approved" | "rejected" | "planned" | "in_progress" | "completed" | "cancelled";
type RequestKind = "passengers" | "cargo" | "documents" | "mixed";
type Stop = { sequence: number; type: string; name: string; address?: string; plannedAt?: string };
type LogisticsRequest = {
  id: string;
  number: string;
  version: number;
  status: RequestStatus;
  kind: RequestKind;
  authorDisplayName: string;
  department?: string;
  project?: string;
  costCenter?: string;
  purpose: string;
  priority: "normal" | "urgent" | "critical";
  desiredDepartureAt?: string;
  desiredReturnAt?: string;
  passengerCount?: number;
  cargoDescription?: string;
  cargoWeightKg?: number;
  cargoVolumeM3?: number;
  requiresBusinessTrip: boolean;
  requiresWaybill: boolean;
  requiresConsignmentNote: boolean;
  notes?: string;
  stops: Stop[];
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};
type Bootstrap = {
  user: { id: string; displayName: string; login?: string; isSuperuser?: boolean; roles?: string[] };
  requests: LogisticsRequest[];
  summary: { totalRequests: number; pendingRequests: number; activeTrips: number; activeTemplates: number; draftConfigurations: number };
};

const labels: Record<RequestStatus, string> = {
  draft: "Черновик", submitted: "На согласовании", returned: "Возвращена", approved: "Согласована",
  rejected: "Отклонена", planned: "Запланирована", in_progress: "Выполняется", completed: "Завершена", cancelled: "Отменена",
};
const kindLabels: Record<RequestKind, string> = { passengers: "Пассажиры", cargo: "Груз", documents: "Документы", mixed: "Смешанная" };
const allowedActions: Partial<Record<RequestStatus, Array<{ status: RequestStatus; label: string; reason?: boolean }>>> = {
  draft: [{ status: "submitted", label: "Отправить на согласование" }, { status: "cancelled", label: "Отменить", reason: true }],
  submitted: [{ status: "returned", label: "Вернуть автору", reason: true }, { status: "approved", label: "Согласовать" }, { status: "rejected", label: "Отклонить", reason: true }],
  returned: [{ status: "submitted", label: "Отправить повторно" }, { status: "cancelled", label: "Отменить", reason: true }],
  approved: [{ status: "planned", label: "Создать план рейса" }, { status: "cancelled", label: "Отменить", reason: true }],
  planned: [{ status: "in_progress", label: "Начать рейс" }, { status: "cancelled", label: "Отменить", reason: true }],
  in_progress: [{ status: "completed", label: "Завершить рейс" }, { status: "cancelled", label: "Аварийно отменить", reason: true }],
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

async function api<T>(method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await fetch("/api/logistics", {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: method === "POST" ? { "content-type": "application/json", "x-dispatcher-request": "same-origin", "x-correlation-id": crypto.randomUUID() } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || `Ошибка сервера: ${response.status}`);
  return payload;
}

export default function ServerLogisticsWorkspace() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await api<Bootstrap>("GET")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить данные"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);

  const current = useMemo(() => data?.requests.find((item) => item.id === selected) ?? null, [data, selected]);

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    try {
      await api("POST", { action: "create-request", payload: {
        kind: value("kind"), purpose: value("purpose"), department: value("department"), project: value("project"), costCenter: value("costCenter"),
        priority: value("priority"), desiredDepartureAt: value("desiredDepartureAt"), desiredReturnAt: value("desiredReturnAt"),
        passengerCount: value("passengerCount"), cargoDescription: value("cargoDescription"), cargoWeightKg: value("cargoWeightKg"), cargoVolumeM3: value("cargoVolumeM3"),
        requiresBusinessTrip: form.get("requiresBusinessTrip") === "on", requiresWaybill: form.get("requiresWaybill") === "on", requiresConsignmentNote: form.get("requiresConsignmentNote") === "on",
        notes: value("notes"), stops: [
          { type: "origin", name: value("origin"), address: value("originAddress"), plannedAt: value("desiredDepartureAt") },
          { type: "destination", name: value("destination"), address: value("destinationAddress"), plannedAt: value("desiredReturnAt") },
        ],
      }});
      event.currentTarget.reset(); setShowCreate(false); setNotice("Заявка сохранена на сервере"); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось создать заявку"); }
    finally { setBusy(false); }
  }

  async function transition(request: LogisticsRequest, status: RequestStatus, needsReason?: boolean) {
    const reason = needsReason ? window.prompt("Укажите причину:")?.trim() : undefined;
    if (needsReason && !reason) return;
    setBusy(true); setError("");
    try {
      await api("POST", { action: "transition-request", payload: { requestId: request.id, status, reason } });
      setNotice(`Статус изменён: ${labels[status]}`); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось изменить статус"); }
    finally { setBusy(false); }
  }

  if (loading && !data) return <main className={styles.state}>Загрузка серверных данных…</main>;
  if (!data) return <main className={styles.state}><h1>Логистика Газели</h1><p className={styles.error}>{error || "Нет доступа к серверным данным"}</p><button onClick={() => void load()}>Повторить</button></main>;

  return <main className={styles.app}>
    <header className={styles.header}>
      <div><span>AA Mining · серверный контур</span><h1>Логистика Газели</h1><p>Заявка → согласование → планирование → выполнение → закрытие</p></div>
      <div className={styles.user}><b>{data.user.displayName}</b><small>{data.user.login || "Авторизованный пользователь"}</small><a href="/admin">Расширенная админка</a></div>
    </header>
    {notice && <div className={styles.notice}>{notice}</div>}{error && <div className={styles.errorBar}>{error}</div>}
    <section className={styles.content}>
      <div className={styles.metrics}><Metric title="Заявки" value={data.summary.totalRequests} /><Metric title="На согласовании" value={data.summary.pendingRequests} /><Metric title="Активные рейсы" value={data.summary.activeTrips} /><Metric title="Активные шаблоны" value={data.summary.activeTemplates} /><Metric title="Черновики настроек" value={data.summary.draftConfigurations} /></div>
      <div className={styles.toolbar}><div><h2>Транспортные заявки</h2><p>Все изменения записываются в серверную базу и аудит.</p></div><button className={styles.primary} onClick={() => setShowCreate(true)}>Создать заявку</button></div>
      <div className={styles.layout}>
        <div className={styles.tableWrap}><table><thead><tr><th>Номер</th><th>Тип</th><th>Маршрут</th><th>Автор</th><th>Дата</th><th>Статус</th></tr></thead><tbody>{data.requests.length === 0 ? <tr><td colSpan={6} className={styles.empty}>Заявок пока нет</td></tr> : data.requests.map((row) => <tr key={row.id} className={selected === row.id ? styles.selected : ""} onClick={() => setSelected(row.id)}><td><b>{row.number}</b><small>версия {row.version}</small></td><td>{kindLabels[row.kind]}</td><td>{row.stops.map((stop) => stop.name).join(" → ")}<small>{row.purpose}</small></td><td>{row.authorDisplayName}</td><td>{formatDate(row.createdAt)}</td><td><span className={`${styles.badge} ${styles[row.status]}`}>{labels[row.status]}</span></td></tr>)}</tbody></table></div>
        <aside className={styles.detail}>{current ? <><div className={styles.detailHead}><div><small>{current.number}</small><h3>{current.purpose}</h3></div><button onClick={() => setSelected(null)}>×</button></div><dl><dt>Статус</dt><dd>{labels[current.status]}</dd><dt>Тип</dt><dd>{kindLabels[current.kind]}</dd><dt>Автор</dt><dd>{current.authorDisplayName}</dd><dt>Подразделение</dt><dd>{current.department || "—"}</dd><dt>Проект</dt><dd>{current.project || "—"}</dd><dt>Маршрут</dt><dd>{current.stops.map((stop) => stop.name).join(" → ")}</dd><dt>Плановый выезд</dt><dd>{formatDate(current.desiredDepartureAt)}</dd><dt>Плановое возвращение</dt><dd>{formatDate(current.desiredReturnAt)}</dd><dt>Документы</dt><dd>{[current.requiresBusinessTrip && "Командировка", current.requiresWaybill && "Путевой лист", current.requiresConsignmentNote && "ТТН"].filter(Boolean).join(", ") || "Не определены"}</dd></dl><div className={styles.actions}>{(allowedActions[current.status] || []).map((action) => <button key={action.status} disabled={busy} onClick={() => void transition(current, action.status, action.reason)}>{action.label}</button>)}</div></> : <div className={styles.hint}>Выберите заявку, чтобы увидеть карточку и доступные действия.</div>}</aside>
      </div>
    </section>
    {showCreate && <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && setShowCreate(false)}><form className={styles.modal} onSubmit={createRequest}><div className={styles.modalHead}><h2>Новая заявка</h2><button type="button" onClick={() => setShowCreate(false)}>×</button></div><div className={styles.formGrid}><Field label="Тип перевозки"><select name="kind" required defaultValue="documents"><option value="documents">Документы</option><option value="passengers">Пассажиры</option><option value="cargo">Груз</option><option value="mixed">Смешанная</option></select></Field><Field label="Приоритет"><select name="priority" defaultValue="normal"><option value="normal">Обычный</option><option value="urgent">Срочный</option><option value="critical">Критический</option></select></Field></div><Field label="Цель поездки"><textarea name="purpose" required /></Field><div className={styles.formGrid}><Field label="Откуда"><input name="origin" required /></Field><Field label="Куда"><input name="destination" required /></Field><Field label="Адрес отправления"><input name="originAddress" /></Field><Field label="Адрес назначения"><input name="destinationAddress" /></Field><Field label="Плановый выезд"><input type="datetime-local" name="desiredDepartureAt" /></Field><Field label="Плановое возвращение"><input type="datetime-local" name="desiredReturnAt" /></Field><Field label="Подразделение"><input name="department" /></Field><Field label="Проект / участок"><input name="project" /></Field><Field label="Центр затрат"><input name="costCenter" /></Field><Field label="Пассажиров"><input type="number" min="0" name="passengerCount" /></Field><Field label="Масса груза, кг"><input type="number" min="0" step="any" name="cargoWeightKg" /></Field><Field label="Объём груза, м³"><input type="number" min="0" step="any" name="cargoVolumeM3" /></Field></div><Field label="Описание груза"><input name="cargoDescription" /></Field><Field label="Примечание"><textarea name="notes" /></Field><div className={styles.checks}><label><input type="checkbox" name="requiresBusinessTrip" />Командировка</label><label><input type="checkbox" name="requiresWaybill" defaultChecked />Путевой лист</label><label><input type="checkbox" name="requiresConsignmentNote" />ТТН</label></div><div className={styles.modalActions}><button type="button" onClick={() => setShowCreate(false)}>Отмена</button><button className={styles.primary} disabled={busy}>{busy ? "Сохранение…" : "Сохранить черновик"}</button></div></form></div>}
  </main>;
}

function Metric({ title, value }: { title: string; value: number }) { return <div className={styles.metric}><span>{title}</span><b>{value}</b></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
