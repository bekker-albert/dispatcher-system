const STORAGE = 'shtab-ai-v1';
const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = new Date();
const esc = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const defaultSettings = () => ({ notifications: true, showCompleted: true, confirmDelete: true, defaultTime: '18:00' });

const seed = () => ({
  projects: [
    { id: 'aidarly', name: 'Айдарлы', description: 'Бюджет, запуск проекта и диспетчеризация', color: '#7c5cfc' },
    { id: 'dispatch', name: 'Диспетчерская служба', description: 'Текущие задачи, GPS и отчетность', color: '#00cfe8' },
    { id: 'personal', name: 'Личное', description: 'Личные дела и автомобиль', color: '#28c76f' }
  ],
  tasks: [
    { id: uid(), title: 'Сверить текущие задачи диспетчерской службы', date: dayKey(now), time: '17:30', project: 'dispatch', priority: 'high', completed: false },
    { id: uid(), title: 'Подготовить вопросы по бюджету Айдарлы', date: dayKey(addDays(now, 1)), time: '10:00', project: 'aidarly', priority: 'high', completed: false },
    { id: uid(), title: 'Проверить статус пилотного проекта CARVIS', date: dayKey(addDays(now, 1)), time: '14:00', project: 'dispatch', priority: 'normal', completed: false }
  ],
  messages: [{ role: 'assistant', text: 'Я готов. В версии 1.1 могу создавать, переносить и завершать задачи, показывать план за прошлые и будущие дни. Голосовой разговор будет в версии 2.' }],
  selectedDate: dayKey(now),
  settings: defaultSettings()
});

let state;
try { state = JSON.parse(localStorage.getItem(STORAGE)) || seed(); } catch { state = seed(); }
state.projects = Array.isArray(state.projects) ? state.projects : seed().projects;
state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
state.messages = Array.isArray(state.messages) ? state.messages : [];
state.selectedDate = state.selectedDate || dayKey(now);
state.settings = { ...defaultSettings(), ...(state.settings || {}) };
let page = 'today';

const project = id => state.projects.find(p => p.id === id);
const due = t => new Date(`${t.date}T${t.time || state.settings.defaultTime}:00`);
const short = d => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(d);
const titleDate = d => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
const selectedDateObject = () => new Date(`${state.selectedDate}T12:00:00`);
const native = () => typeof Android !== 'undefined';

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

function syncNotification(t) {
  if (!native()) return;
  try {
    if (!state.settings.notifications || t.completed || due(t) <= new Date()) Android.cancelNotification(t.id);
    else Android.scheduleNotification(t.id, t.title, due(t).getTime());
  } catch {}
}

function syncAllNotifications() {
  state.tasks.forEach(syncNotification);
}
window.syncAllNotifications = syncAllNotifications;

function save() {
  localStorage.setItem(STORAGE, JSON.stringify(state));
  syncAllNotifications();
}

const headings = {
  today: ['Добрый день, Альберт', titleDate(now)],
  plan: ['План', 'Прошлые и будущие дни'],
  assistant: ['Помощник', 'Текстовый режим · версия 1.1'],
  projects: ['Проекты', 'Работа и личные направления'],
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
  renderMore();
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === page));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === page));
  document.querySelector('#page-title').textContent = headings[page][0];
  document.querySelector('#page-subtitle').textContent = headings[page][1];
  document.querySelector('#fab').style.display = ['assistant', 'more'].includes(page) ? 'none' : 'block';
}

function taskCard(t) {
  const p = project(t.project);
  const late = !t.completed && due(t) < new Date();
  return `<article class="card task ${t.completed ? 'completed' : ''}">
    <button type="button" class="task-check" onclick="toggleTask('${t.id}')">${t.completed ? '✓' : ''}</button>
    <div>
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-meta">
        <span class="${late ? 'overdue' : ''}">◷ ${short(due(t))}, ${t.time}</span>
        ${p ? `<span style="color:${p.color}">▰ ${esc(p.name)}</span>` : ''}
        ${t.priority === 'high' ? '<span style="color:#ff9f43">⚑ Высокий</span>' : ''}
      </div>
    </div>
    <button type="button" class="dot-menu" onclick="deleteTask('${t.id}')" aria-label="Удалить задачу">⋮</button>
  </article>`;
}

function renderToday() {
  const all = state.tasks.filter(t => t.date === dayKey(now)).sort((a, b) => a.time.localeCompare(b.time));
  const list = visibleTasks(all);
  const done = all.filter(t => t.completed).length;
  const progress = all.length ? Math.round(done / all.length * 100) : 0;
  const late = state.tasks.filter(t => !t.completed && due(t) < new Date()).length;
  const next = state.tasks.filter(t => !t.completed && due(t) > new Date()).sort((a, b) => due(a) - due(b))[0];
  document.querySelector('#today').innerHTML = `
    <div class="hero">
      <div class="hero-row"><div class="ai-mark">✦</div><span class="badge">Версия 1.1</span></div>
      <div><small>${next ? 'Следующее дело' : 'План свободен'}</small><h2>${next ? esc(next.title) : 'Добавьте новую задачу или спланируйте проект.'}</h2>${next ? `<div class="due">◷ ${short(due(next))}, ${next.time}</div>` : ''}</div>
    </div>
    <div class="metrics"><div class="metric"><div class="metric-icon">✓</div><strong>${progress}%</strong><small>выполнено сегодня</small></div><div class="metric"><div class="metric-icon">⚠</div><strong>${late}</strong><small>просрочено</small></div></div>
    <div class="section-head"><h3>Быстрые команды</h3></div>
    <div class="chips"><button type="button" class="chip" onclick="quickCommand('Что у меня сегодня?')">☀ Что сегодня?</button><button type="button" class="chip" onclick="openTaskDialog(true)">＋ На завтра</button><button type="button" class="chip" onclick="goToPlanToday()">▦ Открыть план</button></div>
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
      <button type="button" onclick="shiftPlanDay(-1)" aria-label="Предыдущий день">‹</button>
      <button type="button" class="plan-today" onclick="goToPlanToday()">Сегодня</button>
      <button type="button" onclick="shiftPlanDay(1)" aria-label="Следующий день">›</button>
    </div>
    <div class="date-strip" id="date-strip">
      ${days.map(d => {
        const key = dayKey(d);
        const past = key < dayKey(now);
        return `<button type="button" class="date-chip ${key === state.selectedDate ? 'selected' : ''} ${key === dayKey(now) ? 'today' : ''} ${past ? 'past' : ''}" data-date="${key}" onclick="selectDate('${key}')"><span>${new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d)}</span><strong>${d.getDate()}</strong></button>`;
      }).join('')}
    </div>
    <div class="section-head"><h3 style="text-transform:capitalize">${selectedTitle}</h3><span class="counter">${list.length}</span></div>
    ${list.length ? list.map(taskCard).join('') : '<div class="card empty">На этот день задач нет.</div>'}`;
  requestAnimationFrame(() => document.querySelector('.date-chip.selected')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
}

function renderAssistant() {
  document.querySelector('#assistant').innerHTML = `<div class="assistant-wrap">
    <div class="voice-note">🎙️ <div><strong>Голосовой разговор — версия 2</strong><br><small>Сейчас доступен текстовый режим</small></div></div>
    <div class="chips"><button type="button" class="chip" onclick="quickCommand('Что у меня сегодня?')">Что сегодня?</button><button type="button" class="chip" onclick="quickCommand('Что просрочено?')">Просрочено</button><button type="button" class="chip" onclick="quickCommand('Покажи проекты')">Проекты</button></div>
    <div class="chat" id="chat">${state.messages.map(m => `<div class="bubble ${m.role}">${esc(m.text)}</div>`).join('')}</div>
    <form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Напишите команду…"><button class="send" type="submit">↑</button></form>
  </div>`;
  document.querySelector('#chat-form').onsubmit = e => { e.preventDefault(); const input = document.querySelector('#chat-input'); quickCommand(input.value); input.value = ''; };
  requestAnimationFrame(() => { const c = document.querySelector('#chat'); if (c) c.scrollTop = c.scrollHeight; });
}

function renderProjects() {
  document.querySelector('#projects').innerHTML = state.projects.map(p => {
    const all = state.tasks.filter(t => t.project === p.id);
    const done = all.filter(t => t.completed).length;
    const progress = all.length ? Math.round(done / all.length * 100) : 0;
    return `<article class="card project"><div class="project-head"><span class="project-bar" style="background:${p.color}"></span><div style="flex:1"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p></div><strong>${progress}%</strong></div><div class="progress"><span style="width:${progress}%;background:${p.color}"></span></div><p>Открыто задач: ${all.filter(t => !t.completed).length}</p></article>`;
  }).join('');
}

function renderMore() {
  const completed = state.tasks.filter(t => t.completed).length;
  document.querySelector('#more').innerHTML = `
    <article class="card more-card"><div class="profile"><div class="avatar">АБ</div><div><strong>Альберт Беккер</strong><p style="margin:4px 0;color:var(--muted)">Начальник диспетчерской службы</p></div></div><div class="data-summary"><div><strong>${state.tasks.length}</strong><small>всего задач</small></div><div><strong>${completed}</strong><small>выполнено</small></div><div><strong>${state.projects.length}</strong><small>проектов</small></div></div></article>

    <div class="settings-title">Задачи и план</div>
    <div class="card settings-group">
      <div class="setting-row"><div class="setting-copy"><strong>Показывать выполненные</strong><small>Оставлять завершенные задачи в списках</small></div><label class="switch"><input type="checkbox" ${state.settings.showCompleted ? 'checked' : ''} onchange="setSetting('showCompleted',this.checked)"><span></span></label></div>
      <div class="setting-row"><div class="setting-copy"><strong>Подтверждать удаление</strong><small>Спрашивать перед удалением задачи</small></div><label class="switch"><input type="checkbox" ${state.settings.confirmDelete ? 'checked' : ''} onchange="setSetting('confirmDelete',this.checked)"><span></span></label></div>
      <div class="setting-row"><div class="setting-copy"><strong>Время новой задачи</strong><small>Значение по умолчанию</small></div><select onchange="setSetting('defaultTime',this.value)">${['09:00','12:00','15:00','18:00','20:00'].map(v => `<option value="${v}" ${state.settings.defaultTime === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    </div>

    <div class="settings-title">Уведомления</div>
    <div class="card settings-group">
      <div class="setting-row"><div class="setting-copy"><strong>Напоминания</strong><small>Системные уведомления в назначенное время</small></div><label class="switch"><input type="checkbox" ${state.settings.notifications ? 'checked' : ''} onchange="setSetting('notifications',this.checked)"><span></span></label></div>
      <button type="button" class="setting-row action-row" onclick="requestNotificationPermission()"><div class="setting-copy"><strong>Проверить разрешение</strong><small>Открыть запрос системных уведомлений</small></div><span>›</span></button>
    </div>

    <div class="settings-title">Данные</div>
    <div class="card settings-group">
      <button type="button" class="setting-row action-row" onclick="exportData()"><div class="setting-copy"><strong>Скопировать резервную копию</strong><small>Задачи, проекты и настройки в формате JSON</small></div><span>›</span></button>
      <button type="button" class="setting-row action-row" onclick="importData()"><div class="setting-copy"><strong>Восстановить из копии</strong><small>Вставить ранее сохраненные данные</small></div><span>›</span></button>
      <button type="button" class="setting-row action-row" onclick="clearCompleted()"><div class="setting-copy"><strong>Удалить выполненные задачи</strong><small>Сейчас выполнено: ${completed}</small></div><span>›</span></button>
      <button type="button" class="setting-row action-row danger" onclick="resetData()"><div class="setting-copy"><strong>Сбросить приложение</strong><small>Вернуть стартовые данные и настройки</small></div><span>›</span></button>
    </div>

    <article class="card more-card voice-v2"><div style="font-size:30px">〽</div><h3>Версия 2: голосовой разговор</h3><p>Потоковый диалог, озвучивание плана и подтверждение действий голосом.</p></article>
    <p style="text-align:center;color:var(--muted);margin-top:24px">Штаб AI · 1.1.0</p>`;
}

window.toggleTask = id => {
  const t = state.tasks.find(t => t.id === id);
  if (t) { t.completed = !t.completed; save(); render(); }
};

window.deleteTask = id => {
  const remove = () => {
    if (native()) try { Android.cancelNotification(id); } catch {}
    state.tasks = state.tasks.filter(t => t.id !== id);
    save();
    render();
  };
  if (!state.settings.confirmDelete || confirm('Удалить задачу?')) remove();
};

window.selectDate = key => { state.selectedDate = key; save(); render(); };
window.shiftPlanDay = amount => { state.selectedDate = dayKey(addDays(selectedDateObject(), amount)); save(); render(); };
window.goToPlanToday = () => { state.selectedDate = dayKey(now); page = 'plan'; save(); render(); };

function closeTaskDialog() {
  const dialog = document.querySelector('#task-dialog');
  document.querySelector('#task-form').reset();
  document.querySelector('#task-title-error').hidden = true;
  if (dialog.open) dialog.close();
}
window.closeTaskDialog = closeTaskDialog;

window.openTaskDialog = tomorrow => {
  const dialog = document.querySelector('#task-dialog');
  const baseDate = page === 'plan' && !tomorrow ? selectedDateObject() : (tomorrow ? addDays(now, 1) : now);
  document.querySelector('#task-form').reset();
  document.querySelector('#task-title').value = '';
  document.querySelector('#task-date').value = dayKey(baseDate);
  document.querySelector('#task-time').value = state.settings.defaultTime;
  document.querySelector('#task-project').innerHTML = '<option value="">Без проекта</option>' + state.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  document.querySelector('#task-title-error').hidden = true;
  dialog.showModal();
  setTimeout(() => document.querySelector('#task-title').focus(), 50);
};

function parseDue(text) {
  let d = new Date();
  const s = text.toLowerCase();
  if (s.includes('послезавтра')) d = addDays(d, 2);
  else if (s.includes('завтра')) d = addDays(d, 1);
  let h = Number(state.settings.defaultTime.split(':')[0]);
  let m = Number(state.settings.defaultTime.split(':')[1]);
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
    const a = state.tasks.filter(t => !t.completed && due(t) < new Date());
    return a.length ? a.map(t => `• ${short(due(t))}, ${t.time} — ${t.title}`).join('\n') : 'Просроченных задач нет.';
  }
  if (l.includes('покажи проекты') || l === 'проекты') {
    return state.projects.map(p => `• ${p.name}: открыто ${state.tasks.filter(t => t.project === p.id && !t.completed).length}`).join('\n');
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
    state.tasks.push({ id: uid(), title: name[0].toUpperCase() + name.slice(1), date: dayKey(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, project: p?.id || '', priority: 'normal', completed: false });
    return `Создал задачу «${name}» на ${short(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}.`;
  }
  return 'В версии 1.1 я понимаю команды: создать или завершить задачу, показать план на сегодня, просроченное и проекты.';
}

window.quickCommand = text => {
  text = String(text || '').trim();
  if (!text) return;
  state.messages.push({ role: 'user', text });
  state.messages.push({ role: 'assistant', text: answer(text) });
  save();
  page = 'assistant';
  render();
};

window.setSetting = (key, value) => {
  state.settings[key] = value;
  if (key === 'notifications' && value && native()) try { Android.requestNotifications(); } catch {}
  save();
  render();
  toast('Настройка сохранена');
};

window.requestNotificationPermission = () => {
  if (native()) {
    try { Android.requestNotifications(); state.settings.notifications = true; save(); render(); toast('Запрос разрешения отправлен'); } catch { toast('Не удалось открыть разрешение'); }
  } else toast('Системные уведомления доступны в APK');
};

window.exportData = async () => {
  const copy = JSON.stringify(state);
  try {
    await navigator.clipboard.writeText(copy);
    toast('Резервная копия скопирована');
  } catch {
    prompt('Скопируйте резервную копию:', copy);
  }
};

window.importData = () => {
  const raw = prompt('Вставьте резервную копию приложения:');
  if (!raw) return;
  try {
    const restored = JSON.parse(raw);
    if (!Array.isArray(restored.tasks) || !Array.isArray(restored.projects)) throw new Error('invalid');
    state = { ...restored, settings: { ...defaultSettings(), ...(restored.settings || {}) }, messages: Array.isArray(restored.messages) ? restored.messages : [], selectedDate: restored.selectedDate || dayKey(now) };
    save();
    render();
    toast('Данные восстановлены');
  } catch {
    alert('Не удалось восстановить данные: резервная копия имеет неверный формат.');
  }
};

window.clearCompleted = () => {
  const count = state.tasks.filter(t => t.completed).length;
  if (!count) return toast('Выполненных задач нет');
  if (confirm(`Удалить выполненные задачи: ${count}?`)) {
    state.tasks.filter(t => t.completed).forEach(t => { if (native()) try { Android.cancelNotification(t.id); } catch {} });
    state.tasks = state.tasks.filter(t => !t.completed);
    save();
    render();
    toast('Выполненные задачи удалены');
  }
};

window.resetData = () => {
  if (confirm('Удалить текущие данные и вернуть стартовые?')) {
    state.tasks.forEach(t => { if (native()) try { Android.cancelNotification(t.id); } catch {} });
    state = seed();
    save();
    render();
    toast('Стартовые данные восстановлены');
  }
};

document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => { page = b.dataset.page; render(); });
document.querySelector('#fab').onclick = () => openTaskDialog(false);
document.querySelector('#task-close').onclick = closeTaskDialog;
document.querySelector('#task-cancel').onclick = closeTaskDialog;
document.querySelector('#task-dialog').addEventListener('cancel', e => { e.preventDefault(); closeTaskDialog(); });
document.querySelector('#task-title').addEventListener('input', () => { document.querySelector('#task-title-error').hidden = true; });
document.querySelector('#task-form').onsubmit = e => {
  e.preventDefault();
  const title = document.querySelector('#task-title').value.trim();
  if (!title) {
    document.querySelector('#task-title-error').hidden = false;
    document.querySelector('#task-title').focus();
    return;
  }
  const date = document.querySelector('#task-date').value || dayKey(now);
  const time = document.querySelector('#task-time').value || state.settings.defaultTime;
  state.tasks.push({ id: uid(), title, date, time, project: document.querySelector('#task-project').value, priority: document.querySelector('#task-priority').value, completed: false });
  state.selectedDate = date;
  save();
  closeTaskDialog();
  render();
  toast('Задача создана');
};
document.querySelector('#notify-btn').onclick = () => { page = 'more'; render(); };

render();
syncAllNotifications();
