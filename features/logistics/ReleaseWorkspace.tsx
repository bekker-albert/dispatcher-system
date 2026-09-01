"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./release-workspace.module.css";

type TripStatus = "planned" | "release_pending" | "ready" | "in_progress" | "closing" | "completed" | "cancelled";
type ReleaseStatus = "pending" | "blocked" | "ready" | "overridden";
type CheckKey =
  | "driverAssigned"
  | "vehicleAssigned"
  | "medicalPassed"
  | "technicalPassed"
  | "vehicleDocumentsValid"
  | "driverDocumentsValid"
  | "noCriticalDefects"
  | "capacityCompliant"
  | "requiredDocumentsGenerated";
type Checks = Record<CheckKey, boolean>;
type Trip = {
  id: string;
  number: string;
  status: TripStatus;
  requestNumber?: string;
  vehicleId?: string;
  driverUserId?: string;
  plannedDepartureAt?: string;
  plannedReturnAt?: string;
};
type Release = {
  id: string;
  tripId: string;
  status: ReleaseStatus;
  checks: Checks;
  blockingReasons: string[];
  overrideReason?: string;
  checkedByDisplayName?: string;
  checkedAt?: string;
  approvedByDisplayName?: string;
  approvedAt?: string;
  updatedAt: string;
};
type Bootstrap = {
  user: { displayName: string; role?: string };
  trips: Trip[];
  releases: Release[];
  summary: { blockedReleases?: number };
};

const labels: Record<CheckKey, { title: string; text: string; automatic?: boolean }> = {
  driverAssigned: { title: "Водитель назначен", text: "В рейсе указан водитель.", automatic: true },
  vehicleAssigned: { title: "Автомобиль назначен", text: "В рейсе указан автомобиль.", automatic: true },
  medicalPassed: { title: "Медицинский допуск", text: "Водитель допущен медицинским работником." },
  technicalPassed: { title: "Технический выпуск", text: "Автомобиль проверен и допущен к эксплуатации." },
  vehicleDocumentsValid: { title: "Документы автомобиля", text: "Страхование, техосмотр и регистрационные документы действуют." },
  driverDocumentsValid: { title: "Документы водителя", text: "Удостоверение, категория и необходимые допуски действуют." },
  noCriticalDefects: { title: "Нет критических дефектов", text: "Нет неисправностей, запрещающих выпуск." },
  capacityCompliant: { title: "Вместимость и грузоподъёмность", text: "Пассажиры и груз соответствуют ограничениям автомобиля." },
  requiredDocumentsGenerated: { title: "Комплект документов", text: "Все обязательные документы сформированы." },
};
const statusLabels: Record<ReleaseStatus, string> = {
  pending: "Ожидает проверки",
  blocked: "Выезд заблокирован",
  ready: "Допущен",
  overridden: "Допущен с обоснованием",
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
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

export default function ReleaseWorkspace() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<Bootstrap>("GET");
      setData(result);
      setSelectedTripId((current) => {
        const stillVisible = result.trips.some((trip) => trip.id === current && ["release_pending", "ready"].includes(trip.status));
        return stillVisible ? current : result.trips.find((trip) => trip.status === "release_pending")?.id || "";
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить чек-листы");
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

  const trips = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.trips || [])
      .filter((trip) => trip.status === "release_pending" || trip.status === "ready")
      .filter((trip) => !query || [trip.number, trip.requestNumber, trip.vehicleId, trip.driverUserId]
        .some((value) => value?.toLowerCase().includes(query)));
  }, [data, search]);

  const trip = data?.trips.find((item) => item.id === selectedTripId);
  const release = data?.releases.find((item) => item.tripId === selectedTripId);
  const canRelease = data?.user.role === "admin" || data?.user.role === "dispatch-chief";

  function automaticCheck(key: CheckKey, selectedTrip: Trip) {
    if (key === "driverAssigned") return Boolean(selectedTrip.driverUserId);
    if (key === "vehicleAssigned") return Boolean(selectedTrip.vehicleId);
    return undefined;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trip) return;
    const form = new FormData(event.currentTarget);
    const checks = (Object.keys(labels) as CheckKey[]).reduce((result, key) => {
      result[key] = automaticCheck(key, trip) ?? form.get(key) === "on";
      return result;
    }, {} as Checks);

    setBusy(true);
    setError("");
    try {
      await api("POST", {
        action: "save-trip-release",
        payload: {
          tripId: trip.id,
          checks,
          overrideReason: String(form.get("overrideReason") || "").trim(),
        },
      });
      setNotice("Проверка выпуска сохранена");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить выпуск");
    } finally {
      setBusy(false);
    }
  }

  async function allowDeparture() {
    if (!trip) return;
    setBusy(true);
    setError("");
    try {
      await api("POST", {
        action: "transition-trip",
        payload: { tripId: trip.id, status: "ready" },
      });
      setNotice("Выезд разрешён");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Выезд заблокирован");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <main className={styles.state}>Загрузка чек-листов…</main>;
  if (!data) {
    return (
      <main className={styles.state}>
        <h1>Выпуск рейсов</h1>
        <p className={styles.error}>{error || "Нет доступа"}</p>
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
        <div className={styles.summary}>
          <div><span>Ожидают проверки</span><b>{data.trips.filter((item) => item.status === "release_pending").length}</b></div>
          <div><span>Заблокированы</span><b>{data.summary.blockedReleases || 0}</b></div>
          <div><span>Допущены</span><b>{data.releases.filter((item) => item.status === "ready" || item.status === "overridden").length}</b></div>
        </div>

        <div className={styles.searchBar}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по рейсу, заявке, автомобилю или водителю"
          />
          <button type="button" onClick={() => void load()} disabled={loading}>Обновить</button>
        </div>

        <div className={styles.layout}>
          <aside className={styles.trips}>
            <h2>Рейсы на выпуске</h2>
            {trips.length === 0 ? (
              <p className={styles.empty}>Подходящих рейсов нет.</p>
            ) : trips.map((item) => {
              const itemRelease = data.releases.find((value) => value.tripId === item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={selectedTripId === item.id ? styles.selected : ""}
                  onClick={() => setSelectedTripId(item.id)}
                >
                  <b>{item.number}</b>
                  <span>{item.requestNumber || "Без заявки"}</span>
                  <small>{item.vehicleId || "Автомобиль не назначен"} · {item.driverUserId || "Водитель не назначен"}</small>
                  <em>{itemRelease ? statusLabels[itemRelease.status] : "Проверка не начата"}</em>
                </button>
              );
            })}
          </aside>

          <section className={styles.panel}>
            {!trip ? (
              <div className={styles.empty}>Выберите рейс слева.</div>
            ) : (
              <form key={`${trip.id}-${release?.updatedAt || "new"}`} onSubmit={save}>
                <div className={styles.panelHead}>
                  <div>
                    <small>{trip.requestNumber || "Без заявки"}</small>
                    <h2>{trip.number}</h2>
                    <p>{trip.vehicleId || "Автомобиль не назначен"} · {trip.driverUserId || "Водитель не назначен"}</p>
                  </div>
                  <span className={`${styles.status} ${release ? styles[release.status] : ""}`}>
                    {release ? statusLabels[release.status] : "Новая проверка"}
                  </span>
                </div>

                <div className={styles.meta}>
                  <span>Плановый выезд: <b>{formatDate(trip.plannedDepartureAt)}</b></span>
                  <span>Возврат: <b>{formatDate(trip.plannedReturnAt)}</b></span>
                  {release?.checkedByDisplayName ? (
                    <span>Проверил: <b>{release.checkedByDisplayName}</b>, {formatDate(release.checkedAt)}</span>
                  ) : null}
                </div>

                <div className={styles.checkGrid}>
                  {(Object.keys(labels) as CheckKey[]).map((key) => {
                    const item = labels[key];
                    const automatic = item.automatic;
                    const checked = automatic
                      ? Boolean(automaticCheck(key, trip))
                      : Boolean(release?.checks[key]);
                    return (
                      <label key={key} className={`${styles.checkCard} ${checked ? styles.checked : ""}`}>
                        <input
                          type="checkbox"
                          name={key}
                          defaultChecked={checked}
                          disabled={automatic || !canRelease || trip.status !== "release_pending"}
                        />
                        <span>
                          <b>{item.title}</b>
                          <small>{item.text}{automatic ? " Проверяется системой." : ""}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {release?.blockingReasons?.length ? (
                  <div className={styles.blockers}>
                    <b>Что не позволяет выпустить автомобиль</b>
                    <ul>{release.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  </div>
                ) : null}

                <label className={styles.override}>
                  <span>Допуск с незавершёнными проверками</span>
                  <textarea
                    name="overrideReason"
                    defaultValue={release?.overrideReason || ""}
                    disabled={!canRelease || trip.status !== "release_pending"}
                    placeholder="Используется только в исключительном случае. Укажите подробное обоснование — не менее 10 символов."
                  />
                </label>

                <div className={styles.actions}>
                  {canRelease && trip.status === "release_pending" ? (
                    <button className={styles.primary} disabled={busy}>
                      {busy ? "Сохраняем…" : "Сохранить проверку"}
                    </button>
                  ) : null}
                  {canRelease && trip.status === "release_pending"
                    && (release?.status === "ready" || release?.status === "overridden") ? (
                      <button type="button" className={styles.allow} disabled={busy} onClick={() => void allowDeparture()}>
                        Разрешить выезд
                      </button>
                    ) : null}
                </div>
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
