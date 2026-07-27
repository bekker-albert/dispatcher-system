"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import styles from "./logistics.module.css";

type TabId = "dashboard" | "requests" | "approval" | "routes" | "documents" | "reports" | "directories" | "admin";
type RequestStatus = "Черновик" | "На согласовании" | "Возвращена" | "Согласована" | "Завершена";
type ModalKind = "request" | "user" | "place" | "tariff" | "template" | "settings" | "monthly" | "route" | "preview" | null;

type UserRow = { id: string; name: string; login: string; role: string; active: boolean; terminationDate: string; archived: boolean };
type PlaceRow = { id: string; name: string; category: string; manual: boolean; active: boolean };
type TariffRow = { id: string; name: string; category: string; dayRate: number; nightRate: number; oneDayRate: number; active: boolean };
type TemplateRow = { id: string; name: string; type: string; version: string; effectiveFrom: string; active: boolean; fileName: string; mimeType: string; dataUrl: string; usedCount: number };
type RequestRow = { id: string; number: string; author: string; route: string; purpose: string; departureAt: string; returnAt: string; driver: string; vehicle: string; status: RequestStatus; returnReason: string; createdAt: string; docs: string[] };
type RouteRow = { id: string; name: string; loadingPoint: string; unloadingPoint: string; distance: number; manual: boolean; active: boolean };
type MonthlyRow = { id: string; month: string; mileage: number; fuel: number; fuelPrice: number; wages: number; leasing: number; repairs: number; insurance: number; tyres: number; consumables: number; idleHours: number; idlePrice: number };
type Settings = { mrp: number; oneDayMrp: number; overnightDayMrp: number; overnightNightMrp: number; company: string; vehicle: string };
type DataState = { users: UserRow[]; places: PlaceRow[]; tariffs: TariffRow[]; templates: TemplateRow[]; requests: RequestRow[]; routes: RouteRow[]; monthly: MonthlyRow[]; settings: Settings };
type ModalState = { kind: ModalKind; id?: string };

const STORAGE_KEY = "gazel-logistics-web-v1";
const today = new Date().toISOString().slice(0, 10);
const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialData: DataState = {
  settings: { mrp: 3932, oneDayMrp: 1, overnightDayMrp: 3, overnightNightMrp: 4, company: "ТОО AA Mining", vehicle: "ГАЗ A22R33" },
  users: [
    { id: "u-admin", name: "Администратор", login: "admin", role: "Администратор", active: true, terminationDate: "", archived: false },
    { id: "u-driver-1", name: "Водитель 1", login: "driver1", role: "Водитель", active: true, terminationDate: "", archived: false },
    { id: "u-dispatcher", name: "Диспетчер", login: "dispatcher", role: "Диспетчер", active: true, terminationDate: "", archived: false },
  ],
  places: [
    { id: "p-astana", name: "Астана", category: "Город республиканского значения", manual: false, active: true },
    { id: "p-step", name: "Степногорск", category: "Город областного значения", manual: false, active: true },
    { id: "p-zhol", name: "Жолымбет", category: "Населённый пункт", manual: true, active: true },
  ],
  tariffs: [
    { id: "t-one", name: "Однодневная поездка", category: "Все категории", dayRate: 0, nightRate: 0, oneDayRate: 1, active: true },
    { id: "t-republic", name: "Командировка с ночёвкой", category: "Город республиканского значения", dayRate: 3, nightRate: 4, oneDayRate: 1, active: true },
    { id: "t-region", name: "Командировка с ночёвкой", category: "Город областного значения", dayRate: 3, nightRate: 4, oneDayRate: 1, active: true },
  ],
  templates: [
    { id: "tpl-1", name: "Служебная записка", type: "Служебная записка", version: "1.0", effectiveFrom: today, active: true, fileName: "", mimeType: "", dataUrl: "", usedCount: 0 },
    { id: "tpl-2", name: "Расчёт командировочных", type: "Расчёт", version: "1.0", effectiveFrom: today, active: true, fileName: "", mimeType: "", dataUrl: "", usedCount: 0 },
  ],
  requests: [
    { id: "r-1", number: "ЗГ-0001", author: "Диспетчер", route: "Степногорск → Астана → Степногорск", purpose: "Доставка документов", departureAt: nowLocal(), returnAt: nowLocal(), driver: "Водитель 1", vehicle: "ГАЗ A22R33", status: "На согласовании", returnReason: "", createdAt: new Date().toLocaleString("ru-RU"), docs: [] },
  ],
  routes: [
    { id: "route-1", name: "Степногорск — Астана", loadingPoint: "Степногорск", unloadingPoint: "Астана", distance: 390, manual: false, active: true },
  ],
  monthly: [
    { id: "m-current", month: new Date().toISOString().slice(0, 7), mileage: 0, fuel: 0, fuelPrice: 240, wages: 840000, leasing: 0, repairs: 0, insurance: 0, tyres: 0, consumables: 0, idleHours: 0, idlePrice: 0 },
  ],
};

const tabs: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Главная" },
  { id: "requests", label: "Заявки" },
  { id: "approval", label: "Согласование" },
  { id: "routes", label: "Маршруты" },
  { id: "documents", label: "Бланки и документы" },
  { id: "reports", label: "Месячный отчёт" },
  { id: "directories", label: "Справочники" },
  { id: "admin", label: "Администрирование" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 6 }).format(Number.isFinite(value) ? value : 0);
}
function money(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} ₸`;
}
function n(value: FormDataEntryValue | null) { return Number(String(value ?? "").replace(",", ".")) || 0; }
function s(value: FormDataEntryValue | null) { return String(value ?? "").trim(); }

export default function LogisticsWorkspace() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<TabId>("dashboard");
  const [data, setData] = useState<DataState>(initialData);
  const [modal, setModal] = useState<ModalState>({ kind: null });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem("gazel-auth") === "1");
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored) as DataState);
    } catch { /* use defaults */ }
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const pending = data.requests.filter((item) => item.status === "На согласовании");
  const activeUsers = data.users.filter((item) => item.active && !item.archived);
  const report = data.monthly[0];
  const monthlyTotal = report ? report.fuel * report.fuelPrice + report.wages + report.leasing + report.repairs + report.insurance + report.tyres + report.consumables + report.idleHours * report.idlePrice : 0;

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (s(form.get("login")) === "admin" && s(form.get("password")) === "admin12345") {
      sessionStorage.setItem("gazel-auth", "1");
      setAuthenticated(true);
      setLoginError("");
    } else setLoginError("Неверный логин или пароль");
  }

  function logout() { sessionStorage.removeItem("gazel-auth"); setAuthenticated(false); }
  function update<K extends keyof DataState>(key: K, value: DataState[K]) { setData((current) => ({ ...current, [key]: value })); }
  function removeRequest(id: string) { if (confirm("Удалить заявку?")) update("requests", data.requests.filter((row) => row.id !== id)); }
  function sendForApproval(id: string) { update("requests", data.requests.map((row) => row.id === id ? { ...row, status: "На согласовании", returnReason: "" } : row)); setNotice("Заявка отправлена на согласование"); }
  function approve(id: string) {
    const docs = ["Служебная записка", "Расчёт командировочных", "Заявление водителя", "Согласие на удержание", "Счёт на оплату", "Путевой лист", "Контрольный лист выпуска"];
    update("requests", data.requests.map((row) => row.id === id ? { ...row, status: "Согласована", docs } : row));
    update("templates", data.templates.map((tpl) => ({ ...tpl, usedCount: tpl.usedCount + (tpl.active ? 1 : 0) })));
    setNotice("Заявка согласована. Пакет документов сформирован");
  }
  function returnToAuthor(id: string) {
    const reason = prompt("Укажите причину возврата автору:");
    if (!reason?.trim()) return;
    update("requests", data.requests.map((row) => row.id === id ? { ...row, status: "Возвращена", returnReason: reason.trim() } : row));
    setNotice("Заявка возвращена автору");
  }
  function printPackage(row: RequestRow) {
    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) return;
    const docs = row.docs.length ? row.docs : ["Черновик пакета документов"];
    win.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${row.number}</title><style>body{font-family:Arial,sans-serif;margin:36px;color:#111}section{page-break-after:always;min-height:900px}h1{font-size:22px}dl{display:grid;grid-template-columns:220px 1fr;gap:10px}dt{font-weight:700}.sign{margin-top:90px;display:flex;justify-content:space-between}</style></head><body>${docs.map((doc) => `<section><h1>${doc}</h1><dl><dt>Заявка</dt><dd>${row.number}</dd><dt>Автор</dt><dd>${row.author}</dd><dt>Маршрут</dt><dd>${row.route}</dd><dt>Цель</dt><dd>${row.purpose}</dd><dt>Водитель</dt><dd>${row.driver}</dd><dt>Автомобиль</dt><dd>${row.vehicle}</dd><dt>Период</dt><dd>${row.departureAt} — ${row.returnAt}</dd></dl><div class="sign"><span>Подпись: ____________</span><span>Дата: ____________</span></div></section>`).join("")}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  function archiveUser(row: UserRow) {
    const linked = data.requests.some((request) => request.author === row.name || request.driver === row.name);
    if (linked) {
      const date = prompt("Укажите дату увольнения (ГГГГ-ММ-ДД):", row.terminationDate || today) || today;
      update("users", data.users.map((user) => user.id === row.id ? { ...user, active: false, terminationDate: date, archived: true } : user));
      setNotice("Пользователь деактивирован, история сохранена");
    } else if (confirm("У пользователя нет связанной истории. Удалить окончательно?")) {
      update("users", data.users.filter((user) => user.id !== row.id));
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `gazel-logistics-${today}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => { try { setData(JSON.parse(String(reader.result)) as DataState); setNotice("Резервная копия загружена"); } catch { alert("Файл не является корректной резервной копией"); } };
    reader.readAsText(file);
  }

  if (!authenticated) return <LoginScreen onSubmit={login} error={loginError} />;

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div><div className={styles.eyebrow}>AA Mining · веб-контур</div><h1>Логистика Газели</h1><p>Заявки, согласования, командировки, бланки, тарифы и месячный контроль</p></div>
        <div className={styles.headerActions}><span className={styles.adminBadge}>Администратор · полный доступ</span><button className={styles.secondary} onClick={logout}>Выйти</button></div>
      </header>
      <nav className={styles.tabs}>{tabs.map((item) => <button key={item.id} className={tab === item.id ? styles.activeTab : ""} onClick={() => setTab(item.id)}>{item.label}{item.id === "approval" && pending.length > 0 ? <b>{pending.length}</b> : null}</button>)}</nav>
      {notice ? <div className={styles.notice}>{notice}</div> : null}

      {tab === "dashboard" && <Dashboard data={data} pending={pending.length} activeUsers={activeUsers.length} monthlyTotal={monthlyTotal} setTab={setTab} />}
      {tab === "requests" && <Requests data={data} open={setModal} remove={removeRequest} send={sendForApproval} print={printPackage} />}
      {tab === "approval" && <Approval rows={pending} approve={approve} returnToAuthor={returnToAuthor} open={setModal} />}
      {tab === "routes" && <Routes rows={data.routes} open={setModal} updateRows={(rows) => update("routes", rows)} />}
      {tab === "documents" && <Documents templates={data.templates} requests={data.requests} open={setModal} print={printPackage} updateTemplates={(rows) => update("templates", rows)} />}
      {tab === "reports" && <MonthlyReport row={report} total={monthlyTotal} open={setModal} />}
      {tab === "directories" && <Directories data={data} open={setModal} updateData={update} />}
      {tab === "admin" && <Admin data={data} open={setModal} archiveUser={archiveUser} updateUsers={(rows) => update("users", rows)} exportData={exportData} importData={importData} />}

      {modal.kind && <EditorModal modal={modal} data={data} close={() => setModal({ kind: null })} update={update} notice={setNotice} />}
    </main>
  );
}

function LoginScreen({ onSubmit, error }: { onSubmit: (e: FormEvent<HTMLFormElement>) => void; error: string }) {
  return <main className={styles.loginPage}><form className={styles.loginCard} onSubmit={onSubmit}><div className={styles.logo}>AA</div><h1>Логистика Газели</h1><p>Тестовый веб-контур для настройки системы</p><label>Логин<input name="login" defaultValue="admin" autoComplete="username" /></label><label>Пароль<input name="password" type="password" defaultValue="admin12345" autoComplete="current-password" /></label>{error ? <div className={styles.error}>{error}</div> : null}<button className={styles.primary}>Войти</button></form></main>;
}

function Dashboard({ data, pending, activeUsers, monthlyTotal, setTab }: { data: DataState; pending: number; activeUsers: number; monthlyTotal: number; setTab: (tab: TabId) => void }) {
  const approved = data.requests.filter((r) => r.status === "Согласована").length;
  return <section className={styles.page}><div className={styles.cards}><Metric label="Всего заявок" value={String(data.requests.length)} /><Metric label="На согласовании" value={String(pending)} tone={pending ? "warning" : "normal"} /><Metric label="Согласовано" value={String(approved)} /><Metric label="Расходы месяца" value={money(monthlyTotal)} /><Metric label="Активные пользователи" value={String(activeUsers)} /></div><div className={styles.grid2}><Panel title="Быстрые действия"><div className={styles.actionGrid}><button onClick={() => setTab("requests")}>Создать заявку</button><button onClick={() => setTab("approval")}>Открыть согласование</button><button onClick={() => setTab("documents")}>Официальные бланки</button><button onClick={() => setTab("reports")}>Месячный отчёт</button></div></Panel><Panel title="Контроль настроек"><Status label="МРП" value={money(data.settings.mrp)} /><Status label="Активные тарифы" value={String(data.tariffs.filter((x) => x.active).length)} /><Status label="Активные бланки" value={String(data.templates.filter((x) => x.active).length)} /><Status label="Маршруты" value={String(data.routes.filter((x) => x.active).length)} /></Panel></div></section>;
}

function Requests({ data, open, remove, send, print }: { data: DataState; open: (m: ModalState) => void; remove: (id: string) => void; send: (id: string) => void; print: (r: RequestRow) => void }) {
  return <section className={styles.page}><PageHead title="Заявки" text="Создание, редактирование, отправка на согласование и печать пакета." action="Создать заявку" onAction={() => open({ kind: "request" })} /><Table headers={["№", "Автор", "Маршрут", "Период", "Водитель", "Статус", "Действия"]}>{data.requests.map((row) => <tr key={row.id}><td><strong>{row.number}</strong></td><td>{row.author}</td><td>{row.route}<small>{row.purpose}</small></td><td>{row.departureAt.replace("T", " ")}<small>до {row.returnAt.replace("T", " ")}</small></td><td>{row.driver}<small>{row.vehicle}</small></td><td><Badge status={row.status} />{row.returnReason ? <small className={styles.dangerText}>{row.returnReason}</small> : null}</td><td><Actions><button onClick={() => open({ kind: "request", id: row.id })}>Изменить</button>{row.status === "Черновик" || row.status === "Возвращена" ? <button onClick={() => send(row.id)}>Отправить</button> : null}{row.status === "Согласована" ? <button onClick={() => print(row)}>Печать / PDF</button> : null}<button className={styles.dangerButton} onClick={() => remove(row.id)}>Удалить</button></Actions></td></tr>)}</Table></section>;
}

function Approval({ rows, approve, returnToAuthor, open }: { rows: RequestRow[]; approve: (id: string) => void; returnToAuthor: (id: string) => void; open: (m: ModalState) => void }) {
  return <section className={styles.page}><PageHead title="Согласование" text="Администратор может согласовать, изменить данные или вернуть заявку автору." />{rows.length === 0 ? <Empty text="Нет заявок, ожидающих согласования." /> : <Table headers={["№", "Маршрут", "Автор", "Назначение", "Действия"]}>{rows.map((row) => <tr key={row.id}><td><strong>{row.number}</strong><small>{row.createdAt}</small></td><td>{row.route}<small>{row.departureAt.replace("T", " ")} — {row.returnAt.replace("T", " ")}</small></td><td>{row.author}</td><td>{row.driver}<small>{row.vehicle}</small></td><td><Actions><button onClick={() => open({ kind: "request", id: row.id })}>Изменить</button><button className={styles.approveButton} onClick={() => approve(row.id)}>Согласовать и оформить</button><button className={styles.dangerButton} onClick={() => returnToAuthor(row.id)}>Вернуть автору</button></Actions></td></tr>)}</Table>}</section>;
}

function Routes({ rows, open, updateRows }: { rows: RouteRow[]; open: (m: ModalState) => void; updateRows: (r: RouteRow[]) => void }) {
  return <section className={styles.page}><PageHead title="Маршруты и пункты" text="Пункты загрузки и выгрузки можно выбирать из справочника либо вводить вручную." action="Добавить маршрут" onAction={() => open({ kind: "route" })} /><Table headers={["Маршрут", "Загрузка", "Выгрузка", "Расстояние", "Ручной ввод", "Статус", "Действия"]}>{rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.loadingPoint}</td><td>{row.unloadingPoint}</td><td>{formatNumber(row.distance)} км</td><td>{row.manual ? "Да" : "Нет"}</td><td>{row.active ? "Активен" : "Отключён"}</td><td><Actions><button onClick={() => open({ kind: "route", id: row.id })}>Изменить</button><button onClick={() => updateRows(rows.map((x) => x.id === row.id ? { ...x, active: !x.active } : x))}>{row.active ? "Деактивировать" : "Восстановить"}</button><button className={styles.dangerButton} onClick={() => confirm("Удалить маршрут?") && updateRows(rows.filter((x) => x.id !== row.id))}>Удалить</button></Actions></td></tr>)}</Table></section>;
}

function Documents({ templates, requests, open, print, updateTemplates }: { templates: TemplateRow[]; requests: RequestRow[]; open: (m: ModalState) => void; print: (r: RequestRow) => void; updateTemplates: (rows: TemplateRow[]) => void }) {
  const generated = requests.filter((r) => r.docs.length > 0);
  return <section className={styles.page}><PageHead title="Официальные бланки" text="Загрузка собственных DOCX/PDF, просмотр, версии и история использования." action="Загрузить бланк" onAction={() => open({ kind: "template" })} /><Table headers={["Название", "Тип", "Версия", "Действует с", "Файл", "Использован", "Статус", "Действия"]}>{templates.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.type}</td><td>{row.version}</td><td>{row.effectiveFrom}</td><td>{row.fileName || "Не загружен"}</td><td>{row.usedCount}</td><td>{row.active ? "Активен" : "Архив"}</td><td><Actions><button onClick={() => open({ kind: "preview", id: row.id })}>Просмотр</button><button onClick={() => open({ kind: "template", id: row.id })}>Изменить</button><button onClick={() => updateTemplates(templates.map((x) => x.id === row.id ? { ...x, active: !x.active } : x))}>{row.active ? "В архив" : "Активировать"}</button>{row.usedCount === 0 ? <button className={styles.dangerButton} onClick={() => confirm("Удалить неиспользованный шаблон?") && updateTemplates(templates.filter((x) => x.id !== row.id))}>Удалить</button> : null}</Actions></td></tr>)}</Table><h2 className={styles.sectionTitle}>Сформированные пакеты</h2>{generated.length === 0 ? <Empty text="После согласования заявки здесь появится пакет документов." /> : <Table headers={["Заявка", "Маршрут", "Документы", "Действие"]}>{generated.map((row) => <tr key={row.id}><td>{row.number}</td><td>{row.route}</td><td>{row.docs.join(", ")}</td><td><button onClick={() => print(row)}>Открыть для печати / PDF</button></td></tr>)}</Table>}</section>;
}

function MonthlyReport({ row, total, open }: { row: MonthlyRow | undefined; total: number; open: (m: ModalState) => void }) {
  if (!row) return <Empty text="Нет данных месячного отчёта." />;
  const fuelCost = row.fuel * row.fuelPrice; const idleCost = row.idleHours * row.idlePrice;
  return <section className={styles.page}><PageHead title="Месячный отчёт" text="Все цены доступны для редактирования администратору." action="Редактировать показатели и цены" onAction={() => open({ kind: "monthly", id: row.id })} /><div className={styles.cards}><Metric label="Пробег" value={`${formatNumber(row.mileage)} км`} /><Metric label="Топливо" value={`${formatNumber(row.fuel)} л`} /><Metric label="Стоимость топлива" value={money(fuelCost)} /><Metric label="Простой" value={`${formatNumber(row.idleHours)} ч / ${money(idleCost)}`} /><Metric label="Итого расходов" value={money(total)} /></div><Table headers={["Статья", "Количество / база", "Цена", "Сумма"]}><tr><td>Топливо</td><td>{formatNumber(row.fuel)} л</td><td>{money(row.fuelPrice)} / л</td><td>{money(fuelCost)}</td></tr><tr><td>Заработная плата водителей</td><td>2 водителя, график 15/15</td><td>Редактируется</td><td>{money(row.wages)}</td></tr><tr><td>Лизинг</td><td>Месяц</td><td>Редактируется</td><td>{money(row.leasing)}</td></tr><tr><td>Ремонты</td><td>Факт</td><td>Редактируется</td><td>{money(row.repairs)}</td></tr><tr><td>Страхование и техосмотр</td><td>Начисление месяца</td><td>Редактируется</td><td>{money(row.insurance)}</td></tr><tr><td>Шины</td><td>Начисление / факт</td><td>Редактируется</td><td>{money(row.tyres)}</td></tr><tr><td>Расходные материалы</td><td>Факт</td><td>Редактируется</td><td>{money(row.consumables)}</td></tr><tr><td>Простой</td><td>{formatNumber(row.idleHours)} ч</td><td>{money(row.idlePrice)} / ч</td><td>{money(idleCost)}</td></tr><tr className={styles.totalRow}><td colSpan={3}>ИТОГО</td><td>{money(total)}</td></tr></Table></section>;
}

function Directories({ data, open, updateData }: { data: DataState; open: (m: ModalState) => void; updateData: <K extends keyof DataState>(k: K, v: DataState[K]) => void }) {
  return <section className={styles.page}><div className={styles.grid2}><Panel title="Населённые пункты"><button className={styles.primarySmall} onClick={() => open({ kind: "place" })}>Добавить пункт</button><div className={styles.list}>{data.places.map((row) => <div key={row.id}><span><strong>{row.name}</strong><small>{row.category}{row.manual ? " · добавлен вручную" : ""}</small></span><Actions><button onClick={() => open({ kind: "place", id: row.id })}>Изменить</button><button onClick={() => updateData("places", data.places.map((x) => x.id === row.id ? { ...x, active: !x.active } : x))}>{row.active ? "Отключить" : "Включить"}</button></Actions></div>)}</div></Panel><Panel title="Тарифная сетка"><button className={styles.primarySmall} onClick={() => open({ kind: "tariff" })}>Добавить тариф</button><div className={styles.list}>{data.tariffs.map((row) => <div key={row.id}><span><strong>{row.name}</strong><small>{row.category} · день {formatNumber(row.dayRate)} МРП · ночь {formatNumber(row.nightRate)} МРП</small></span><Actions><button onClick={() => open({ kind: "tariff", id: row.id })}>Изменить</button><button onClick={() => updateData("tariffs", data.tariffs.map((x) => x.id === row.id ? { ...x, active: !x.active } : x))}>{row.active ? "Отключить" : "Включить"}</button></Actions></div>)}</div></Panel></div><Panel title="Начальные настройки"><div className={styles.settingsGrid}><Status label="Компания" value={data.settings.company} /><Status label="Автомобиль" value={data.settings.vehicle} /><Status label="МРП" value={money(data.settings.mrp)} /><Status label="Однодневная поездка" value={`${formatNumber(data.settings.oneDayMrp)} МРП`} /><Status label="День с ночёвкой" value={`${formatNumber(data.settings.overnightDayMrp)} МРП`} /><Status label="Ночь" value={`${formatNumber(data.settings.overnightNightMrp)} МРП`} /></div><button className={styles.primarySmall} onClick={() => open({ kind: "settings" })}>Изменить начальные настройки</button></Panel></section>;
}

function Admin({ data, open, archiveUser, updateUsers, exportData, importData }: { data: DataState; open: (m: ModalState) => void; archiveUser: (u: UserRow) => void; updateUsers: (u: UserRow[]) => void; exportData: () => void; importData: (f: File) => void }) {
  return <section className={styles.page}><PageHead title="Администрирование" text="Администратор может добавлять, редактировать, деактивировать, удалять, восстанавливать и возвращать документы автору." action="Добавить пользователя" onAction={() => open({ kind: "user" })} /><Table headers={["ФИО", "Логин", "Роль", "Статус", "Дата увольнения", "Действия"]}>{data.users.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.login}</td><td>{row.role}</td><td>{row.active ? "Активен" : row.archived ? "Архив / уволен" : "Деактивирован"}</td><td>{row.terminationDate || "—"}</td><td><Actions><button onClick={() => open({ kind: "user", id: row.id })}>Изменить</button>{!row.active ? <button onClick={() => updateUsers(data.users.map((x) => x.id === row.id ? { ...x, active: true, archived: false, terminationDate: "" } : x))}>Восстановить</button> : <button className={styles.dangerButton} onClick={() => archiveUser(row)}>Удалить / деактивировать</button>}</Actions></td></tr>)}</Table><div className={styles.grid2}><Panel title="Резервная копия"><p>Экспорт содержит настройки, справочники, заявки и историю.</p><Actions><button onClick={exportData}>Скачать JSON</button><label className={styles.fileButton}>Загрузить JSON<input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} /></label></Actions></Panel><Panel title="Права администратора"><ul className={styles.checkList}><li>Полный доступ ко всем разделам</li><li>Редактирование и удаление записей</li><li>Возврат заявки автору</li><li>Корректировка тарифов и цен</li><li>Управление официальными бланками</li><li>Деактивация пользователей с сохранением истории</li></ul></Panel></div></section>;
}

function EditorModal({ modal, data, close, update, notice }: { modal: ModalState; data: DataState; close: () => void; update: <K extends keyof DataState>(k: K, v: DataState[K]) => void; notice: (s: string) => void }) {
  const request = data.requests.find((x) => x.id === modal.id); const user = data.users.find((x) => x.id === modal.id); const place = data.places.find((x) => x.id === modal.id); const tariff = data.tariffs.find((x) => x.id === modal.id); const template = data.templates.find((x) => x.id === modal.id); const route = data.routes.find((x) => x.id === modal.id); const monthly = data.monthly.find((x) => x.id === modal.id) || data.monthly[0];
  if (modal.kind === "preview" && template) return <Modal title={`Просмотр: ${template.name}`} close={close}><div className={styles.preview}><h2>{template.name}</h2><p>Тип: {template.type}</p><p>Версия: {template.version}</p><p>Действует с: {template.effectiveFrom}</p>{template.dataUrl && template.mimeType.includes("pdf") ? <iframe src={template.dataUrl} title={template.name} /> : <div className={styles.docPreview}><strong>{template.fileName || "Файл не загружен"}</strong><p>{template.fileName ? "DOCX сохранён в карточке шаблона. Для точного PDF-просмотра потребуется серверная конвертация Microsoft Word/LibreOffice." : "Загрузите официальный DOCX или PDF."}</p>{template.dataUrl ? <a href={template.dataUrl} download={template.fileName}>Открыть исходный файл</a> : null}</div>}</div></Modal>;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    if (modal.kind === "request") {
      const row: RequestRow = { id: request?.id || uid("req"), number: s(form.get("number")) || `ЗГ-${String(data.requests.length + 1).padStart(4, "0")}`, author: s(form.get("author")), route: s(form.get("route")), purpose: s(form.get("purpose")), departureAt: s(form.get("departureAt")), returnAt: s(form.get("returnAt")), driver: s(form.get("driver")), vehicle: s(form.get("vehicle")), status: (s(form.get("status")) || "Черновик") as RequestStatus, returnReason: request?.returnReason || "", createdAt: request?.createdAt || new Date().toLocaleString("ru-RU"), docs: request?.docs || [] };
      update("requests", request ? data.requests.map((x) => x.id === row.id ? row : x) : [row, ...data.requests]);
    }
    if (modal.kind === "user") {
      const row: UserRow = { id: user?.id || uid("user"), name: s(form.get("name")), login: s(form.get("login")), role: s(form.get("role")), active: form.get("active") === "on", terminationDate: s(form.get("terminationDate")), archived: form.get("archived") === "on" };
      update("users", user ? data.users.map((x) => x.id === row.id ? row : x) : [row, ...data.users]);
    }
    if (modal.kind === "place") {
      const row: PlaceRow = { id: place?.id || uid("place"), name: s(form.get("name")), category: s(form.get("category")), manual: form.get("manual") === "on", active: form.get("active") === "on" };
      update("places", place ? data.places.map((x) => x.id === row.id ? row : x) : [row, ...data.places]);
    }
    if (modal.kind === "tariff") {
      const row: TariffRow = { id: tariff?.id || uid("tariff"), name: s(form.get("name")), category: s(form.get("category")), dayRate: n(form.get("dayRate")), nightRate: n(form.get("nightRate")), oneDayRate: n(form.get("oneDayRate")), active: form.get("active") === "on" };
      update("tariffs", tariff ? data.tariffs.map((x) => x.id === row.id ? row : x) : [row, ...data.tariffs]);
    }
    if (modal.kind === "route") {
      const row: RouteRow = { id: route?.id || uid("route"), name: s(form.get("name")), loadingPoint: s(form.get("loadingPoint")), unloadingPoint: s(form.get("unloadingPoint")), distance: n(form.get("distance")), manual: form.get("manual") === "on", active: form.get("active") === "on" };
      update("routes", route ? data.routes.map((x) => x.id === row.id ? row : x) : [row, ...data.routes]);
    }
    if (modal.kind === "settings") update("settings", { company: s(form.get("company")), vehicle: s(form.get("vehicle")), mrp: n(form.get("mrp")), oneDayMrp: n(form.get("oneDayMrp")), overnightDayMrp: n(form.get("overnightDayMrp")), overnightNightMrp: n(form.get("overnightNightMrp")) });
    if (modal.kind === "monthly" && monthly) {
      const row: MonthlyRow = { id: monthly.id, month: s(form.get("month")), mileage: n(form.get("mileage")), fuel: n(form.get("fuel")), fuelPrice: n(form.get("fuelPrice")), wages: n(form.get("wages")), leasing: n(form.get("leasing")), repairs: n(form.get("repairs")), insurance: n(form.get("insurance")), tyres: n(form.get("tyres")), consumables: n(form.get("consumables")), idleHours: n(form.get("idleHours")), idlePrice: n(form.get("idlePrice")) };
      update("monthly", data.monthly.map((x) => x.id === row.id ? row : x));
    }
    if (modal.kind !== "template") { notice("Изменения сохранены"); close(); }
  }

  async function saveTemplate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); const file = (form.get("file") as File | null); let dataUrl = template?.dataUrl || ""; let fileName = template?.fileName || ""; let mimeType = template?.mimeType || "";
    if (file && file.size > 0) { if (file.size > 3_000_000) return alert("Для тестового контура загрузите файл до 3 МБ."); dataUrl = await new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(file); }); fileName = file.name; mimeType = file.type; }
    const row: TemplateRow = { id: template?.id || uid("tpl"), name: s(form.get("name")), type: s(form.get("type")), version: s(form.get("version")), effectiveFrom: s(form.get("effectiveFrom")), active: form.get("active") === "on", fileName, mimeType, dataUrl, usedCount: template?.usedCount || 0 };
    update("templates", template ? data.templates.map((x) => x.id === row.id ? row : x) : [row, ...data.templates]); notice("Официальный бланк сохранён"); close();
  }

  const title = modal.id ? "Редактирование" : "Добавление";
  return <Modal title={title} close={close}><form className={styles.form} onSubmit={modal.kind === "template" ? saveTemplate : submit}>
    {modal.kind === "request" && <><Field label="Номер"><input name="number" defaultValue={request?.number} placeholder="Автоматически" /></Field><Field label="Автор"><select name="author" defaultValue={request?.author || activeName(data.users, "Диспетчер")}><option value="">Выберите</option>{data.users.filter((x) => x.active).map((x) => <option key={x.id}>{x.name}</option>)}</select></Field><Field label="Маршрут"><input name="route" required defaultValue={request?.route} placeholder="Степногорск → Астана → Степногорск" /></Field><Field label="Цель поездки"><textarea name="purpose" required defaultValue={request?.purpose} /></Field><div className={styles.formGrid}><Field label="Выезд"><input type="datetime-local" name="departureAt" required defaultValue={request?.departureAt || nowLocal()} /></Field><Field label="Возвращение"><input type="datetime-local" name="returnAt" required defaultValue={request?.returnAt || nowLocal()} /></Field></div><div className={styles.formGrid}><Field label="Водитель"><select name="driver" defaultValue={request?.driver}><option value="">Не назначен</option>{data.users.filter((x) => x.active && x.role === "Водитель").map((x) => <option key={x.id}>{x.name}</option>)}</select></Field><Field label="Автомобиль"><input name="vehicle" defaultValue={request?.vehicle || data.settings.vehicle} /></Field></div><Field label="Статус"><select name="status" defaultValue={request?.status || "Черновик"}>{["Черновик", "На согласовании", "Возвращена", "Согласована", "Завершена"].map((x) => <option key={x}>{x}</option>)}</select></Field></>}
    {modal.kind === "user" && <><Field label="ФИО"><input name="name" required defaultValue={user?.name} /></Field><div className={styles.formGrid}><Field label="Логин"><input name="login" required defaultValue={user?.login} /></Field><Field label="Роль"><select name="role" defaultValue={user?.role || "Заявитель"}>{["Администратор", "Начальник ДС", "Диспетчер", "Водитель", "Заявитель", "Бухгалтерия", "Склад", "Механик"].map((x) => <option key={x}>{x}</option>)}</select></Field></div><Field label="Дата увольнения"><input type="date" name="terminationDate" defaultValue={user?.terminationDate} /></Field><Checks><label><input type="checkbox" name="active" defaultChecked={user?.active ?? true} />Активен</label><label><input type="checkbox" name="archived" defaultChecked={user?.archived} />Архивный</label></Checks></>}
    {modal.kind === "place" && <><Field label="Название"><input name="name" required defaultValue={place?.name} /></Field><Field label="Категория города / пункта"><select name="category" defaultValue={place?.category || "Город областного значения"}>{["Город республиканского значения", "Город областного значения", "Город районного значения", "Населённый пункт", "Производственный объект"].map((x) => <option key={x}>{x}</option>)}</select></Field><Checks><label><input type="checkbox" name="manual" defaultChecked={place?.manual ?? true} />Добавлен вручную</label><label><input type="checkbox" name="active" defaultChecked={place?.active ?? true} />Активен</label></Checks></>}
    {modal.kind === "tariff" && <><Field label="Название тарифа"><input name="name" required defaultValue={tariff?.name} /></Field><Field label="Категория"><input name="category" required defaultValue={tariff?.category || "Все категории"} /></Field><div className={styles.formGrid3}><Field label="Однодневная, МРП"><input type="number" step="any" name="oneDayRate" defaultValue={tariff?.oneDayRate ?? 1} /></Field><Field label="За день, МРП"><input type="number" step="any" name="dayRate" defaultValue={tariff?.dayRate ?? 3} /></Field><Field label="За ночь, МРП"><input type="number" step="any" name="nightRate" defaultValue={tariff?.nightRate ?? 4} /></Field></div><Checks><label><input type="checkbox" name="active" defaultChecked={tariff?.active ?? true} />Активен</label></Checks></>}
    {modal.kind === "route" && <><Field label="Название маршрута"><input name="name" required defaultValue={route?.name} /></Field><div className={styles.formGrid}><Field label="Пункт загрузки"><input name="loadingPoint" list="places-list" required defaultValue={route?.loadingPoint} /></Field><Field label="Пункт выгрузки"><input name="unloadingPoint" list="places-list" required defaultValue={route?.unloadingPoint} /></Field></div><datalist id="places-list">{data.places.filter((x) => x.active).map((x) => <option key={x.id} value={x.name} />)}</datalist><Field label="Расстояние, км"><input type="number" step="any" name="distance" defaultValue={route?.distance} /></Field><Checks><label><input type="checkbox" name="manual" defaultChecked={route?.manual} />Пункты введены вручную</label><label><input type="checkbox" name="active" defaultChecked={route?.active ?? true} />Активен</label></Checks></>}
    {modal.kind === "template" && <><Field label="Своё название"><input name="name" required defaultValue={template?.name} /></Field><div className={styles.formGrid}><Field label="Вид документа"><input name="type" required defaultValue={template?.type} /></Field><Field label="Версия"><input name="version" required defaultValue={template?.version || "1.0"} /></Field></div><Field label="Дата начала действия"><input type="date" name="effectiveFrom" required defaultValue={template?.effectiveFrom || today} /></Field><Field label="Официальный файл DOCX или PDF"><input type="file" name="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /><small>{template?.fileName ? `Текущий файл: ${template.fileName}` : "Файл ещё не загружен"}</small></Field><Checks><label><input type="checkbox" name="active" defaultChecked={template?.active ?? true} />Сделать активным</label></Checks></>}
    {modal.kind === "settings" && <><div className={styles.formGrid}><Field label="Компания"><input name="company" defaultValue={data.settings.company} /></Field><Field label="Автомобиль"><input name="vehicle" defaultValue={data.settings.vehicle} /></Field></div><div className={styles.formGrid}><Field label="МРП, ₸"><input type="number" step="any" name="mrp" defaultValue={data.settings.mrp} /></Field><Field label="Однодневная поездка, МРП"><input type="number" step="any" name="oneDayMrp" defaultValue={data.settings.oneDayMrp} /></Field></div><div className={styles.formGrid}><Field label="День с ночёвкой, МРП"><input type="number" step="any" name="overnightDayMrp" defaultValue={data.settings.overnightDayMrp} /></Field><Field label="Ночь, МРП"><input type="number" step="any" name="overnightNightMrp" defaultValue={data.settings.overnightNightMrp} /></Field></div></>}
    {modal.kind === "monthly" && monthly && <><Field label="Месяц"><input type="month" name="month" defaultValue={monthly.month} /></Field><div className={styles.formGrid3}><Field label="Пробег, км"><input type="number" step="any" name="mileage" defaultValue={monthly.mileage} /></Field><Field label="Топливо, л"><input type="number" step="any" name="fuel" defaultValue={monthly.fuel} /></Field><Field label="Цена топлива, ₸"><input type="number" step="any" name="fuelPrice" defaultValue={monthly.fuelPrice} /></Field></div><div className={styles.formGrid}><Field label="Заработная плата, ₸"><input type="number" step="any" name="wages" defaultValue={monthly.wages} /></Field><Field label="Лизинг, ₸"><input type="number" step="any" name="leasing" defaultValue={monthly.leasing} /></Field><Field label="Ремонты, ₸"><input type="number" step="any" name="repairs" defaultValue={monthly.repairs} /></Field><Field label="Страхование, ₸"><input type="number" step="any" name="insurance" defaultValue={monthly.insurance} /></Field><Field label="Шины, ₸"><input type="number" step="any" name="tyres" defaultValue={monthly.tyres} /></Field><Field label="Расходники, ₸"><input type="number" step="any" name="consumables" defaultValue={monthly.consumables} /></Field><Field label="Простой, ч"><input type="number" step="any" name="idleHours" defaultValue={monthly.idleHours} /></Field><Field label="Цена простоя, ₸/ч"><input type="number" step="any" name="idlePrice" defaultValue={monthly.idlePrice} /></Field></div></>}
    <div className={styles.modalActions}><button type="button" className={styles.secondary} onClick={close}>Отмена</button><button className={styles.primary}>Сохранить</button></div>
  </form></Modal>;
}

function activeName(users: UserRow[], role: string) { return users.find((x) => x.active && x.role === role)?.name || ""; }
function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) { return <div className={styles.modalBackdrop} onMouseDown={close}><div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}><div className={styles.modalHeader}><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
function Checks({ children }: { children: ReactNode }) { return <div className={styles.checks}>{children}</div>; }
function PageHead({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) { return <div className={styles.pageHead}><div><h2>{title}</h2><p>{text}</p></div>{action ? <button className={styles.primary} onClick={onAction}>{action}</button> : null}</div>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className={styles.panel}><h2>{title}</h2>{children}</section>; }
function Metric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warning" }) { return <div className={`${styles.metric} ${tone === "warning" ? styles.metricWarning : ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Status({ label, value }: { label: string; value: string }) { return <div className={styles.status}><span>{label}</span><strong>{value}</strong></div>; }
function Actions({ children }: { children: ReactNode }) { return <div className={styles.actions}>{children}</div>; }
function Empty({ text }: { text: string }) { return <div className={styles.empty}>{text}</div>; }
function Badge({ status }: { status: RequestStatus }) { return <span className={`${styles.badge} ${status === "Согласована" ? styles.badgeOk : status === "На согласовании" ? styles.badgeWait : status === "Возвращена" ? styles.badgeBad : ""}`}>{status}</span>; }
function Table({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className={styles.tableWrap}><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
