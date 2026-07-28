const STORAGE = 'shtab-ai-v1';
const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setDate(1); x.setMonth(x.getMonth() + n); return x; };
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = new Date();
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const REMINDER_PRESETS = [
  { value: 0, label: 'В момент' },
  { value: 15, label: 'За 15 минут' },
  { value: 60, label: 'За 1 час' },
  { value: 1440, label: 'За 1 день' }
];
const CATEGORY_LABELS = {
  salary: 'Зарплата', housing: 'Жилье', transport: 'Транспорт',
  food: 'Питание', health: 'Здоровье', work: 'Работа', other: 'Другое'
};

const defaultSettings = () => ({
  taskNotifications: true,
  financeNotifications: true,
  showCompleted: true,
  confirmDelete: true,
  defaultTime: '18:00',
  defaultTaskReminders: [0],
  defaultFinanceReminders: [1440],
  currency: 'KZT'
});

const seed = () => ({
  projects: [
    { id: 'aidarly', name: 'Айдарлы', description: 'Бюджет, запуск проекта и диспетчеризация', color: '#7c5cfc' },
    { id: 'dispatch', name: 'Диспетчерская служба', description: 'Текущие задачи, GPS и отчетность', color: '#00cfe8' },
    { id: 'personal', name: 'Личное', description: 'Личные дела и автомобиль', color: '#28c76f' }
  ],
  tasks: [
    { id: uid(), title: 'Сверить текущие задачи диспетчерской службы', date: dayKey(now), time: '17:30', project: 'dispatch', priority: 'high', completed: false, reminders: [0] },
    { id: uid(), title: 'Подготовить вопросы по бюджету Айдарлы', date: dayKey(addDays(now, 1)), time: '10:00', project: 'aidarly', priority: 'high', completed: false, reminders: [60, 0] },
    { id: uid(), title: 'Проверить статус пилотного проекта CARVIS', date: dayKey(addDays(now, 1)), time: '14:00', project: 'dispatch', priority: 'normal', completed: false, reminders: [60] }
  ],
  finances: [],
  messages: [{ role: 'assistant', text: 'Версия 1.2: управляю задачами и проектами, показываю план и финансовый баланс. Голосовой разговор будет в версии 2.' }],
  selectedDate: dayKey(now),
  financeMonth: monthKey(now),
  notificationKeys: [],
  settings: defaultSettings()
});

let state;
try { state = JSON.parse(localStorage.getItem(STORAGE)) || seed(); } catch { state = seed(); }
state.projects = Array.isArray(state.projects) ? state.projects : seed().projects;
state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
state.finances = Array.isArray(state.finances) ? state.finances : [];
state.messages = Array.isArray(state.messages) ? state.messages : [];
state.selectedDate = state.selectedDate || dayKey(now);
state.financeMonth = state.financeMonth || monthKey(now);
state.notificationKeys = Array.isArray(state.notificationKeys) ? state.notificationKeys : [];
const oldNotifications = state.settings?.notifications;
state.settings = { ...defaultSettings(), ...(state.settings || {}) };
if (typeof oldNotifications === 'boolean') {
  state.settings.taskNotifications = oldNotifications;
  state.settings.financeNotifications = oldNotifications;
}
state.settings.defaultTaskReminders = normalizeReminders(state.settings.defaultTaskReminders, [0]);
state.settings.defaultFinanceReminders = normalizeReminders(state.settings.defaultFinanceReminders, [1440]);
state.tasks = state.tasks.map(t => ({ ...t, reminders: normalizeReminders(t.reminders, state.settings.defaultTaskReminders) }));
state.finances = state.finances.map(f => ({
  completed: false, completedPeriods: {}, repeat: 'none', time: '09:00',
  category: 'other', reminders: state.settings.defaultFinanceReminders, ...f,
  reminders: normalizeReminders(f.reminders, state.settings.defaultFinanceReminders),
  completedPeriods: f.completedPeriods || {}
}));

let page = 'today';

function normalizeReminders(values, fallback = []) {
  const source = Array.isArray(values) ? values : fallback;
  return [...new Set(source.map(Number).filter(v => Number.isFinite(v) && v >= 0 && v <= 43200))].sort((a, b) => b - a);
}
const project = id => state.projects.find(p => p.id === id);
const taskDue = t => new Date(`${t.date}T${t.time || state.settings.defaultTime}:00`);
const short = d => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(d);
const titleDate = d => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
const selectedDateObject = () => new Date(`${state.selectedDate}T12:00:00`);
const selectedFinanceMonthObject = () => new Date(`${state.financeMonth}-01T12:00:00`);
const native = () => typeof Android !== 'undefined';
const money = value => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: state.settings.currency || 'KZT',
  maximumFractionDigits: Number(value) % 1 ? 2 : 0
}).format(Number(value) || 0);

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

function reminderText(minutes) {
  if (minutes === 0) return 'в момент';
  if (minutes < 60) return `за ${minutes} мин`;
  if (minutes % 1440 === 0) return `за ${minutes / 1440} дн`;
  if (minutes % 60 === 0) return `за ${minutes / 60} ч`;
  return `за ${minutes} мин`;
}

function notificationKey(base, minutes) {
  return `${base}::${minutes}`;
}

function scheduleNative(key, title, date) {
  if (!native() || date <= new Date()) return false;
  try {
    Android.scheduleNotification(key, title, date.getTime());
    return true;
  } catch { return false; }
}

function cancelNative(key) {
  if (!native()) return;
  try { Android.cancelNotification(key); } catch {}
}

function financeOccurrence(item, targetMonth = state.financeMonth) {
  if (item.repeat !== 'monthly') {
    if (!String(item.date).startsWith(targetMonth)) return null;
    return new Date(`${item.date}T${item.time || '09:00'}:00`);
  }
  const startMonth = String(item.date).slice(0, 7);
  if (targetMonth < startMonth) return null;
  const base = new Date(`${targetMonth}-01T${item.time || '09:00'}:00`);
  const wantedDay = Number(String(item.date).slice(8, 10)) || 1;
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(wantedDay, lastDay));
  return base;
}

function nextFinanceOccurrence(item) {
  if (item.repeat !== 'monthly') return new Date(`${item.date}T${item.time || '09:00'}:00`);
  let candidate = financeOccurrence(item, monthKey(now));
  if (!candidate || candidate <= now) candidate = financeOccurrence(item, monthKey(addMonths(now, 1)));
  return candidate;
}

function isFinanceCompleted(item, period = state.financeMonth) {
  return item.repeat === 'monthly' ? Boolean(item.completedPeriods?.[period]) : Boolean(item.completed);
}

function syncAllNotifications() {
  const oldKeys = Array.isArray(state.notificationKeys) ? state.notificationKeys : [];
  oldKeys.forEach(cancelNative);
  state.tasks.forEach(t => cancelNative(t.id));

  const nextKeys = [];
  if (state.settings.taskNotifications) {
    state.tasks.forEach(t => {
      if (t.completed) return;
      const due = taskDue(t);
      normalizeReminders(t.reminders).forEach(minutes => {
        const trigger = new Date(due.getTime() - minutes * 60000);
        const key = notificationKey(`task-${t.id}`, minutes);
        if (scheduleNative(key, t.title, trigger)) nextKeys.push(key);
      });
    });
  }
  if (state.settings.financeNotifications) {
    state.finances.forEach(item => {
      let occurrence = nextFinanceOccurrence(item);
      if (!occurrence || occurrence <= now) return;
      let period = monthKey(occurrence);
      if (isFinanceCompleted(item, period)) {
        if (item.repeat !== 'monthly') return;
        occurrence = financeOccurrence(item, monthKey(addMonths(occurrence, 1)));
        if (!occurrence) return;
        period = monthKey(occurrence);
      }
      const prefix = item.type === 'income' ? 'Ожидаемый доход' : 'Предстоящий расход';
      normalizeReminders(item.reminders).forEach(minutes => {
        const trigger = new Date(occurrence.getTime() - minutes * 60000);
        const key = notificationKey(`finance-${item.id}`, minutes);
        const text = `${prefix}: ${item.title} — ${money(item.amount)}`;
        if (scheduleNative(key, text, trigger)) nextKeys.push(key);
      });
    });
  }
  state.notificationKeys = nextKeys;
  localStorage.setItem(STORAGE, JSON.stringify(state));
}
window.syncAllNotifications = syncAllNotifications;

function save() {
  localStorage.setItem(STORAGE, JSON.stringify(state));
  syncAllNotifications();
}

const headings = {
  today: ['Добрый день, Альберт', titleDate(now)],
  plan: ['План', 'Прошлые и будущие дни'],
  assistant: ['Помощник', 'Текстовый режим · версия 1.2'],
  projects: ['Проекты', 'Создание и управление проектами'],
  finance: ['Финансовый план', 'Доходы, расходы и платежи'],
  more: ['Еще', 'Настройки и управление данными']
};

function visibleTasks(list) {
  return state.settings.showCompleted ? list : list.filter(t => !t.completed);
}

function render() {
  renderToday();
  renderPlan();
  renderAssistant();
  renderProjects();
  renderFinance();
  renderMore();
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === page));
  const activeNav = page === 'finance' ? 'more' : page;
  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === activeNav));
  document.querySelector('#page-title').textContent = headings[page][0];
  document.querySelector('#page-subtitle').textContent = headings[page][1];
  document.querySelector('#fab').style.display = ['assistant', 'more'].includes(page) ? 'none' : 'block';
  document.querySelector('#fab').setAttribute('aria-label', page === 'projects' ? 'Добавить проект' : page === 'finance' ? 'Добавить операцию' : 'Добавить задачу');
}

function taskCard(t) {
  const p = project(t.project);
  const late = !t.completed && taskDue(t) < new Date();
  const reminders = normalizeReminders(t.reminders);
  return `<article class="card task ${t.completed ? 'completed' : ''}">
    <button type="button" class="task-check" onclick="toggleTask('${t.id}')">${t.completed ? '✓' : ''}</button>
    <div>
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-meta">
        <span class="${late ? 'overdue' : ''}">◷ ${short(taskDue(t))}, ${t.time}</span>
        ${p ? `<span style="color:${p.color}">▰ ${esc(p.name)}</span>` : ''}
        ${t.priority === 'high' ? '<span style="color:#ff9f43">⚑ Высокий</span>' : ''}
        ${reminders.length ? `<span>🔔 ${reminders.map(reminderText).join(', ')}</span>` : '<span>🔕 без уведомления</span>'}
      </div>
    </div>
    <div class="item-actions">
      <button type="button" class="mini-btn" onclick="openTaskDialog(false,'${t.id}')" aria-label="Изменить">✎</button>
      <button type="button" class="mini-btn" onclick="deleteTask('${t.id}')" aria-label="Удалить">×</button>
    </div>
  </article>`;
}

function monthFinanceTotals(period = monthKey(now)) {
  const list = financesForMonth(period);
  const income = list.filter(x => x.item.type === 'income').reduce((s, x) => s + Number(x.item.amount || 0), 0);
  const expense = list.filter(x => x.item.type === 'expense').reduce((s, x) => s + Number(x.item.amount || 0), 0);
  return { income, expense, balance: income - expense };
}

function renderToday() {
  const all = state.tasks.filter(t => t.date === dayKey(now)).sort((a, b) => a.time.localeCompare(b.time));
  const list = visibleTasks(all);
  const done = all.filter(t => t.completed).length;
  const progress = all.length ? Math.round(done / all.length * 100) : 0;
  const late = state.tasks.filter(t => !t.completed && taskDue(t) < new Date()).length;
  const next = state.tasks.filter(t => !t.completed && taskDue(t) > new Date()).sort((a, b) => taskDue(a) - taskDue(b))[0];
  const totals = monthFinanceTotals(monthKey(now));
  const upcomingPayments = state.finances.filter(x => {
    const d = nextFinanceOccurrence(x);
    return d && d >= now && d <= addDays(now, 7) && !isFinanceCompleted(x, monthKey(d));
  }).length;
  document.querySelector('#today').innerHTML = `
    <div class="hero">
      <div class="hero-row"><div class="ai-mark">✦</div><span class="badge">Версия 1.2</span></div>
      <div><small>${next ? 'Следующее дело' : 'План свободен'}</small><h2>${next ? esc(next.title) : 'Добавьте новую задачу или спланируйте проект.'}</h2>${next ? `<div class="due">◷ ${short(taskDue(next))}, ${next.time}</div>` : ''}</div>
    </div>
    <div class="metrics"><div class="metric"><div class="metric-icon">✓</div><strong>${progress}%</strong><small>выполнено сегодня</small></div><div class="metric"><div class="metric-icon">⚠</div><strong>${late}</strong><small>просрочено</small></div></div>
    <div class="section-head"><h3>Быстрые команды</h3></div>
    <div class="chips"><button type="button" class="chip" onclick="quickCommand('Что у меня сегодня?')">☀ Что сегодня?</button><button type="button" class="chip" onclick="openTaskDialog(true)">＋ На завтра</button><button type="button" class="chip" onclick="openFinance()">₸ Финансы</button></div>
    <div class="section-head"><h3>Финансы месяца</h3><span class="counter">${upcomingPayments} в ближайшие 7 дней</span></div>
    <article class="card finance-launch" onclick="openFinance()"><div class="row-between"><div><small>Плановый баланс</small><h3 class="${totals.balance >= 0 ? 'positive' : 'negative'}">${money(totals.balance)}</h3></div><span style="font-size:24px">›</span></div><p>Доходы ${money(totals.income)} · расходы ${money(totals.expense)}</p></article>
    <div class="section-head"><h3>Сегодня</h3><span class="counter">${list.length}</span></div>
    ${list.length ? list.map(taskCard).join('') : '<div class="card empty">На сегодня задач нет.</div>'}`;
}

function renderPlan() {
  const center = selectedDateObject();
  const days = Array.from({ length: 15 }, (_, i) => addDays(center, i - 7));
  const all = state.tasks.filter(t => t.date === state.selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const list = visibleTasks(all);
  const selectedTitle = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(center);
  document.querySelector('#plan').innerHTML = `
    <div class="plan-toolbar">
      <button type="button" onclick="shiftPlanDay(-1)">‹</button>
      <button type="button" class="plan-today" onclick="goToPlanToday()">Сегодня</button>
      <button type="button" onclick="shiftPlanDay(1)">›</button>
    </div>
    <div class="date-strip">
      ${days.map(d => {
        const key = dayKey(d);
        return `<button type="button" class="date-chip ${key === state.selectedDate ? 'selected' : ''} ${key === dayKey(now) ? 'today' : ''} ${key < dayKey(now) ? 'past' : ''}" onclick="selectDate('${key}')"><span>${new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d)}</span><strong>${d.getDate()}</strong></button>`;
      }).join('')}
    </div>
    <div class="section-head"><h3 style="text-transform:capitalize">${selectedTitle}</h3><span class="counter">${list.length}</span></div>
    ${list.length ? list.map(taskCard).join('') : '<div class="card empty">На этот день задач нет.</div>'}`;
  requestAnimationFrame(() => document.querySelector('.date-chip.selected')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
}

function renderAssistant() {
  document.querySelector('#assistant').innerHTML = `<div class="assistant-wrap">
    <div class="voice-note">🎙️ <div><strong>Голосовой разговор — версия 2</strong><br><small>Сейчас доступен текстовый режим</small></div></div>
    <div class="chips"><button class="chip" onclick="quickCommand('Что у меня сегодня?')">Что сегодня?</button><button class="chip" onclick="quickCommand('Что просрочено?')">Просрочено</button><button class="chip" onclick="quickCommand('Покажи проекты')">Проекты</button><button class="chip" onclick="quickCommand('Покажи финансы')">Финансы</button></div>
    <div class="chat" id="chat">${state.messages.map(m => `<div class="bubble ${m.role}">${esc(m.text)}</div>`).join('')}</div>
    <form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Напишите команду…"><button class="send" type="submit">↑</button></form>
  </div>`;
  document.querySelector('#chat-form').onsubmit = e => { e.preventDefault(); const input = document.querySelector('#chat-input'); quickCommand(input.value); input.value = ''; };
  requestAnimationFrame(() => { const c = document.querySelector('#chat'); if (c) c.scrollTop = c.scrollHeight; });
}

function renderProjects() {
  document.querySelector('#projects').innerHTML = `
    <div class="section-head"><h3>Все проекты</h3><button type="button" class="chip" onclick="openProjectDialog()">＋ Добавить</button></div>
    ${state.projects.length ? state.projects.map(p => {
      const all = state.tasks.filter(t => t.project === p.id);
      const done = all.filter(t => t.completed).length;
      const progress = all.length ? Math.round(done / all.length * 100) : 0;
      return `<article class="card project">
        <div class="project-head"><span class="project-bar" style="background:${p.color}"></span><div style="flex:1"><h3>${esc(p.name)}</h3><p>${esc(p.description || 'Без описания')}</p></div><strong>${progress}%</strong></div>
        <div class="progress"><span style="width:${progress}%;background:${p.color}"></span></div>
        <p>Открыто задач: ${all.filter(t => !t.completed).length} · всего: ${all.length}</p>
        <div class="project-actions"><button type="button" onclick="openProjectDialog('${p.id}')">Изменить</button><button type="button" class="danger" onclick="deleteProject('${p.id}')">Удалить</button></div>
      </article>`;
    }).join('') : '<div class="card empty">Проектов пока нет. Нажмите «Добавить».</div>'}`;
}

function financesForMonth(period) {
  return state.finances.map(item => ({ item, occurrence: financeOccurrence(item, period) }))
    .filter(x => x.occurrence)
    .sort((a, b) => a.occurrence - b.occurrence);
}

function financeCard({ item, occurrence }) {
  const completed = isFinanceCompleted(item, state.financeMonth);
  const income = item.type === 'income';
  return `<article class="card finance-item">
    <div class="finance-head">
      <div class="finance-icon">${income ? '↗' : '↘'}</div>
      <div class="finance-main"><strong>${esc(item.title)}</strong><small>${CATEGORY_LABELS[item.category] || 'Другое'}${item.repeat === 'monthly' ? ' · ежемесячно' : ''}</small></div>
      <div class="money ${income ? 'positive' : 'negative'}">${income ? '+' : '−'}${money(item.amount)}</div>
    </div>
    <div class="finance-meta"><span>◷ ${short(occurrence)}, ${item.time}</span><span>${normalizeReminders(item.reminders).length ? `🔔 ${normalizeReminders(item.reminders).map(reminderText).join(', ')}` : '🔕 без уведомления'}</span></div>
    <button type="button" class="status-btn ${completed ? 'done' : ''}" onclick="toggleFinanceStatus('${item.id}')">${completed ? '✓ Учтено' : income ? 'Отметить получение' : 'Отметить оплату'}</button>
    <div class="project-actions"><button type="button" onclick="openFinanceDialog('${item.id}')">Изменить</button><button type="button" class="danger" onclick="deleteFinance('${item.id}')">Удалить</button></div>
  </article>`;
}

function renderFinance() {
  const monthDate = selectedFinanceMonthObject();
  const title = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(monthDate);
  const list = financesForMonth(state.financeMonth);
  const totals = monthFinanceTotals(state.financeMonth);
  document.querySelector('#finance').innerHTML = `
    <button type="button" class="chip" onclick="page='more';render()">‹ Назад в «Еще»</button>
    <div class="month-toolbar" style="margin-top:12px">
      <button type="button" onclick="shiftFinanceMonth(-1)">‹</button>
      <button type="button" onclick="goFinanceCurrentMonth()" style="text-transform:capitalize">${title}</button>
      <button type="button" onclick="shiftFinanceMonth(1)">›</button>
    </div>
    <div class="finance-summary">
      <article class="card"><small>Доходы</small><strong class="positive">${money(totals.income)}</strong></article>
      <article class="card"><small>Расходы</small><strong class="negative">${money(totals.expense)}</strong></article>
    </div>
    <article class="card finance-balance"><small style="color:var(--muted)">Плановый остаток</small><strong class="${totals.balance >= 0 ? 'positive' : 'negative'}">${money(totals.balance)}</strong></article>
    <div class="section-head"><h3>Операции</h3><button class="chip" type="button" onclick="openFinanceDialog()">＋ Добавить</button></div>
    ${list.length ? list.map(financeCard).join('') : '<div class="card empty">На этот месяц доходы и расходы не запланированы.</div>'}`;
}

function reminderDefaultsMarkup(values, handler) {
  const selected = normalizeReminders(values);
  return REMINDER_PRESETS.map(p => `<label class="check-option"><input type="checkbox" ${selected.includes(p.value) ? 'checked' : ''} onchange="${handler}(${p.value},this.checked)">${p.label}</label>`).join('');
}

function renderMore() {
  const completed = state.tasks.filter(t => t.completed).length;
  const totals = monthFinanceTotals(monthKey(now));
  document.querySelector('#more').innerHTML = `
    <article class="card more-card"><div class="profile"><div class="avatar">АБ</div><div><strong>Альберт Беккер</strong><p style="margin:4px 0;color:var(--muted)">Начальник диспетчерской службы</p></div></div><div class="data-summary"><div><strong>${state.tasks.length}</strong><small>задач</small></div><div><strong>${state.projects.length}</strong><small>проектов</small></div><div><strong>${state.finances.length}</strong><small>операций</small></div></div></article>
    <article class="card finance-launch" onclick="openFinance()"><div class="row-between"><div><small>Финансовый план</small><h3 class="${totals.balance >= 0 ? 'positive' : 'negative'}">${money(totals.balance)}</h3></div><span style="font-size:25px">›</span></div><p>Планирование доходов, расходов и уведомлений по платежам</p></article>

    <div class="settings-title">Задачи и план</div>
    <div class="card settings-group">
      <div class="setting-row"><div class="setting-copy"><strong>Показывать выполненные</strong><small>Оставлять завершенные задачи в списках</small></div><label class="switch"><input type="checkbox" ${state.settings.showCompleted ? 'checked' : ''} onchange="setSetting('showCompleted',this.checked)"><span></span></label></div>
      <div class="setting-row"><div class="setting-copy"><strong>Подтверждать удаление</strong><small>Спрашивать перед удалением</small></div><label class="switch"><input type="checkbox" ${state.settings.confirmDelete ? 'checked' : ''} onchange="setSetting('confirmDelete',this.checked)"><span></span></label></div>
      <div class="setting-row"><div class="setting-copy"><strong>Время новой задачи</strong><small>Значение по умолчанию</small></div><input type="time" value="${state.settings.defaultTime}" onchange="setSetting('defaultTime',this.value)" style="width:115px;padding:8px"></div>
    </div>

    <div class="settings-title">Уведомления задач</div>
    <div class="card settings-group">
      <div class="setting-row"><div class="setting-copy"><strong>Уведомления задач</strong><small>Общий выключатель</small></div><label class="switch"><input type="checkbox" ${state.settings.taskNotifications ? 'checked' : ''} onchange="setSetting('taskNotifications',this.checked)"><span></span></label></div>
      <div class="default-reminders"><strong>По умолчанию для новых задач</strong><div class="check-grid">${reminderDefaultsMarkup(state.settings.defaultTaskReminders, 'toggleDefaultTaskReminder')}</div></div>
    </div>

    <div class="settings-title">Уведомления финансов</div>
    <div class="card settings-group">
      <div class="setting-row"><div class="setting-copy"><strong>Доходы и платежи</strong><small>Напоминать о запланированных операциях</small></div><label class="switch"><input type="checkbox" ${state.settings.financeNotifications ? 'checked' : ''} onchange="setSetting('financeNotifications',this.checked)"><span></span></label></div>
      <div class="default-reminders"><strong>По умолчанию для новых операций</strong><div class="check-grid">${reminderDefaultsMarkup(state.settings.defaultFinanceReminders, 'toggleDefaultFinanceReminder')}</div></div>
      <button type="button" class="setting-row action-row" onclick="requestNotificationPermission()"><div class="setting-copy"><strong>Разрешение Android</strong><small>Запросить системное разрешение на уведомления</small></div><span>›</span></button>
    </div>

    <div class="settings-title">Финансы</div>
    <div class="card settings-group">
      <div class="setting-row"><div class="setting-copy"><strong>Валюта</strong><small>Для плановых сумм</small></div><select onchange="setSetting('currency',this.value)"><option value="KZT" ${state.settings.currency === 'KZT' ? 'selected' : ''}>₸ KZT</option><option value="RUB" ${state.settings.currency === 'RUB' ? 'selected' : ''}>₽ RUB</option><option value="USD" ${state.settings.currency === 'USD' ? 'selected' : ''}>$ USD</option></select></div>
    </div>

    <div class="settings-title">Данные</div>
    <div class="card settings-group">
      <button type="button" class="setting-row action-row" onclick="exportData()"><div class="setting-copy"><strong>Скопировать резервную копию</strong><small>Задачи, проекты, финансы и настройки</small></div><span>›</span></button>
      <button type="button" class="setting-row action-row" onclick="importData()"><div class="setting-copy"><strong>Восстановить из копии</strong><small>Вставить ранее сохраненные данные</small></div><span>›</span></button>
      <button type="button" class="setting-row action-row" onclick="clearCompleted()"><div class="setting-copy"><strong>Удалить выполненные задачи</strong><small>Сейчас выполнено: ${completed}</small></div><span>›</span></button>
      <button type="button" class="setting-row action-row danger" onclick="resetData()"><div class="setting-copy"><strong>Сбросить приложение</strong><small>Удалить все пользовательские данные</small></div><span>›</span></button>
    </div>

    <article class="card more-card voice-v2"><div style="font-size:30px">〽</div><h3>Версия 2: голосовой разговор</h3><p>Потоковый диалог, озвучивание плана и подтверждение действий голосом.</p></article>
    <p style="text-align:center;color:var(--muted);margin-top:24px">Штаб AI · 1.2.0</p>`;
}

window.toggleTask = id => {
  const t = state.tasks.find(t => t.id === id);
  if (t) { t.completed = !t.completed; save(); render(); }
};
window.deleteTask = id => {
  const remove = () => { state.tasks = state.tasks.filter(t => t.id !== id); save(); render(); toast('Задача удалена'); };
  if (!state.settings.confirmDelete || confirm('Удалить задачу?')) remove();
};
window.selectDate = key => { state.selectedDate = key; save(); render(); };
window.shiftPlanDay = amount => { state.selectedDate = dayKey(addDays(selectedDateObject(), amount)); save(); render(); };
window.goToPlanToday = () => { state.selectedDate = dayKey(now); page = 'plan'; save(); render(); };

function setReminderChecks(containerId, values) {
  const selected = normalizeReminders(values);
  document.querySelector(`#${containerId}`).innerHTML = REMINDER_PRESETS.map(p => `<label class="check-option"><input type="checkbox" value="${p.value}" ${selected.includes(p.value) ? 'checked' : ''}>${p.label}</label>`).join('');
}
function readReminders(containerId, customId) {
  const values = [...document.querySelectorAll(`#${containerId} input:checked`)].map(x => Number(x.value));
  const custom = Number(document.querySelector(`#${customId}`).value);
  if (Number.isFinite(custom) && custom > 0) values.push(custom);
  return normalizeReminders(values);
}
function customReminderValue(values) {
  return normalizeReminders(values).find(v => !REMINDER_PRESETS.some(p => p.value === v)) || '';
}
function closeDialog(id, formId) {
  const d = document.querySelector(`#${id}`);
  document.querySelector(`#${formId}`).reset();
  if (d.open) d.close();
}

window.openTaskDialog = (tomorrow = false, editId = '') => {
  const item = state.tasks.find(t => t.id === editId);
  const baseDate = page === 'plan' && !tomorrow ? selectedDateObject() : (tomorrow ? addDays(now, 1) : now);
  document.querySelector('#task-form').reset();
  document.querySelector('#task-id').value = item?.id || '';
  document.querySelector('#task-dialog-title').textContent = item ? 'Изменить задачу' : 'Новая задача';
  document.querySelector('#task-title').value = item?.title || '';
  document.querySelector('#task-date').value = item?.date || dayKey(baseDate);
  document.querySelector('#task-time').value = item?.time || state.settings.defaultTime;
  document.querySelector('#task-project').innerHTML = '<option value="">Без проекта</option>' + state.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  document.querySelector('#task-project').value = item?.project || '';
  document.querySelector('#task-priority').value = item?.priority || 'normal';
  const reminders = item ? item.reminders : state.settings.defaultTaskReminders;
  setReminderChecks('task-reminders', reminders);
  document.querySelector('#task-custom-reminder').value = customReminderValue(reminders);
  document.querySelector('#task-title-error').hidden = true;
  document.querySelector('#task-dialog').showModal();
};

window.openProjectDialog = (id = '') => {
  const p = state.projects.find(x => x.id === id);
  document.querySelector('#project-form').reset();
  document.querySelector('#project-id').value = p?.id || '';
  document.querySelector('#project-dialog-title').textContent = p ? 'Изменить проект' : 'Новый проект';
  document.querySelector('#project-name').value = p?.name || '';
  document.querySelector('#project-description').value = p?.description || '';
  document.querySelector('#project-color').value = p?.color || '#7c5cfc';
  document.querySelector('#project-name-error').hidden = true;
  document.querySelector('#project-dialog').showModal();
};
window.deleteProject = id => {
  const p = project(id);
  if (!p) return;
  const taskCount = state.tasks.filter(t => t.project === id).length;
  const text = taskCount ? `Удалить проект «${p.name}»? ${taskCount} задач останутся без проекта.` : `Удалить проект «${p.name}»?`;
  if (confirm(text)) {
    state.tasks.forEach(t => { if (t.project === id) t.project = ''; });
    state.projects = state.projects.filter(x => x.id !== id);
    save(); render(); toast('Проект удален');
  }
};

window.openFinance = () => { page = 'finance'; render(); };
window.shiftFinanceMonth = amount => { state.financeMonth = monthKey(addMonths(selectedFinanceMonthObject(), amount)); save(); render(); };
window.goFinanceCurrentMonth = () => { state.financeMonth = monthKey(now); save(); render(); };
window.openFinanceDialog = (id = '') => {
  const item = state.finances.find(x => x.id === id);
  document.querySelector('#finance-form').reset();
  document.querySelector('#finance-id').value = item?.id || '';
  document.querySelector('#finance-dialog-title').textContent = item ? 'Изменить операцию' : 'Новая операция';
  document.querySelector(`input[name="finance-type"][value="${item?.type || 'expense'}"]`).checked = true;
  document.querySelector('#finance-title').value = item?.title || '';
  document.querySelector('#finance-amount').value = item?.amount || '';
  document.querySelector('#finance-date').value = item?.date || dayKey(now);
  document.querySelector('#finance-time').value = item?.time || '09:00';
  document.querySelector('#finance-category').value = item?.category || (item?.type === 'income' ? 'salary' : 'other');
  document.querySelector('#finance-repeat').value = item?.repeat || 'none';
  const reminders = item ? item.reminders : state.settings.defaultFinanceReminders;
  setReminderChecks('finance-reminders', reminders);
  document.querySelector('#finance-custom-reminder').value = customReminderValue(reminders);
  document.querySelector('#finance-title-error').hidden = true;
  document.querySelector('#finance-amount-error').hidden = true;
  document.querySelector('#finance-dialog').showModal();
};
window.toggleFinanceStatus = id => {
  const item = state.finances.find(x => x.id === id);
  if (!item) return;
  if (item.repeat === 'monthly') {
    item.completedPeriods = item.completedPeriods || {};
    item.completedPeriods[state.financeMonth] = !item.completedPeriods[state.financeMonth];
  } else item.completed = !item.completed;
  save(); render();
};
window.deleteFinance = id => {
  if (!state.settings.confirmDelete || confirm('Удалить финансовую операцию?')) {
    state.finances = state.finances.filter(x => x.id !== id);
    save(); render(); toast('Операция удалена');
  }
};

function parseDue(text) {
  let d = new Date();
  const s = text.toLowerCase();
  if (s.includes('послезавтра')) d = addDays(d, 2);
  else if (s.includes('завтра')) d = addDays(d, 1);
  let [h, m] = state.settings.defaultTime.split(':').map(Number);
  const tm = s.match(/\b(?:в|на)\s*(\d{1,2})[:.](\d{2})\b/);
  if (tm) { h = +tm[1]; m = +tm[2]; }
  else if (s.includes('утром')) { h = 9; m = 0; }
  else if (s.includes('после обеда')) { h = 15; m = 0; }
  else if (s.includes('вечером')) { h = 19; m = 0; }
  d.setHours(h, m, 0, 0);
  return d;
}
function cleanTitle(s) {
  return s.replace(/^(добавь задачу|создай задачу|запланируй)\s*/i, '')
    .replace(/\b(сегодня|завтра|послезавтра|утром|вечером)\b/gi, '')
    .replace(/\b(до|после) обеда\b/gi, '')
    .replace(/\b(?:в|на)\s*\d{1,2}[:.]\d{2}\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}
function answer(text) {
  const l = text.toLowerCase().replaceAll('ё', 'е');
  if (l.includes('что у меня сегодня') || l.includes('план на сегодня')) {
    const a = state.tasks.filter(t => t.date === dayKey(now) && !t.completed);
    return a.length ? a.map(t => `• ${t.time} — ${t.title}`).join('\n') : 'На сегодня задач нет.';
  }
  if (l.includes('просроч')) {
    const a = state.tasks.filter(t => !t.completed && taskDue(t) < new Date());
    return a.length ? a.map(t => `• ${short(taskDue(t))}, ${t.time} — ${t.title}`).join('\n') : 'Просроченных задач нет.';
  }
  if (l.includes('покажи проекты') || l === 'проекты') {
    return state.projects.length ? state.projects.map(p => `• ${p.name}: открыто ${state.tasks.filter(t => t.project === p.id && !t.completed).length}`).join('\n') : 'Проектов пока нет.';
  }
  if (l.includes('финанс')) {
    const totals = monthFinanceTotals(monthKey(now));
    return `План на текущий месяц:\n• Доходы: ${money(totals.income)}\n• Расходы: ${money(totals.expense)}\n• Остаток: ${money(totals.balance)}`;
  }
  if (/^(заверши|закрой|выполни) задачу/.test(l)) {
    const f = l.replace(/^(заверши|закрой|выполни) задачу\s*/, '');
    const t = state.tasks.find(x => !x.completed && x.title.toLowerCase().includes(f));
    if (!t) return `Не нашел задачу «${f}».`;
    t.completed = true;
    return `Задача «${t.title}» завершена.`;
  }
  if (/^(добавь задачу|создай задачу|запланируй)/.test(l)) {
    const d = parseDue(l);
    const name = cleanTitle(text);
    if (!name) return 'Не понял название задачи.';
    const p = state.projects.find(p => l.includes(p.name.toLowerCase()));
    state.tasks.push({ id: uid(), title: name[0].toUpperCase() + name.slice(1), date: dayKey(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, project: p?.id || '', priority: 'normal', completed: false, reminders: [...state.settings.defaultTaskReminders] });
    return `Создал задачу «${name}» на ${short(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}.`;
  }
  return 'Я понимаю команды по задачам, проектам и финансовому плану. Для подробного ввода используйте соответствующий раздел.';
}
window.quickCommand = text => {
  text = String(text || '').trim();
  if (!text) return;
  state.messages.push({ role: 'user', text });
  state.messages.push({ role: 'assistant', text: answer(text) });
  save(); page = 'assistant'; render();
};

window.setSetting = (key, value) => {
  state.settings[key] = value;
  if (['taskNotifications', 'financeNotifications'].includes(key) && value && native()) try { Android.requestNotifications(); } catch {}
  save(); render(); toast('Настройка сохранена');
};
window.toggleDefaultTaskReminder = (value, checked) => {
  const set = new Set(state.settings.defaultTaskReminders);
  checked ? set.add(value) : set.delete(value);
  state.settings.defaultTaskReminders = normalizeReminders([...set]);
  save(); render();
};
window.toggleDefaultFinanceReminder = (value, checked) => {
  const set = new Set(state.settings.defaultFinanceReminders);
  checked ? set.add(value) : set.delete(value);
  state.settings.defaultFinanceReminders = normalizeReminders([...set]);
  save(); render();
};
window.requestNotificationPermission = () => {
  if (native()) {
    try { Android.requestNotifications(); toast('Запрос разрешения отправлен'); } catch { toast('Не удалось открыть разрешение'); }
  } else toast('Системные уведомления доступны в APK');
};
window.exportData = async () => {
  const copy = JSON.stringify(state);
  try { await navigator.clipboard.writeText(copy); toast('Резервная копия скопирована'); }
  catch { prompt('Скопируйте резервную копию:', copy); }
};
window.importData = () => {
  const raw = prompt('Вставьте резервную копию приложения:');
  if (!raw) return;
  try {
    const restored = JSON.parse(raw);
    if (!Array.isArray(restored.tasks) || !Array.isArray(restored.projects)) throw new Error('invalid');
    state = {
      ...restored,
      finances: Array.isArray(restored.finances) ? restored.finances : [],
      settings: { ...defaultSettings(), ...(restored.settings || {}) },
      messages: Array.isArray(restored.messages) ? restored.messages : [],
      selectedDate: restored.selectedDate || dayKey(now),
      financeMonth: restored.financeMonth || monthKey(now),
      notificationKeys: Array.isArray(restored.notificationKeys) ? restored.notificationKeys : []
    };
    state.tasks = state.tasks.map(t => ({ ...t, reminders: normalizeReminders(t.reminders, state.settings.defaultTaskReminders) }));
    save(); render(); toast('Данные восстановлены');
  } catch { alert('Не удалось восстановить данные: резервная копия имеет неверный формат.'); }
};
window.clearCompleted = () => {
  const count = state.tasks.filter(t => t.completed).length;
  if (!count) return toast('Выполненных задач нет');
  if (confirm(`Удалить выполненные задачи: ${count}?`)) {
    state.tasks = state.tasks.filter(t => !t.completed);
    save(); render(); toast('Выполненные задачи удалены');
  }
};
window.resetData = () => {
  if (confirm('Удалить задачи, проекты, финансовый план и настройки?')) {
    state.notificationKeys.forEach(cancelNative);
    state = seed(); save(); render(); toast('Стартовые данные восстановлены');
  }
};

document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => { page = b.dataset.page; render(); });
document.querySelector('#fab').onclick = () => {
  if (page === 'projects') openProjectDialog();
  else if (page === 'finance') openFinanceDialog();
  else openTaskDialog(false);
};
document.querySelector('#notify-btn').onclick = () => { page = 'more'; render(); };

document.querySelector('#task-close').onclick = () => closeDialog('task-dialog', 'task-form');
document.querySelector('#task-cancel').onclick = () => closeDialog('task-dialog', 'task-form');
document.querySelector('#task-dialog').addEventListener('cancel', e => { e.preventDefault(); closeDialog('task-dialog', 'task-form'); });
document.querySelector('#task-title').addEventListener('input', () => { document.querySelector('#task-title-error').hidden = true; });
document.querySelector('#task-form').onsubmit = e => {
  e.preventDefault();
  const title = document.querySelector('#task-title').value.trim();
  if (!title) { document.querySelector('#task-title-error').hidden = false; document.querySelector('#task-title').focus(); return; }
  const id = document.querySelector('#task-id').value;
  const data = {
    title,
    date: document.querySelector('#task-date').value || dayKey(now),
    time: document.querySelector('#task-time').value || state.settings.defaultTime,
    project: document.querySelector('#task-project').value,
    priority: document.querySelector('#task-priority').value,
    reminders: readReminders('task-reminders', 'task-custom-reminder')
  };
  if (id) Object.assign(state.tasks.find(t => t.id === id), data);
  else state.tasks.push({ id: uid(), ...data, completed: false });
  state.selectedDate = data.date;
  save(); closeDialog('task-dialog', 'task-form'); render(); toast(id ? 'Задача изменена' : 'Задача создана');
};

document.querySelector('#project-close').onclick = () => closeDialog('project-dialog', 'project-form');
document.querySelector('#project-cancel').onclick = () => closeDialog('project-dialog', 'project-form');
document.querySelector('#project-dialog').addEventListener('cancel', e => { e.preventDefault(); closeDialog('project-dialog', 'project-form'); });
document.querySelector('#project-name').addEventListener('input', () => { document.querySelector('#project-name-error').hidden = true; });
document.querySelector('#project-form').onsubmit = e => {
  e.preventDefault();
  const name = document.querySelector('#project-name').value.trim();
  if (!name) { document.querySelector('#project-name-error').hidden = false; document.querySelector('#project-name').focus(); return; }
  const id = document.querySelector('#project-id').value;
  const data = { name, description: document.querySelector('#project-description').value.trim(), color: document.querySelector('#project-color').value };
  if (id) Object.assign(project(id), data);
  else state.projects.push({ id: uid(), ...data });
  save(); closeDialog('project-dialog', 'project-form'); render(); toast(id ? 'Проект изменен' : 'Проект создан');
};

document.querySelector('#finance-close').onclick = () => closeDialog('finance-dialog', 'finance-form');
document.querySelector('#finance-cancel').onclick = () => closeDialog('finance-dialog', 'finance-form');
document.querySelector('#finance-dialog').addEventListener('cancel', e => { e.preventDefault(); closeDialog('finance-dialog', 'finance-form'); });
document.querySelector('#finance-title').addEventListener('input', () => { document.querySelector('#finance-title-error').hidden = true; });
document.querySelector('#finance-amount').addEventListener('input', () => { document.querySelector('#finance-amount-error').hidden = true; });
document.querySelector('#finance-form').onsubmit = e => {
  e.preventDefault();
  const title = document.querySelector('#finance-title').value.trim();
  const amount = Number(document.querySelector('#finance-amount').value);
  let valid = true;
  if (!title) { document.querySelector('#finance-title-error').hidden = false; valid = false; }
  if (!(amount > 0)) { document.querySelector('#finance-amount-error').hidden = false; valid = false; }
  if (!valid) return;
  const id = document.querySelector('#finance-id').value;
  const type = document.querySelector('input[name="finance-type"]:checked').value;
  const data = {
    type, title, amount,
    date: document.querySelector('#finance-date').value || dayKey(now),
    time: document.querySelector('#finance-time').value || '09:00',
    category: document.querySelector('#finance-category').value,
    repeat: document.querySelector('#finance-repeat').value,
    reminders: readReminders('finance-reminders', 'finance-custom-reminder')
  };
  if (id) Object.assign(state.finances.find(x => x.id === id), data);
  else state.finances.push({ id: uid(), ...data, completed: false, completedPeriods: {} });
  state.financeMonth = String(data.date).slice(0, 7);
  save(); closeDialog('finance-dialog', 'finance-form'); page = 'finance'; render(); toast(id ? 'Операция изменена' : 'Операция добавлена');
};

render();
syncAllNotifications();
