"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import styles from "./server-logistics.module.css";

type RequestStatus =
  | "draft"
  | "submitted"
  | "returned"
  | "approved"
  | "rejected"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";
type RequestKind = "passengers" | "cargo" | "documents" | "mixed";
type TripStatus =
  | "planned"
  | "release_pending"
  | "ready"
  | "in_progress"
  | "closing"
  | "completed"
  | "cancelled";
type Stop = {
  sequence: number;
  type: string;
  name: string;
  address?: string;
  plannedAt?: string;
};
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
type LogisticsTrip = {
  id: string;
  number: string;
  status: TripStatus;
  requestId?: string;
  requestNumber?: string;
  vehicleId?: string;
  driverUserId?: string;
  plannedDepartureAt?: string;
  plannedReturnAt?: string;
  actualDepartureAt?: string;
  actualReturnAt?: string;
  plannedDistanceKm?: number;
  actualDistanceKm?: number;
  plannedFuelLiters?: number;
  actualFuelLiters?: number;
  createdAt: string;
  updatedAt: string;
};
type Bootstrap = {
  user: {
    id: string;
    displayName: string;
    login?: string;
    role?: string;
    canManageUsers?: boolean;
  };
  requests: LogisticsRequest[];
  trips: LogisticsTrip[];
  summary: {
    totalRequests: number;
    pendingRequests: number;
    activeTrips: number;
    activeTemplates: number;
    draftConfigurations: number;
  };
};
type TripAction = {
  status: TripStatus;
  label: string;
  reason?: boolean;
  close?: boolean;
};
type RequestDecision = "approved" | "returned" | "rejected";

type DecisionDialog = {
  request: LogisticsRequest;
  decision: RequestDecision;
} | null;
type TripActionDialog = {
  trip: LogisticsTrip;
  action: TripAction;
} | null;

const requestLabels: Record<RequestStatus, string> = {
  draft: "Черновик",
  submitted: "На согласовании",
  returned: "Возвращена",
  approved: "Согласована",
  rejected: "Отклонена",
  planned: "Запланирована",
  in_progress: "Выполняется",
  completed: "Завершена",
  cancelled: "Отменена",
};
const tripLabels: Record<TripStatus, string> = {
  planned: "Запланирован",
  release_pending: "Ожидает выпуска",
  ready: "Готов к выезду",
  in_progress: "В пути",
  closing: "Ожидает закрытия",
  completed: "Завершён",
  cancelled: "Отменён",
};
const kindLabels: Record<RequestKind, string> = {
  passengers: "Пассажиры",
  cargo: "Груз",
  documents: "Документы",
  mixed: "Смешанная",
};
const priorityLabels = {
  normal: "Обычный",
  urgent: "Срочный",
  critical: "Критический",
} as const;
const tripActions: Partial<Record<TripStatus, TripAction[]>> = {
  planned: [
    { status: "release_pending", label: "Передать на выпуск" },
    { status: "cancelled", label: "Отменить рейс", reason: true },
  ],
  release_pending: [
    { status: "ready", label: "Разрешить выезд" },
    { status: "cancelled", label: "Отменить рейс", reason: true },
  ],
  ready: [
    { status: "in_progress", label: "Начать рейс" },
    { status: "cancelled", label: "Отменить рейс", reason: true },
  ],
  in_progress: [
    { status: "closing", label: "Вернулся — передать на закрытие" },
    { status: "cancelled", label: "Аварийно отменить", reason: true },
  ],
  closing: [{ status: "completed", label: "Закрыть рейс", close: true }],
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

function formatNumber(value?: number, suffix = "") {
  if (value === undefined || value === null) return "—";
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(value)}${suffix}`;
}

function routeText(stops: Stop[]) {
  return stops.map((stop) => stop.name).filter(Boolean).join(" → ") || "Маршрут не указан";
}

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
  const [requestKind, setRequestKind] = useState<RequestKind>("documents");
  const [tripForRequest, setTripForRequest] = useState<LogisticsRequest | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState<RequestStatus | "all">("all");
  const [tripSearch, setTripSearch] = useState("");
  const [tripStatus, setTripStatus] = useState<TripStatus | "all">("all");
  const [decisionDialog, setDecisionDialog] = useState<DecisionDialog>(null);
  const [tripActionDialog, setTripActionDialog] = useState<TripActionDialog>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<Bootstrap>("GET"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить данные");
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

  const selectedRequest = useMemo(
    () => data?.requests.find((item) => item.id === selectedRequestId) ?? null,
    [data, selectedRequestId],
  );
  const selectedTrip = useMemo(
    () => data?.trips.find((item) => item.id === selectedTripId) ?? null,
    [data, selectedTripId],
  );
  const isApprover = data?.user.role === "admin" || data?.user.role === "dispatch-chief";

  const filteredRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();
    return (data?.requests || []).filter((item) => {
      if (requestStatus !== "all" && item.status !== requestStatus) return false;
      if (!query) return true;
      return [
        item.number,
        item.purpose,
        item.authorDisplayName,
        item.department,
        item.project,
        routeText(item.stops),
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [data, requestSearch, requestStatus]);

  const filteredTrips = useMemo(() => {
    const query = tripSearch.trim().toLowerCase();
    return (data?.trips || []).filter((item) => {
      if (tripStatus !== "all" && item.status !== tripStatus) return false;
      if (!query) return true;
      return [item.number, item.requestNumber, item.vehicleId, item.driverUserId]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [data, tripSearch, tripStatus]);

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

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = (name: string) => String(form.get(name) || "").trim();
    const saved = await perform("create-request", {
      kind: value("kind"),
      purpose: value("purpose"),
      department: value("department"),
      project: value("project"),
      costCenter: value("costCenter"),
      priority: value("priority"),
      desiredDepartureAt: value("desiredDepartureAt"),
      desiredReturnAt: value("desiredReturnAt"),
      passengerCount: value("passengerCount"),
      cargoDescription: value("cargoDescription"),
      cargoWeightKg: value("cargoWeightKg"),
      cargoVolumeM3: value("cargoVolumeM3"),
      requiresBusinessTrip: form.get("requiresBusinessTrip") === "on",
      requiresWaybill: form.get("requiresWaybill") === "on",
      requiresConsignmentNote: form.get("requiresConsignmentNote") === "on",
      notes: value("notes"),
      stops: [
        {
          type: "origin",
          name: value("origin"),
          address: value("originAddress"),
          plannedAt: value("desiredDepartureAt"),
        },
        {
          type: "destination",
          name: value("destination"),
          address: value("destinationAddress"),
          plannedAt: value("desiredReturnAt"),
        },
      ],
    }, "Заявка сохранена как черновик");
    if (saved) {
      formElement.reset();
      setRequestKind("documents");
      setShowCreateRequest(false);
    }
  }

  async function submitRequest(request: LogisticsRequest) {
    await perform(
      "submit-request",
      { requestId: request.id },
      "Заявка отправлена на согласование",
    );
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decisionDialog) return;
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") || "").trim();
    if (decisionDialog.decision !== "approved" && !reason) {
      setError("Укажите причину возврата или отклонения.");
      return;
    }
    const success = await perform(
      "decide-request",
      {
        requestId: decisionDialog.request.id,
        decision: decisionDialog.decision,
        reason,
      },
      `Решение сохранено: ${requestLabels[decisionDialog.decision]}`,
    );
    if (success) setDecisionDialog(null);
  }

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tripForRequest) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const success = await perform("create-trip", {
      requestId: tripForRequest.id,
      vehicleId: value("vehicleId"),
      driverUserId: value("driverUserId"),
      plannedDepartureAt: value("plannedDepartureAt"),
      plannedReturnAt: value("plannedReturnAt"),
      plannedDistanceKm: value("plannedDistanceKm"),
      plannedFuelLiters: value("plannedFuelLiters"),
    }, "Рейс создан и связан с заявкой");
    if (success) {
      setTripForRequest(null);
      setMode("trips");
    }
  }

  async function submitTripAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tripActionDialog) return;
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") || "").trim();
    const actualDistanceKm = String(form.get("actualDistanceKm") || "").trim();
    const actualFuelLiters = String(form.get("actualFuelLiters") || "").trim();

    if (tripActionDialog.action.reason && !reason) {
      setError("Укажите причину отмены.");
      return;
    }
    if (tripActionDialog.action.close && (!actualDistanceKm || !actualFuelLiters)) {
      setError("Для закрытия укажите фактический пробег и топливо.");
      return;
    }

    const success = await perform(
      "transition-trip",
      {
        tripId: tripActionDialog.trip.id,
        status: tripActionDialog.action.status,
        reason,
        actualDistanceKm,
        actualFuelLiters,
      },
      `Статус рейса: ${tripLabels[tripActionDialog.action.status]}`,
    );
    if (success) setTripActionDialog(null);
  }

  if (loading && !data) {
    return <main className={styles.state}>Загрузка данных…</main>;
  }
  if (!data) {
    return (
      <main className={styles.state}>
        <h1>Логистика Газели</h1>
        <p className={styles.error}>{error || "Нет доступа к данным"}</p>
        <button type="button" onClick={() => void load()}>Повторить</button>
      </main>
    );
  }

  return (
    <main className={styles.app}>
      <header className={styles.header} aria-hidden="true" />
      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {error ? <div className={styles.errorBar}>{error}</div> : null}

      <section className={styles.content}>
        <div className={styles.metrics}>
          <Metric title="Всего заявок" value={data.summary.totalRequests} />
          <Metric title="На согласовании" value={data.summary.pendingRequests} />
          <Metric title="Активные рейсы" value={data.summary.activeTrips} />
          <Metric title="Активные бланки" value={data.summary.activeTemplates} />
        </div>

        <div className={styles.modeTabs}>
          <button
            type="button"
            className={mode === "requests" ? styles.modeActive : ""}
            onClick={() => setMode("requests")}
          >
            Заявки
          </button>
          <button
            type="button"
            className={mode === "trips" ? styles.modeActive : ""}
            onClick={() => setMode("trips")}
          >
            Рейсы
          </button>
        </div>

        {mode === "requests" ? (
          <>
            <div className={styles.toolbar}>
              <div>
                <h2>Транспортные заявки</h2>
                <p>Создайте черновик, затем отправьте его на согласование.</p>
              </div>
              <div className={styles.toolbarActions}>
                <button type="button" onClick={() => void load()} disabled={loading}>Обновить</button>
                <button type="button" className={styles.primary} onClick={() => setShowCreateRequest(true)}>
                  Создать заявку
                </button>
              </div>
            </div>

            <div className={styles.filters}>
              <input
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
                placeholder="Поиск по номеру, маршруту, автору или проекту"
              />
              <select
                value={requestStatus}
                onChange={(event) => setRequestStatus(event.target.value as RequestStatus | "all")}
              >
                <option value="all">Все статусы</option>
                {Object.entries(requestLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <span>Найдено: {filteredRequests.length}</span>
            </div>

            <div className={styles.layout}>
              <RequestTable
                rows={filteredRequests}
                selectedId={selectedRequestId}
                onSelect={setSelectedRequestId}
              />
              <aside className={styles.detail}>
                {selectedRequest ? (
                  <RequestDetail
                    request={selectedRequest}
                    busy={busy}
                    isApprover={Boolean(isApprover)}
                    onClose={() => setSelectedRequestId(null)}
                    onSubmit={submitRequest}
                    onDecision={(request, decision) => setDecisionDialog({ request, decision })}
                    onCreateTrip={setTripForRequest}
                  />
                ) : (
                  <div className={styles.hint}>Выберите заявку в таблице.</div>
                )}
              </aside>
            </div>
          </>
        ) : (
          <>
            <div className={styles.toolbar}>
              <div>
                <h2>Рейсы</h2>
                <p>Планирование, выпуск, выполнение и закрытие поездки.</p>
              </div>
              <div className={styles.toolbarActions}>
                <a href="/logistics/release">Перейти к выпуску</a>
                <button type="button" onClick={() => void load()} disabled={loading}>Обновить</button>
              </div>
            </div>

            <div className={styles.filters}>
              <input
                value={tripSearch}
                onChange={(event) => setTripSearch(event.target.value)}
                placeholder="Поиск по рейсу, заявке, автомобилю или водителю"
              />
              <select
                value={tripStatus}
                onChange={(event) => setTripStatus(event.target.value as TripStatus | "all")}
              >
                <option value="all">Все статусы</option>
                {Object.entries(tripLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <span>Найдено: {filteredTrips.length}</span>
            </div>

            <div className={styles.layout}>
              <TripTable rows={filteredTrips} selectedId={selectedTripId} onSelect={setSelectedTripId} />
              <aside className={styles.detail}>
                {selectedTrip ? (
                  <TripDetail
                    trip={selectedTrip}
                    busy={busy}
                    onClose={() => setSelectedTripId(null)}
                    onTransition={(trip, action) => setTripActionDialog({ trip, action })}
                  />
                ) : (
                  <div className={styles.hint}>Выберите рейс в таблице.</div>
                )}
              </aside>
            </div>
          </>
        )}
      </section>

      {showCreateRequest ? (
        <Modal title="Новая заявка" close={() => setShowCreateRequest(false)}>
          <form onSubmit={createRequest}>
            <div className={styles.formGrid}>
              <Field label="Тип перевозки">
                <select
                  name="kind"
                  required
                  value={requestKind}
                  onChange={(event) => setRequestKind(event.target.value as RequestKind)}
                >
                  <option value="documents">Документы</option>
                  <option value="passengers">Пассажиры</option>
                  <option value="cargo">Груз</option>
                  <option value="mixed">Пассажиры и груз</option>
                </select>
              </Field>
              <Field label="Приоритет">
                <select name="priority" defaultValue="normal">
                  <option value="normal">Обычный</option>
                  <option value="urgent">Срочный</option>
                  <option value="critical">Критический</option>
                </select>
              </Field>
            </div>

            <Field label="Цель поездки">
              <textarea name="purpose" required placeholder="Кого или что необходимо доставить и для чего" />
            </Field>

            <div className={styles.formGrid}>
              <Field label="Откуда">
                <input name="origin" required placeholder="Пункт отправления" />
              </Field>
              <Field label="Куда">
                <input name="destination" required placeholder="Пункт назначения" />
              </Field>
              <Field label="Адрес отправления">
                <input name="originAddress" />
              </Field>
              <Field label="Адрес назначения">
                <input name="destinationAddress" />
              </Field>
              <Field label="Плановый выезд">
                <input type="datetime-local" name="desiredDepartureAt" required />
              </Field>
              <Field label="Плановое возвращение">
                <input type="datetime-local" name="desiredReturnAt" required />
              </Field>
              <Field label="Подразделение">
                <input name="department" />
              </Field>
              <Field label="Проект / участок">
                <input name="project" />
              </Field>
              <Field label="Центр затрат">
                <input name="costCenter" />
              </Field>

              {(requestKind === "passengers" || requestKind === "mixed") ? (
                <Field label="Количество пассажиров">
                  <input type="number" min="1" name="passengerCount" required />
                </Field>
              ) : null}

              {(requestKind === "cargo" || requestKind === "mixed") ? (
                <>
                  <Field label="Масса груза, кг">
                    <input type="number" min="0" step="any" name="cargoWeightKg" />
                  </Field>
                  <Field label="Объём груза, м³">
                    <input type="number" min="0" step="any" name="cargoVolumeM3" />
                  </Field>
                </>
              ) : null}
            </div>

            {(requestKind === "cargo" || requestKind === "mixed") ? (
              <Field label="Описание груза">
                <input name="cargoDescription" required />
              </Field>
            ) : null}

            <Field label="Примечание">
              <textarea name="notes" placeholder="Дополнительная информация для диспетчера" />
            </Field>

            <div className={styles.checks}>
              <label><input type="checkbox" name="requiresBusinessTrip" />Командировка</label>
              <label><input type="checkbox" name="requiresWaybill" defaultChecked />Путевой лист</label>
              <label><input type="checkbox" name="requiresConsignmentNote" />ТТН</label>
            </div>
            <ModalActions busy={busy} close={() => setShowCreateRequest(false)} label="Сохранить черновик" />
          </form>
        </Modal>
      ) : null}

      {tripForRequest ? (
        <Modal title={`Создание рейса по заявке ${tripForRequest.number}`} close={() => setTripForRequest(null)}>
          <form onSubmit={createTrip}>
            <p className={styles.modalIntro}>{routeText(tripForRequest.stops)} · {tripForRequest.purpose}</p>
            <div className={styles.formGrid}>
              <Field label="Автомобиль / госномер">
                <input name="vehicleId" required placeholder="Например: 054BT03" />
              </Field>
              <Field label="Водитель">
                <input name="driverUserId" placeholder="ФИО или табельный номер" />
              </Field>
              <Field label="Плановый выезд">
                <input
                  type="datetime-local"
                  name="plannedDepartureAt"
                  required
                  defaultValue={tripForRequest.desiredDepartureAt?.slice(0, 16)}
                />
              </Field>
              <Field label="Плановое возвращение">
                <input
                  type="datetime-local"
                  name="plannedReturnAt"
                  required
                  defaultValue={tripForRequest.desiredReturnAt?.slice(0, 16)}
                />
              </Field>
              <Field label="Плановый пробег, км">
                <input type="number" min="0" step="any" name="plannedDistanceKm" />
              </Field>
              <Field label="Плановое топливо, л">
                <input type="number" min="0" step="any" name="plannedFuelLiters" />
              </Field>
            </div>
            <ModalActions busy={busy} close={() => setTripForRequest(null)} label="Создать рейс" />
          </form>
        </Modal>
      ) : null}

      {decisionDialog ? (
        <Modal
          title={decisionDialog.decision === "approved"
            ? "Согласование заявки"
            : decisionDialog.decision === "returned"
              ? "Возврат заявки автору"
              : "Отклонение заявки"}
          close={() => setDecisionDialog(null)}
        >
          <form onSubmit={submitDecision}>
            <div className={styles.confirmBox}>
              <b>{decisionDialog.request.number}</b>
              <span>{routeText(decisionDialog.request.stops)}</span>
              <p>{decisionDialog.request.purpose}</p>
            </div>
            <Field label={decisionDialog.decision === "approved" ? "Комментарий (необязательно)" : "Причина"}>
              <textarea
                name="reason"
                required={decisionDialog.decision !== "approved"}
                placeholder={decisionDialog.decision === "approved"
                  ? "Комментарий к согласованию"
                  : "Укажите, что необходимо исправить или почему заявка отклоняется"}
              />
            </Field>
            <ModalActions
              busy={busy}
              close={() => setDecisionDialog(null)}
              label={decisionDialog.decision === "approved"
                ? "Согласовать"
                : decisionDialog.decision === "returned"
                  ? "Вернуть автору"
                  : "Отклонить"}
            />
          </form>
        </Modal>
      ) : null}

      {tripActionDialog ? (
        <Modal title={tripActionDialog.action.label} close={() => setTripActionDialog(null)}>
          <form onSubmit={submitTripAction}>
            <div className={styles.confirmBox}>
              <b>{tripActionDialog.trip.number}</b>
              <span>Заявка: {tripActionDialog.trip.requestNumber || "—"}</span>
              <p>{tripActionDialog.trip.vehicleId || "Автомобиль не назначен"} · {tripActionDialog.trip.driverUserId || "Водитель не назначен"}</p>
            </div>

            {tripActionDialog.action.reason ? (
              <Field label="Причина">
                <textarea name="reason" required placeholder="Укажите причину отмены рейса" />
              </Field>
            ) : null}

            {tripActionDialog.action.close ? (
              <div className={styles.formGrid}>
                <Field label="Фактический пробег, км">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="actualDistanceKm"
                    defaultValue={tripActionDialog.trip.actualDistanceKm}
                    required
                  />
                </Field>
                <Field label="Фактическое топливо, л">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="actualFuelLiters"
                    defaultValue={tripActionDialog.trip.actualFuelLiters}
                    required
                  />
                </Field>
              </div>
            ) : null}

            {!tripActionDialog.action.reason && !tripActionDialog.action.close ? (
              <p className={styles.confirmText}>
                Подтвердите перевод рейса в статус «{tripLabels[tripActionDialog.action.status]}».
              </p>
            ) : null}

            <ModalActions
              busy={busy}
              close={() => setTripActionDialog(null)}
              label={tripActionDialog.action.label}
            />
          </form>
        </Modal>
      ) : null}
    </main>
  );
}

function RequestTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: LogisticsRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Номер</th>
            <th>Тип</th>
            <th>Маршрут и цель</th>
            <th>Автор</th>
            <th>Дата</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} className={styles.empty}>По заданным условиям заявок нет</td></tr>
          ) : rows.map((row) => (
            <tr
              key={row.id}
              className={selectedId === row.id ? styles.selected : ""}
              onClick={() => onSelect(row.id)}
            >
              <td><b>{row.number}</b><small>версия {row.version}</small></td>
              <td>{kindLabels[row.kind]}<small>{priorityLabels[row.priority]}</small></td>
              <td>{routeText(row.stops)}<small>{row.purpose}</small></td>
              <td>{row.authorDisplayName}</td>
              <td>{formatDate(row.createdAt)}</td>
              <td><span className={`${styles.badge} ${styles[row.status]}`}>{requestLabels[row.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestDetail({
  request,
  busy,
  isApprover,
  onClose,
  onSubmit,
  onDecision,
  onCreateTrip,
}: {
  request: LogisticsRequest;
  busy: boolean;
  isApprover: boolean;
  onClose: () => void;
  onSubmit: (request: LogisticsRequest) => void;
  onDecision: (request: LogisticsRequest, decision: RequestDecision) => void;
  onCreateTrip: (request: LogisticsRequest) => void;
}) {
  const documents = [
    request.requiresBusinessTrip && "Командировка",
    request.requiresWaybill && "Путевой лист",
    request.requiresConsignmentNote && "ТТН",
  ].filter(Boolean).join(", ");

  return (
    <>
      <div className={styles.detailHead}>
        <div><small>{request.number}</small><h3>{request.purpose}</h3></div>
        <button type="button" onClick={onClose} aria-label="Закрыть карточку">×</button>
      </div>
      <dl>
        <dt>Статус</dt><dd>{requestLabels[request.status]}</dd>
        <dt>Тип</dt><dd>{kindLabels[request.kind]}</dd>
        <dt>Приоритет</dt><dd>{priorityLabels[request.priority]}</dd>
        <dt>Автор</dt><dd>{request.authorDisplayName}</dd>
        <dt>Подразделение</dt><dd>{request.department || "—"}</dd>
        <dt>Проект</dt><dd>{request.project || "—"}</dd>
        <dt>Маршрут</dt><dd>{routeText(request.stops)}</dd>
        <dt>Выезд</dt><dd>{formatDate(request.desiredDepartureAt)}</dd>
        <dt>Возврат</dt><dd>{formatDate(request.desiredReturnAt)}</dd>
        <dt>Пассажиры</dt><dd>{request.passengerCount ?? "—"}</dd>
        <dt>Груз</dt><dd>{request.cargoDescription || "—"}</dd>
        <dt>Масса</dt><dd>{formatNumber(request.cargoWeightKg, " кг")}</dd>
        <dt>Документы</dt><dd>{documents || "Не выбраны"}</dd>
      </dl>
      <div className={styles.actions}>
        {(request.status === "draft" || request.status === "returned") ? (
          <button type="button" disabled={busy} onClick={() => void onSubmit(request)}>
            Отправить на согласование
          </button>
        ) : null}
        {request.status === "submitted" && isApprover ? (
          <>
            <button type="button" disabled={busy} className={styles.actionPrimary} onClick={() => onDecision(request, "approved")}>
              Согласовать
            </button>
            <button type="button" disabled={busy} onClick={() => onDecision(request, "returned")}>
              Вернуть автору
            </button>
            <button type="button" disabled={busy} className={styles.danger} onClick={() => onDecision(request, "rejected")}>
              Отклонить
            </button>
          </>
        ) : null}
        {request.status === "approved" && isApprover ? (
          <button type="button" disabled={busy} className={styles.actionPrimary} onClick={() => onCreateTrip(request)}>
            Создать рейс
          </button>
        ) : null}
      </div>
    </>
  );
}

function TripTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: LogisticsTrip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Рейс</th>
            <th>Заявка</th>
            <th>Автомобиль</th>
            <th>Водитель</th>
            <th>Плановый выезд</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} className={styles.empty}>По заданным условиям рейсов нет</td></tr>
          ) : rows.map((row) => (
            <tr
              key={row.id}
              className={selectedId === row.id ? styles.selected : ""}
              onClick={() => onSelect(row.id)}
            >
              <td><b>{row.number}</b></td>
              <td>{row.requestNumber || "—"}</td>
              <td>{row.vehicleId || "Не назначен"}</td>
              <td>{row.driverUserId || "Не назначен"}</td>
              <td>{formatDate(row.plannedDepartureAt)}<small>возврат: {formatDate(row.plannedReturnAt)}</small></td>
              <td><span className={`${styles.badge} ${styles[row.status]}`}>{tripLabels[row.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TripDetail({
  trip,
  busy,
  onClose,
  onTransition,
}: {
  trip: LogisticsTrip;
  busy: boolean;
  onClose: () => void;
  onTransition: (trip: LogisticsTrip, action: TripAction) => void;
}) {
  return (
    <>
      <div className={styles.detailHead}>
        <div><small>{trip.requestNumber || "Без заявки"}</small><h3>{trip.number}</h3></div>
        <button type="button" onClick={onClose} aria-label="Закрыть карточку">×</button>
      </div>
      <dl>
        <dt>Статус</dt><dd>{tripLabels[trip.status]}</dd>
        <dt>Автомобиль</dt><dd>{trip.vehicleId || "—"}</dd>
        <dt>Водитель</dt><dd>{trip.driverUserId || "—"}</dd>
        <dt>Плановый выезд</dt><dd>{formatDate(trip.plannedDepartureAt)}</dd>
        <dt>Фактический выезд</dt><dd>{formatDate(trip.actualDepartureAt)}</dd>
        <dt>Плановый возврат</dt><dd>{formatDate(trip.plannedReturnAt)}</dd>
        <dt>Фактический возврат</dt><dd>{formatDate(trip.actualReturnAt)}</dd>
        <dt>Пробег план</dt><dd>{formatNumber(trip.plannedDistanceKm, " км")}</dd>
        <dt>Пробег факт</dt><dd>{formatNumber(trip.actualDistanceKm, " км")}</dd>
        <dt>Топливо план</dt><dd>{formatNumber(trip.plannedFuelLiters, " л")}</dd>
        <dt>Топливо факт</dt><dd>{formatNumber(trip.actualFuelLiters, " л")}</dd>
      </dl>
      <div className={styles.actions}>
        {(tripActions[trip.status] || []).map((action) => (
          <button
            type="button"
            key={action.status}
            disabled={busy}
            className={action.status === "cancelled" ? styles.danger : styles.actionPrimary}
            onClick={() => onTransition(trip, action)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modalHead}>
          <h2>{title}</h2>
          <button type="button" onClick={close} aria-label="Закрыть">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ busy, close, label }: { busy: boolean; close: () => void; label: string }) {
  return (
    <div className={styles.modalActions}>
      <button type="button" onClick={close}>Отмена</button>
      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? "Сохраняем…" : label}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

function Metric({ title, value }: { title: string; value: number }) {
  return <div className={styles.metric}><span>{title}</span><b>{value}</b></div>;
}
