"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import styles from "./server-logistics.module.css";

type RequestStatus = "draft" | "submitted" | "returned" | "approved" | "rejected" | "planned" | "in_progress" | "completed" | "cancelled";
type RequestKind = "passengers" | "cargo" | "documents" | "mixed";
type TripStatus = "planned" | "release_pending" | "ready" | "in_progress" | "closing" | "completed" | "cancelled";
type Stop = { sequence: number; type: string; name: string; address?: string; plannedAt?: string };
type LogisticsRequest = {
  id: string; number: string; version: number; status: RequestStatus; kind: RequestKind;
  authorDisplayName: string; department?: string; project?: string; costCenter?: string; purpose: string;
  priority: "normal" | "urgent" | "critical"; desiredDepartureAt?: string; desiredReturnAt?: string;
  passengerCount?: number; cargoDescription?: string; cargoWeightKg?: number; cargoVolumeM3?: number;
  requiresBusinessTrip: boolean; requiresWaybill: boolean; requiresConsignmentNote: boolean; notes?: string;
  stops: Stop[]; submittedAt?: string; approvedAt?: string; createdAt: string; updatedAt: string;
};
type LogisticsTrip = {
  id: string; number: string; status: TripStatus; requestId?: string; requestNumber?: string;
  vehicleId?: string; driverUserId?: string; plannedDepartureAt?: string; plannedReturnAt?: string;
  actualDepartureAt?: string; actualReturnAt?: string; plannedDistanceKm?: number; actualDistanceKm?: number;
  plannedFuelLiters?: number; actualFuelLiters?: number; createdAt: string; updatedAt: string;
};
type Bootstrap = {
  user: { id: string; displayName: string; login?: string; role?: string; canManageUsers?: boolean };
  requests: LogisticsRequest[];
  trips: LogisticsTrip[];
  summary: { totalRequests: number; pendingRequests: number; activeTrips: number; activeTemplates: number; draftConfigurations: number };
};

const requestLabels: Record<RequestStatus, string> = {
  draft: "Черновик", submitted: "На согласовании", returned: "Возвращена", approved: "Согласована",
  rejected: "Отклонена", planned: "Запланирована", in_progress: "Выполняется", completed: "Завершена", cancelled: "Отменена",
};
const tripLabels: Record<TripStatus, string> = {
  planned: "Запланирован", release_pending: "Ожидает выпуска", ready: "Готов к выезду", in_progress: "В пути",
  closing: "Ожидает закрытия", completed: "Завершён", cancelled: "Отменён",
};
const kindLabels: Record<RequestKind, string> = { passengers: "Пассажиры", cargo: "Груз", documents: "Документы", mixed: "Смешанная" };
const tripActions: Partial<Record<TripStatus, Array<{ status: TripStatus; label: string; reason?: boolean; close?: boolean }>>> = {
  planned: [{ status: "release_pending", label: "Передать на выпуск" }, { status: "cancelled", label: "Отменить", reason: true }],
  release_pending: [{ status: "ready", label: "Разрешить выезд" }, { status: "cancelled", label: "Отменить", reason: true }],
  ready: [{ status: "in_progress", label: "Начать рейс" }, { status: "cancelled", label: "Отменить", reason: true }],
  in_progress: [{ status: "closing", label: "Вернулся / на закрытие" }, { status: "cancelled", label: "Аварийно отменить", reason: true }],
  closing: [{ status: "completed", label: "Закрыть рейс", close: true }],
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}
async function api<T>(method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await fetch("/api/logistics", {
    method, cache: "no-store", credentials: "same-origin",
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
  const [mode, setMode] = useState<"requests" | "trips">("requests");
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [tripForRequest, setTripForRequest] = useState<LogisticsRequest | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await api<Bootstrap>("GET")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить данные"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4000); return () => clearTimeout(timer); }, [notice]);

  const selectedRequest = useMemo(() => data?.requests.find((item) => item.id === selectedRequestId) ?? null, [data, selectedRequestId]);
  const selectedTrip = useMemo(() => data?.trips.find((item) => item.id === selectedTripId) ?? null, [data, selectedTripId]);
  const isApprover = data?.user.role === "admin" || data?.user.role === "dispatch-chief";

  async function perform(action: string, payload: Record<string, unknown>, success: string) {
    setBusy(true); setError("");
    try { await api("POST", { action, payload }); setNotice(success); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Операция не выполнена"); }
    finally { setBusy(false); }
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    await perform("create-request", {
      kind: value("kind"), purpose: value("purpose"), department: value("department"), project: value("project"), costCenter: value("costCenter"),
      priority: value("priority"), desiredDepartureAt: value("desiredDepartureAt"), desiredReturnAt: value("desiredReturnAt"),
      passengerCount: value("passengerCount"), cargoDescription: value("cargoDescription"), cargoWeightKg: value("cargoWeightKg"), cargoVolumeM3: value("cargoVolumeM3"),
      requiresBusinessTrip: form.get("requiresBusinessTrip") === "on", requiresWaybill: form.get("requiresWaybill") === "on",
      requiresConsignmentNote: form.get("requiresConsignmentNote") === "on", notes: value("notes"),
      stops: [
        { type: "origin", name: value("origin"), address: value("originAddress"), plannedAt: value("desiredDepartureAt") },
        { type: "destination", name: value("destination"), address: value("destinationAddress"), plannedAt: value("desiredReturnAt") },
      ],
    }, "Заявка сохранена на сервере");
    event.currentTarget.reset(); setShowCreateRequest(false);
  }

  async function submitRequest(request: LogisticsRequest) {
    await perform("submit-request", { requestId: request.id }, "Заявка отправлена на согласование");
  }
  async function decideRequest(request: LogisticsRequest, decision: "approved" | "returned" | "rejected") {
    const reason = decision === "approved" ? undefined : window.prompt("Укажите причину решения:")?.trim();
    if (decision !== "approved" && !reason) return;
    await perform("decide-request", { requestId: request.id, decision, reason }, `Решение сохранено: ${requestLabels[decision]}`);
  }
  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!tripForRequest) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    await perform("create-trip", {
      requestId: tripForRequest.id, vehicleId: value("vehicleId"), driverUserId: value("driverUserId"),
      plannedDepartureAt: value("plannedDepartureAt"), plannedReturnAt: value("plannedReturnAt"),
      plannedDistanceKm: value("plannedDistanceKm"), plannedFuelLiters: value("plannedFuelLiters"),
    }, "Рейс создан и связан с заявкой");
    setTripForRequest(null); setMode("trips");
  }
  async function transitionTrip(trip: LogisticsTrip, action: { status: TripStatus; reason?: boolean; close?: boolean }) {
    const reason = action.reason ? window.prompt("Укажите причину:")?.trim() : undefined;
    if (action.reason && !reason) return;
    let actualDistanceKm: string | undefined;
    let actualFuelLiters: string | undefined;
    if (action.close) {
      actualDistanceKm = window.prompt("Фактический пробег, км:", trip.actualDistanceKm?.toString() || "")?.trim();
      actualFuelLiters = window.prompt("Фактическое топливо, л:", trip.actualFuelLiters?.toString() || "")?.trim();
    }
    await perform("transition-trip", { tripId: trip.id, status: action.status, reason, actualDistanceKm, actualFuelLiters }, `Статус рейса: ${tripLabels[action.status]}`);
  }

  if (loading && !data) return <main className={styles.state}>Загрузка серверных данных…</main>;
  if (!data) return <main className={styles.state}><h1>Логистика Газели</h1><p className={styles.error}>{error || "Нет доступа к серверным данным"}</p><button onClick={() => void load()}>Повторить</button></main>;

  return <main className={styles.app}>
    <header className={styles.header}>
      <div><span>AA Mining · серверный контур</span><h1>Логистика Газели</h1><p>Заявка → согласование → рейс → выполнение → закрытие</p></div>
      <div className={styles.user}><b>{data.user.displayName}</b><small>{data.user.login || "Авторизованный пользователь"}</small><a href="/admin">Расширенная админка</a></div>
    </header>
    {notice && <div className={styles.notice}>{notice}</div>}{error && <div className={styles.errorBar}>{error}</div>}
    <section className={styles.content}>
      <div className={styles.metrics}><Metric title="Заявки" value={data.summary.totalRequests} /><Metric title="На согласовании" value={data.summary.pendingRequests} /><Metric title="Активные рейсы" value={data.summary.activeTrips} /><Metric title="Активные шаблоны" value={data.summary.activeTemplates} /><Metric title="Черновики настроек" value={data.summary.draftConfigurations} /></div>
      <div className={styles.modeTabs}><button className={mode === "requests" ? styles.modeActive : ""} onClick={() => setMode("requests")}>Заявки</button><button className={mode === "trips" ? styles.modeActive : ""} onClick={() => setMode("trips")}>Рейсы</button></div>

      {mode === "requests" ? <>
        <div className={styles.toolbar}><div><h2>Транспортные заявки</h2><p>Отправка и решения создают отдельные серверные экземпляры согласования.</p></div><button className={styles.primary} onClick={() => setShowCreateRequest(true)}>Создать заявку</button></div>
        <div className={styles.layout}>
          <RequestTable rows={data.requests} selectedId={selectedRequestId} onSelect={setSelectedRequestId} />
          <aside className={styles.detail}>{selectedRequest ? <RequestDetail request={selectedRequest} busy={busy} isApprover={Boolean(isApprover)} onClose={() => setSelectedRequestId(null)} onSubmit={submitRequest} onDecision={decideRequest} onCreateTrip={setTripForRequest} /> : <div className={styles.hint}>Выберите заявку, чтобы увидеть карточку и доступные действия.</div>}</aside>
        </div>
      </> : <>
        <div className={styles.toolbar}><div><h2>Рейсы</h2><p>Отдельные записи планирования и фактического выполнения.</p></div></div>
        <div className={styles.layout}>
          <TripTable rows={data.trips} selectedId={selectedTripId} onSelect={setSelectedTripId} />
          <aside className={styles.detail}>{selectedTrip ? <TripDetail trip={selectedTrip} busy={busy} onClose={() => setSelectedTripId(null)} onTransition={transitionTrip} /> : <div className={styles.hint}>Выберите рейс для просмотра и изменения статуса.</div>}</aside>
        </div>
      </>}
    </section>

    {showCreateRequest && <Modal title="Новая заявка" close={() => setShowCreateRequest(false)}><form onSubmit={createRequest}><div className={styles.formGrid}><Field label="Тип перевозки"><select name="kind" required defaultValue="documents"><option value="documents">Документы</option><option value="passengers">Пассажиры</option><option value="cargo">Груз</option><option value="mixed">Смешанная</option></select></Field><Field label="Приоритет"><select name="priority" defaultValue="normal"><option value="normal">Обычный</option><option value="urgent">Срочный</option><option value="critical">Критический</option></select></Field></div><Field label="Цель поездки"><textarea name="purpose" required /></Field><div className={styles.formGrid}><Field label="Откуда"><input name="origin" required /></Field><Field label="Куда"><input name="destination" required /></Field><Field label="Адрес отправления"><input name="originAddress" /></Field><Field label="Адрес назначения"><input name="destinationAddress" /></Field><Field label="Плановый выезд"><input type="datetime-local" name="desiredDepartureAt" /></Field><Field label="Плановое возвращение"><input type="datetime-local" name="desiredReturnAt" /></Field><Field label="Подразделение"><input name="department" /></Field><Field label="Проект / участок"><input name="project" /></Field><Field label="Центр затрат"><input name="costCenter" /></Field><Field label="Пассажиров"><input type="number" min="0" name="passengerCount" /></Field><Field label="Масса груза, кг"><input type="number" min="0" step="any" name="cargoWeightKg" /></Field><Field label="Объём груза, м³"><input type="number" min="0" step="any" name="cargoVolumeM3" /></Field></div><Field label="Описание груза"><input name="cargoDescription" /></Field><Field label="Примечание"><textarea name="notes" /></Field><div className={styles.checks}><label><input type="checkbox" name="requiresBusinessTrip" />Командировка</label><label><input type="checkbox" name="requiresWaybill" defaultChecked />Путевой лист</label><label><input type="checkbox" name="requiresConsignmentNote" />ТТН</label></div><ModalActions busy={busy} close={() => setShowCreateRequest(false)} label="Сохранить черновик" /></form></Modal>}

    {tripForRequest && <Modal title={`Планирование рейса по ${tripForRequest.number}`} close={() => setTripForRequest(null)}><form onSubmit={createTrip}><div className={styles.formGrid}><Field label="Автомобиль / госномер"><input name="vehicleId" required placeholder="ГАЗ A22R33" /></Field><Field label="Водитель / ID пользователя"><input name="driverUserId" placeholder="Назначить позже" /></Field><Field label="Плановый выезд"><input type="datetime-local" name="plannedDepartureAt" defaultValue={tripForRequest.desiredDepartureAt?.slice(0, 16)} /></Field><Field label="Плановое возвращение"><input type="datetime-local" name="plannedReturnAt" defaultValue={tripForRequest.desiredReturnAt?.slice(0, 16)} /></Field><Field label="Плановый пробег, км"><input type="number" min="0" step="any" name="plannedDistanceKm" /></Field><Field label="Плановое топливо, л"><input type="number" min="0" step="any" name="plannedFuelLiters" /></Field></div><ModalActions busy={busy} close={() => setTripForRequest(null)} label="Создать рейс" /></form></Modal>}
  </main>;
}

function RequestTable({ rows, selectedId, onSelect }: { rows: LogisticsRequest[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <div className={styles.tableWrap}><table><thead><tr><th>Номер</th><th>Тип</th><th>Маршрут</th><th>Автор</th><th>Дата</th><th>Статус</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={6} className={styles.empty}>Заявок пока нет</td></tr> : rows.map((row) => <tr key={row.id} className={selectedId === row.id ? styles.selected : ""} onClick={() => onSelect(row.id)}><td><b>{row.number}</b><small>версия {row.version}</small></td><td>{kindLabels[row.kind]}</td><td>{row.stops.map((stop) => stop.name).join(" → ")}<small>{row.purpose}</small></td><td>{row.authorDisplayName}</td><td>{formatDate(row.createdAt)}</td><td><span className={`${styles.badge} ${styles[row.status]}`}>{requestLabels[row.status]}</span></td></tr>)}</tbody></table></div>;
}
function RequestDetail({ request, busy, isApprover, onClose, onSubmit, onDecision, onCreateTrip }: { request: LogisticsRequest; busy: boolean; isApprover: boolean; onClose: () => void; onSubmit: (r: LogisticsRequest) => void; onDecision: (r: LogisticsRequest, d: "approved" | "returned" | "rejected") => void; onCreateTrip: (r: LogisticsRequest) => void }) {
  return <><div className={styles.detailHead}><div><small>{request.number}</small><h3>{request.purpose}</h3></div><button onClick={onClose}>×</button></div><dl><dt>Статус</dt><dd>{requestLabels[request.status]}</dd><dt>Тип</dt><dd>{kindLabels[request.kind]}</dd><dt>Автор</dt><dd>{request.authorDisplayName}</dd><dt>Подразделение</dt><dd>{request.department || "—"}</dd><dt>Проект</dt><dd>{request.project || "—"}</dd><dt>Маршрут</dt><dd>{request.stops.map((stop) => stop.name).join(" → ")}</dd><dt>Выезд</dt><dd>{formatDate(request.desiredDepartureAt)}</dd><dt>Возврат</dt><dd>{formatDate(request.desiredReturnAt)}</dd><dt>Документы</dt><dd>{[request.requiresBusinessTrip && "Командировка", request.requiresWaybill && "Путевой лист", request.requiresConsignmentNote && "ТТН"].filter(Boolean).join(", ") || "Не определены"}</dd></dl><div className={styles.actions}>{(request.status === "draft" || request.status === "returned") && <button disabled={busy} onClick={() => void onSubmit(request)}>Отправить на согласование</button>}{request.status === "submitted" && isApprover && <><button disabled={busy} onClick={() => void onDecision(request, "approved")}>Согласовать</button><button disabled={busy} onClick={() => void onDecision(request, "returned")}>Вернуть автору</button><button disabled={busy} onClick={() => void onDecision(request, "rejected")}>Отклонить</button></>}{request.status === "approved" && isApprover && <button disabled={busy} onClick={() => onCreateTrip(request)}>Создать рейс</button>}</div></>;
}
function TripTable({ rows, selectedId, onSelect }: { rows: LogisticsTrip[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <div className={styles.tableWrap}><table><thead><tr><th>Рейс</th><th>Заявка</th><th>Автомобиль</th><th>Водитель</th><th>План</th><th>Статус</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={6} className={styles.empty}>Рейсов пока нет</td></tr> : rows.map((row) => <tr key={row.id} className={selectedId === row.id ? styles.selected : ""} onClick={() => onSelect(row.id)}><td><b>{row.number}</b></td><td>{row.requestNumber || "—"}</td><td>{row.vehicleId || "Не назначен"}</td><td>{row.driverUserId || "Не назначен"}</td><td>{formatDate(row.plannedDepartureAt)}<small>до {formatDate(row.plannedReturnAt)}</small></td><td><span className={`${styles.badge} ${styles[row.status]}`}>{tripLabels[row.status]}</span></td></tr>)}</tbody></table></div>;
}
function TripDetail({ trip, busy, onClose, onTransition }: { trip: LogisticsTrip; busy: boolean; onClose: () => void; onTransition: (trip: LogisticsTrip, action: { status: TripStatus; label: string; reason?: boolean; close?: boolean }) => void }) {
  return <><div className={styles.detailHead}><div><small>{trip.requestNumber || "Без заявки"}</small><h3>{trip.number}</h3></div><button onClick={onClose}>×</button></div><dl><dt>Статус</dt><dd>{tripLabels[trip.status]}</dd><dt>Автомобиль</dt><dd>{trip.vehicleId || "—"}</dd><dt>Водитель</dt><dd>{trip.driverUserId || "—"}</dd><dt>Плановый выезд</dt><dd>{formatDate(trip.plannedDepartureAt)}</dd><dt>Фактический выезд</dt><dd>{formatDate(trip.actualDepartureAt)}</dd><dt>Плановый пробег</dt><dd>{trip.plannedDistanceKm ?? "—"}</dd><dt>Фактический пробег</dt><dd>{trip.actualDistanceKm ?? "—"}</dd><dt>Топливо план / факт</dt><dd>{trip.plannedFuelLiters ?? "—"} / {trip.actualFuelLiters ?? "—"}</dd></dl><div className={styles.actions}>{(tripActions[trip.status] || []).map((action) => <button key={action.status} disabled={busy} onClick={() => void onTransition(trip, action)}>{action.label}</button>)}</div></>;
}
function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) { return <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && close()}><div className={styles.modal}><div className={styles.modalHead}><h2>{title}</h2><button type="button" onClick={close}>×</button></div>{children}</div></div>; }
function ModalActions({ busy, close, label }: { busy: boolean; close: () => void; label: string }) { return <div className={styles.modalActions}><button type="button" onClick={close}>Отмена</button><button className={styles.primary} disabled={busy}>{busy ? "Сохранение…" : label}</button></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
function Metric({ title, value }: { title: string; value: number }) { return <div className={styles.metric}><span>{title}</span><b>{value}</b></div>; }
